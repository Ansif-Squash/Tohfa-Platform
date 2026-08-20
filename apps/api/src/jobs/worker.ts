#!/usr/bin/env tsx
/**
 * BullMQ worker process. Run with `pnpm dev:worker`.
 *
 * Deliberately a SEPARATE process from the API: a runaway job must not be able
 * to starve HTTP request handling, and the two scale independently.
 */
import { Worker, type Job } from 'bullmq';
import { closePool, pool } from '../db/pool.js';
import { logger, newTraceId, runWithContext } from '../logger.js';
import { closeRedis, queueRedis } from '../redis.js';
import {
  QUEUE_NAME,
  closeQueue,
  registerRepeatableJobs,
  type JobName,
  type JobPayloads,
} from './queue.js';

type Handler<N extends JobName> = (payload: JobPayloads[N], job: Job) => Promise<void>;

/**
 * EXAMPLE JOB — copy this shape for every new handler.
 *
 * Sweeps farm certificates that have expired or will expire within
 * `horizonDays`, so listings under a lapsed certification can be blocked with
 * CERT_EXPIRED before a customer ever sees them.
 */
const certificateExpirySweep: Handler<'certificate-expiry-sweep'> = async (payload) => {
  logger.info({ horizonDays: payload.horizonDays }, 'certificate-expiry-sweep: starting');

  // TODO(STORY-FARM-08): replace this probe with the real sweep:
  //   1. SELECT certificates WHERE valid_to < now() + $1 AND status <> 'EXPIRED'
  //   2. UPDATE them to EXPIRED / EXPIRING_SOON inside one transaction
  //   3. writeAuditLog for each transition
  //   4. enqueue farmer notifications
  const probe = await pool.query<{ now: string }>('SELECT now()::text AS now');

  logger.info(
    { serverTime: probe.rows[0]?.now, horizonDays: payload.horizonDays },
    'certificate-expiry-sweep: finished (stub)',
  );
};

const HANDLERS: { [N in JobName]: Handler<N> } = {
  'certificate-expiry-sweep': certificateExpirySweep,
};

async function dispatch(job: Job): Promise<void> {
  const name = job.name as JobName;
  const handler = HANDLERS[name] as ((payload: unknown, job: Job) => Promise<void>) | undefined;

  if (handler === undefined) {
    // Unknown job names are a deploy-skew symptom; fail so BullMQ retries after
    // the new worker rolls out rather than silently dropping the work.
    throw new Error(`No handler registered for job "${job.name}"`);
  }

  await handler(job.data, job);
}

export const worker = new Worker(
  QUEUE_NAME,
  async (job: Job) =>
    runWithContext({ traceId: newTraceId() }, async () => {
      const startedAt = Date.now();
      logger.info({ job: job.name, jobId: job.id }, 'job started');
      await dispatch(job);
      logger.info(
        { job: job.name, jobId: job.id, ms: Date.now() - startedAt },
        'job completed',
      );
    }),
  { connection: queueRedis, concurrency: 4 },
);

worker.on('failed', (job, error) => {
  logger.error({ err: error, job: job?.name, jobId: job?.id }, 'job failed');
});

async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, 'worker shutting down');
  await worker.close();
  await closeQueue();
  await closePool();
  await closeRedis();
  process.exit(0);
}

// `import.meta.url` check keeps this file importable from tests without
// spawning a worker as a side effect.
if (process.env['TOHFA_WORKER_AUTOSTART'] !== 'false') {
  registerRepeatableJobs()
    .then((names) => logger.info({ jobs: names }, 'repeatable jobs registered'))
    .catch((error: unknown) => logger.error({ err: error }, 'failed to register repeatable jobs'));

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}
