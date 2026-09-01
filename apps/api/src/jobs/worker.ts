#!/usr/bin/env tsx
/**
 * BullMQ worker process. Run with `pnpm dev:worker`.
 *
 * Deliberately a SEPARATE process from the API: a runaway job must not be able
 * to starve HTTP request handling, and the two scale independently.
 */
import { Worker, type Job } from 'bullmq';
import { closePool, pool, withTransaction } from '../db/pool.js';
import { logger, newTraceId, runWithContext } from '../logger.js';
import { closeRedis, queueRedis } from '../redis.js';
import {
  JOB_TRACE_FIELD,
  QUEUE_NAME,
  closeQueue,
  registerRepeatableJobs,
  type JobName,
  type JobPayloads,
} from './queue.js';
import { initSentry, reportError } from '../obs/sentry.js';

import { certificationsRepo } from '../modules/certifications/certifications.repo.js';
import { counterOffersService } from '../modules/listings/counter-offers.service.js';
import { topupRepo } from '../modules/topup/topup.repo.js';
import { cartRepo } from '../modules/cart/cart.repo.js';

type Handler<N extends JobName> = (payload: JobPayloads[N], job: Job) => Promise<void>;

/**
 * BR-01, BR-38: Sweeps farm certificates, evaluates market block state using
 * the single shared recompute function in Asia/Kolkata timezone, logs audit
 * transitions, and records run metrics into job_runs.
 */
export const certificateExpirySweep: Handler<'certificate-expiry-sweep'> = async (payload) => {
  logger.info({ horizonDays: payload.horizonDays }, 'certificate-expiry-sweep: starting');

  // 1. Create job_runs tracking record
  const runResult = await pool.query<{ id: string }>(
    `INSERT INTO job_runs (job_name, status, started_at)
     VALUES ('certificate-expiry-sweep', 'RUNNING', now())
     RETURNING id`,
  );
  const runId = runResult.rows[0]?.id;

  try {
    // 2. Fetch all active farmers
    const farmerIds = await certificationsRepo.getAllActiveFarmerIds(pool);
    let itemsProcessed = 0;

    // 3. Recompute each farmer's market block status
    for (const farmerId of farmerIds) {
      const result = await withTransaction(async (tx) => {
        return certificationsRepo.recomputeFarmerMarketBlock(
          tx,
          farmerId,
          null,
          'SYSTEM',
          'JOB',
        );
      });

      if (result.changed) {
        itemsProcessed += 1;
      }
    }

    // 4. Mark job_run as succeeded
    if (runId !== undefined) {
      await pool.query(
        `UPDATE job_runs
            SET status = 'SUCCEEDED',
                finished_at = now(),
                items_scanned = $2,
                items_processed = $3,
                updated_at = now()
          WHERE id = $1`,
        [runId, farmerIds.length, itemsProcessed],
      );
    }

    logger.info(
      { itemsScanned: farmerIds.length, itemsProcessed },
      'certificate-expiry-sweep: completed',
    );
  } catch (error) {
    if (runId !== undefined) {
      await pool.query(
        `UPDATE job_runs
            SET status = 'FAILED',
                finished_at = now(),
                error = $2,
                updated_at = now()
          WHERE id = $1`,
        [runId, (error as Error).message],
      );
    }
    throw error;
  }
};

export const counterOfferExpirySweep: Handler<'counter-offer-expiry-sweep'> = async (
  payload,
) => {
  logger.info({ batchSize: payload.batchSize }, 'counter-offer-expiry-sweep: starting');

  const runResult = await pool.query<{ id: string }>(
    `INSERT INTO job_runs (job_name, status, started_at)
     VALUES ('counter-offer-expiry-sweep', 'RUNNING', now())
     RETURNING id`,
  );
  const runId = runResult.rows[0]?.id;

  try {
    const result = await counterOffersService.sweepExpiredOffers();

    if (runId !== undefined) {
      await pool.query(
        `UPDATE job_runs
            SET status = 'SUCCEEDED',
                finished_at = now(),
                items_scanned = $2,
                items_processed = $3,
                updated_at = now()
          WHERE id = $1`,
        [runId, result.scanned, result.offersLapsed],
      );
    }

    logger.info(
      {
        scanned: result.scanned,
        offersLapsed: result.offersLapsed,
        listingsReverted: result.listingsReverted,
      },
      'counter-offer-expiry-sweep: completed',
    );
  } catch (error) {
    if (runId !== undefined) {
      await pool.query(
        `UPDATE job_runs
            SET status = 'FAILED',
                finished_at = now(),
                error = $2,
                updated_at = now()
          WHERE id = $1`,
        [runId, (error as Error).message],
      );
    }
    throw error;
  }
};

export const dailyCashReconciliation: Handler<'daily-cash-reconciliation'> = async (payload) => {
  logger.info({ payload }, 'daily-cash-reconciliation: starting');

  const runResult = await pool.query<{ id: string }>(
    `INSERT INTO job_runs (job_name, status, started_at)
     VALUES ('daily-cash-reconciliation', 'RUNNING', now())
     RETURNING id`,
  );
  const runId = runResult.rows[0]?.id;

  try {
    let targetDate = payload.targetDate;
    if (!targetDate) {
      const dateRes = await pool.query<{ yest: string }>(
        `SELECT (CURRENT_DATE - interval '1 day')::text AS yest`,
      );
      targetDate = dateRes.rows[0]!.yest;
    }

    const reconciliationRows = await topupRepo.getDailyCashReconciliation(pool, targetDate);

    for (const row of reconciliationRows) {
      if (row.topupTotal !== row.ledgerTotal) {
        logger.error(
          { warehouseId: row.warehouseId, topupTotal: row.topupTotal, ledgerTotal: row.ledgerTotal, date: targetDate },
          'daily-cash-reconciliation: DISCREPANCY DETECTED between cash topups and ledger',
        );
      } else {
        logger.info(
          { warehouseId: row.warehouseId, total: row.topupTotal, count: row.count, date: targetDate },
          'daily-cash-reconciliation: warehouse cash reconciled successfully',
        );
      }
    }

    if (runId !== undefined) {
      await pool.query(
        `UPDATE job_runs
            SET status = 'SUCCEEDED',
                finished_at = now(),
                items_scanned = $2,
                items_processed = $2,
                updated_at = now()
          WHERE id = $1`,
        [runId, reconciliationRows.length],
      );
    }

    logger.info({ warehousesReconciled: reconciliationRows.length, targetDate }, 'daily-cash-reconciliation: completed');
  } catch (error) {
    if (runId !== undefined) {
      await pool.query(
        `UPDATE job_runs
            SET status = 'FAILED',
                finished_at = now(),
                error = $2,
                updated_at = now()
          WHERE id = $1`,
        [runId, (error as Error).message],
      );
    }
    throw error;
  }
};

export const cartLockReaper: Handler<'cart-lock-reaper'> = async (payload) => {
  logger.info({ payload }, 'cart-lock-reaper: starting');

  const runResult = await pool.query<{ id: string }>(
    `INSERT INTO job_runs (job_name, status, started_at)
     VALUES ('cart-lock-reaper', 'RUNNING', now())
     RETURNING id`,
  );
  const runId = runResult.rows[0]?.id;

  try {
    const result = await cartRepo.reapExpiredCarts(pool, payload.batchSize ?? 500);

    if (runId !== undefined) {
      await pool.query(
        `UPDATE job_runs
            SET status = 'SUCCEEDED',
                finished_at = now(),
                items_scanned = $2,
                items_processed = $3,
                updated_at = now()
          WHERE id = $1`,
        [runId, result.scanned, result.releasedLines],
      );
    }

    logger.info(
      {
        scanned: result.scanned,
        expiredCarts: result.expiredCarts,
        releasedLines: result.releasedLines,
      },
      'cart-lock-reaper: completed',
    );
  } catch (error) {
    if (runId !== undefined) {
      await pool.query(
        `UPDATE job_runs
            SET status = 'FAILED',
                finished_at = now(),
                error = $2,
                updated_at = now()
          WHERE id = $1`,
        [runId, (error as Error).message],
      );
    }
    throw error;
  }
};

const HANDLERS: { [N in JobName]: Handler<N> } = {
  'certificate-expiry-sweep': certificateExpirySweep,
  'counter-offer-expiry-sweep': counterOfferExpirySweep,
  'daily-cash-reconciliation': dailyCashReconciliation,
  'cart-lock-reaper': cartLockReaper,
};

// Start Sentry before any job can fail so worker errors are reportable.
initSentry();

async function dispatch(job: Job): Promise<void> {
  const name = job.name as JobName;
  const handler = HANDLERS[name] as ((payload: unknown, job: Job) => Promise<void>) | undefined;

  if (handler === undefined) {
    // Unknown job names are a deploy-skew symptom; fail so BullMQ retries after
    // the new worker rolls out rather than silently dropping the work.
    throw new Error(`No handler registered for job "${job.name}"`);
  }

  // Strip the reserved tracing field so handlers only ever see their payload.
  const data = { ...(job.data as Record<string, unknown>) };
  delete data[JOB_TRACE_FIELD];
  await handler(data, job);
}

export const worker = new Worker(
  QUEUE_NAME,
  async (job: Job) => {
    // Re-establish the correlation context carried from the enqueueing request
    // (or start a fresh one for repeatable/scheduled work). Every log line the
    // job emits then carries the same traceId that returned to the client.
    const carried = (job.data as Record<string, unknown>)[JOB_TRACE_FIELD];
    const traceId = typeof carried === 'string' && carried.length > 0 ? carried : newTraceId();

    await runWithContext({ traceId }, async () => {
      const startedAt = Date.now();
      logger.info({ job: job.name, jobId: job.id }, 'job started');
      try {
        await dispatch(job);
        logger.info(
          { job: job.name, jobId: job.id, ms: Date.now() - startedAt },
          'job completed',
        );
      } catch (error) {
        reportError({ error, tags: { job: job.name, env: 'worker' } });
        throw error;
      }
    });
  },
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
  initSentry();
  registerRepeatableJobs()
    .then((names) => logger.info({ jobs: names }, 'repeatable jobs registered'))
    .catch((error: unknown) => logger.error({ err: error }, 'failed to register repeatable jobs'));

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}
