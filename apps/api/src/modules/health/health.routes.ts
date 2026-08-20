/**
 * Liveness and readiness probes.
 *
 * /healthz  — is the process alive? No dependencies touched. Kubernetes uses
 *             this for the liveness probe; a failing dependency must NOT cause
 *             a restart loop.
 * /readyz   — can this instance serve traffic? Checks Postgres and Redis.
 *             Returns 503 when a dependency is down so the load balancer takes
 *             the instance out of rotation without killing it.
 *
 * Neither route is authenticated; neither leaks anything beyond up/down.
 */
import { Router } from 'express';
import { pingDatabase } from '../../db/pool.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { logger } from '../../logger.js';
import { pingRedis } from '../../redis.js';

export const healthRouter: Router = Router();

const startedAt = Date.now();

healthRouter.get('/healthz', (_req, res) => {
  res.json({
    status: 'ok',
    uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
  });
});

healthRouter.get(
  '/readyz',
  asyncHandler(async (_req, res) => {
    const [database, redis] = await Promise.all([check(pingDatabase), check(pingRedis)]);
    const ready = database.ok && redis.ok;

    if (!ready) {
      logger.warn({ database, redis }, 'readiness check failed');
    }

    res.status(ready ? 200 : 503).json({
      status: ready ? 'ready' : 'degraded',
      checks: { database, redis },
    });
  }),
);

interface CheckResult {
  ok: boolean;
  ms: number;
  error?: string;
}

async function check(probe: () => Promise<boolean>): Promise<CheckResult> {
  const startedAtMs = Date.now();
  try {
    const ok = await probe();
    return { ok, ms: Date.now() - startedAtMs };
  } catch (error) {
    return {
      ok: false,
      ms: Date.now() - startedAtMs,
      error: error instanceof Error ? error.message : 'unknown error',
    };
  }
}
