/**
 * Redis connections.
 *
 * Two separate clients on purpose:
 *  - `redis`      general purpose (OTP storage, cart locks, rate limiting).
 *  - `queueRedis` reserved for BullMQ, which requires
 *                 `maxRetriesPerRequest: null` and blocks connections for its
 *                 workers. Sharing one client makes queues and app code stall
 *                 each other.
 */
import { Redis, type RedisOptions } from 'ioredis';
import { config } from './config.js';
import { logger } from './logger.js';

const baseOptions: RedisOptions = {
  // In tests we connect on first use so that importing a module does not open
  // a socket; in every other environment we connect eagerly so a bad REDIS_URL
  // shows up at boot rather than on the first OTP request.
  lazyConnect: config.isTest,
  enableReadyCheck: true,
  connectTimeout: 5_000,
  retryStrategy: (attempt: number) => Math.min(attempt * 200, 5_000),
};

export const redis = new Redis(config.REDIS_URL, {
  ...baseOptions,
  maxRetriesPerRequest: 3,
});

/** BullMQ mandates `maxRetriesPerRequest: null`; do not "tidy" this away. */
export const queueRedis = new Redis(config.REDIS_URL, {
  ...baseOptions,
  maxRetriesPerRequest: null,
});

for (const [name, client] of [
  ['redis', redis],
  ['queueRedis', queueRedis],
] as const) {
  client.on('error', (error: Error) => {
    logger.error({ err: error, client: name }, 'redis client error');
  });
}

export async function pingRedis(): Promise<boolean> {
  const reply = await redis.ping();
  return reply === 'PONG';
}

export async function closeRedis(): Promise<void> {
  await Promise.allSettled([redis.quit(), queueRedis.quit()]);
}
