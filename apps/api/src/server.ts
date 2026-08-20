#!/usr/bin/env tsx
/**
 * HTTP entrypoint. Boots the app, then drains cleanly on SIGTERM so in-flight
 * requests finish before the container goes away.
 */
import { createApp } from './app.js';
import { config } from './config.js';
import { closePool } from './db/pool.js';
import { logger } from './logger.js';
import { closeRedis } from './redis.js';
import { loadRbac } from './rbac/loadRbac.js';

// Load and validate docs/rbac.json before accepting traffic: a malformed
// permission matrix must stop the deploy, not fail the first request.
const rbac = loadRbac();

const app = createApp();

const server = app.listen(config.PORT, () => {
  logger.info(
    {
      port: config.PORT,
      env: config.NODE_ENV,
      rbacVersion: rbac.version,
      permissions: rbac.byCode.size,
      paymentProvider: config.PAYMENT_PROVIDER,
      smsProvider: config.SMS_PROVIDER,
    },
    'tohfa api listening',
  );
});

// Slightly above the typical 60s load-balancer idle timeout, so the LB closes
// connections first and we never race it.
server.keepAliveTimeout = 65_000;
server.headersTimeout = 66_000;

let shuttingDown = false;

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, 'shutting down');

  const forceExit = setTimeout(() => {
    logger.error('graceful shutdown timed out; forcing exit');
    process.exit(1);
  }, 15_000);
  forceExit.unref();

  await new Promise<void>((resolve) => server.close(() => resolve()));
  await closePool();
  await closeRedis();

  logger.info('shutdown complete');
  process.exit(0);
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error({ err: reason }, 'unhandled promise rejection');
});

export { app, server };
