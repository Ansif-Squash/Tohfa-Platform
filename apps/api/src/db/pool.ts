/**
 * Postgres access.
 *
 * Two rules for every repository in this codebase:
 *   1. Take an `Executor` (pool OR client) as the first argument. That is what
 *      lets a service compose several repo calls inside one transaction.
 *   2. Never interpolate values into SQL. Always `$1, $2, ...`.
 */
import pg from 'pg';
import { config } from '../config.js';
import { logger } from '../logger.js';

const { Pool, types } = pg;

/**
 * pg returns NUMERIC as a string by default and we KEEP it that way — see the
 * float rant in packages/shared-types/src/money.ts. This is here to document
 * the decision and to stop a future contributor "fixing" it with a parseFloat.
 */
types.setTypeParser(1700, (value: string) => value); // NUMERIC / DECIMAL
types.setTypeParser(20, (value: string) => value); // BIGINT — may exceed 2^53

export const pool = new Pool({
  connectionString: config.DATABASE_URL,
  max: config.isTest ? 4 : 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  application_name: 'tohfa-api',
});

pool.on('error', (error: Error) => {
  logger.error({ err: error }, 'idle postgres client errored');
});

/**
 * Anything you can run a query on: the pool, or a client inside a transaction.
 * Declared structurally (rather than `Pool | PoolClient`) so repositories stay
 * agnostic and are trivially mockable in unit tests.
 */
export interface Executor {
  query<R extends pg.QueryResultRow = pg.QueryResultRow>(
    sql: string,
    params?: unknown[],
  ): Promise<pg.QueryResult<R>>;
}

/**
 * Run `fn` inside a single transaction, committing on success and rolling back
 * on any throw. Audit writes MUST use the same client so they roll back with
 * the business change they describe.
 *
 * ```ts
 * await withTransaction(async (tx) => {
 *   const listing = await listingRepo.approve(tx, id);
 *   await writeAuditLog(tx, { ... });
 *   return listing;
 * });
 * ```
 */
export async function withTransaction<T>(
  fn: (tx: pg.PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      logger.error({ err: rollbackError }, 'rollback failed');
    }
    throw error;
  } finally {
    client.release();
  }
}

/** Cheap liveness probe used by /readyz. */
export async function pingDatabase(): Promise<boolean> {
  const result = await pool.query<{ ok: number }>('SELECT 1 AS ok');
  return result.rows[0]?.ok === 1;
}

export async function closePool(): Promise<void> {
  await pool.end();
}
