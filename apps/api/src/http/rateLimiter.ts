import type { RequestHandler } from 'express';
import { redis } from '../redis.js';
import { AppError } from './problem.js';

export interface RateLimitOptions {
  windowSeconds?: number;
  maxRequests?: number;
  keyPrefix?: string;
}

/**
 * Redis-backed sliding window rate limiter middleware.
 *
 * Keys by BOTH client IP address and mobile number (when present in body) to
 * prevent IP-bypass via mobile NATs and number enumeration.
 */
export function createRateLimiter(options: RateLimitOptions = {}): RequestHandler {
  const windowSeconds = options.windowSeconds ?? 60;
  const maxRequests = options.maxRequests ?? 20;
  const keyPrefix = options.keyPrefix ?? 'rl';

  return async (req, res, next) => {
    try {
      const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
      const mobile =
        typeof req.body?.mobile === 'string'
          ? req.body.mobile
          : typeof req.body?.phoneNumber === 'string'
          ? req.body.phoneNumber
          : 'anonymous';

      const key = `ratelimit:${keyPrefix}:${ip}:${mobile}`;
      const now = Date.now();
      const clearBefore = now - windowSeconds * 1000;

      // Pipeline Redis operations for sliding window ZSET
      const pipeline = redis.pipeline();
      pipeline.zremrangebyscore(key, 0, clearBefore);
      pipeline.zadd(key, now, `${now}-${Math.random()}`);
      pipeline.zcard(key);
      pipeline.expire(key, windowSeconds);

      const results = await pipeline.exec();
      const currentCount = (results?.[2]?.[1] as number) || 1;

      if (currentCount > maxRequests) {
        res.setHeader('Retry-After', windowSeconds.toString());
        throw new AppError('RATE_LIMITED', {
          status: 429,
          detail: `Rate limit exceeded. Try again in ${windowSeconds} seconds.`,
          meta: { retryAfterSeconds: windowSeconds },
        });
      }

      next();
    } catch (err) {
      if (err instanceof AppError) {
        next(err);
      } else {
        // If Redis is unavailable, log and fail-open to not block auth traffic
        next();
      }
    }
  };
}
