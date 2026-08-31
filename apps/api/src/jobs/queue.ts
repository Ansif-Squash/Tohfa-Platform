/**
 * BullMQ queue definitions.
 *
 * There is ONE queue (`tohfa`) with named jobs rather than a queue per job.
 * That keeps Redis key sprawl down and lets the worker share a single
 * connection. Add a job by:
 *   1. adding an entry to `JOB_REGISTRY` below (name + payload type + schedule)
 *   2. adding its handler in worker.ts
 * The registry is the single place that answers "what runs on a timer?".
 */
import { Queue, type JobsOptions, type RepeatOptions } from 'bullmq';
import { queueRedis } from '../redis.js';
import { currentTraceId } from '../logger.js';

export const QUEUE_NAME = 'tohfa';

/**
 * Reserved field on every job payload that carries the requesting correlation
 * id. `enqueue` copies the ambient traceId onto the job so the worker can
 * re-establish the same logging context, letting a job log line be traced back
 * to the request that queued it (S-20).
 */
export const JOB_TRACE_FIELD = 'correlationId';

/** Payload shape for every named job. Extend this, never use `any`. */
export interface JobPayloads {
  /** Flags farm certificates that expire soon / have expired. */
  'certificate-expiry-sweep': { horizonDays: number };
  /**
   * BR-10b: lapses counter-offers past their window and returns their listings
   * to the admin queue. idempotent by construction (guarded PENDING update).
   */
  'counter-offer-expiry-sweep': { batchSize: number };
  /**
   * Daily reconciliation summing yesterday's CASH topups per warehouse against
   * the ledger (wallet_transactions). Idempotent.
   */
  'daily-cash-reconciliation': { targetDate?: string };
  // TODO(STORY-ORD-11): 'cart-lock-reaper': { }
  // TODO(STORY-FIN-09): 'payout-settlement-poll': { }
}

export type JobName = keyof JobPayloads;

export interface JobDefinition<N extends JobName = JobName> {
  name: N;
  description: string;
  /** Default payload used when the job is scheduled repeatably. */
  defaultPayload: JobPayloads[N];
  /** Omit for jobs that are only ever enqueued on demand. */
  repeat?: RepeatOptions;
}

/**
 * Every named job in the system. Repeatable jobs are (re)registered on worker
 * boot; BullMQ deduplicates by name + repeat key, so boot is idempotent.
 */
export const JOB_REGISTRY: { [N in JobName]: JobDefinition<N> } = {
  'certificate-expiry-sweep': {
    name: 'certificate-expiry-sweep',
    description:
      'Finds farm certificates expiring within the horizon, flags them and notifies the farmer.',
    defaultPayload: { horizonDays: 30 },
    // 02:15 IST every day — off-peak for the warehouses.
    repeat: { pattern: '15 2 * * *', tz: 'Asia/Kolkata' },
  },
  'counter-offer-expiry-sweep': {
    name: 'counter-offer-expiry-sweep',
    description:
      'BR-10b: lapses unanswered counter-offers past their 24h window and returns their listings to the admin queue. Idempotent.',
    defaultPayload: { batchSize: 500 },
    // Every 15 minutes — a lapsed offer must stop blocking a listing promptly.
    repeat: { pattern: '*/15 * * * *', tz: 'Asia/Kolkata' },
  },
  'daily-cash-reconciliation': {
    name: 'daily-cash-reconciliation',
    description:
      'Daily cash reconciliation summing yesterday CASH topups per warehouse against ledger. Idempotent.',
    defaultPayload: {},
    // 01:00 IST every day
    repeat: { pattern: '0 1 * * *', tz: 'Asia/Kolkata' },
  },
};

export const defaultJobOptions: JobsOptions = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 5_000 },
  removeOnComplete: { age: 24 * 3600, count: 1_000 },
  removeOnFail: { age: 7 * 24 * 3600 },
};

export const jobQueue = new Queue(QUEUE_NAME, {
  connection: queueRedis,
  defaultJobOptions,
});

/** Enqueue a job now. Type-safe: the payload must match the job name. */
export async function enqueue<N extends JobName>(
  name: N,
  payload: JobPayloads[N],
  options: JobsOptions = {},
): Promise<void> {
  // Carry the requesting correlation id so the worker can re-establish the
  // same logging context for the whole job run.
  const traceId = currentTraceId();
  const data = traceId === undefined ? payload : { ...payload, [JOB_TRACE_FIELD]: traceId };
  await jobQueue.add(name, data, options);
}

/** Register (or refresh) every repeatable job. Called by the worker at boot. */
export async function registerRepeatableJobs(): Promise<string[]> {
  const registered: string[] = [];
  for (const definition of Object.values(JOB_REGISTRY) as JobDefinition[]) {
    if (definition.repeat === undefined) continue;
    await jobQueue.add(definition.name, definition.defaultPayload, {
      repeat: definition.repeat,
      jobId: `repeat:${definition.name}`,
    });
    registered.push(definition.name);
  }
  return registered;
}

export async function closeQueue(): Promise<void> {
  await jobQueue.close();
}
