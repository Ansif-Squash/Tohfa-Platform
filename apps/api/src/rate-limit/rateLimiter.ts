/**
 * Redis-backed sliding-window rate limiter (S-20).
 *
 * Individual endpoints opt in by mounting this middleware. It is defence in
 * depth on top of the BR-32 OTP challenge lockout: the limiter throttles by
 * mobile AND by IP so that neither a mobile-network NAT (which defeats an
 * IP-only limit) nor a single host (which can enumerate numbers against a
 * mobile-only limit) can bypass it.
 *
 * The shared client (apps/api/src/redis.ts) is reused. A Lua script keeps the
 * prune + count + cap atomic, so no lock is needed.
 *
 * IMPORTANT: the limiter FAILS OPEN. Losing Redis must not brick the auth
 * surface — the per-challenge BR-32 lockout still guards the actual OTP.
 */
import type { Request, RequestHandler } from 'express';
import type { Redis } from 'ioredis';
import { config } from '../config.js';
import { AppError } from '../http/problem.js';
import { logger } from '../logger.js';
import { redis } from '../redis.js';

export interface RateLimit {
  /** Width of the sliding window, in seconds. */
  windowSeconds: number;
  /** Maximum requests allowed inside one window. */
  max: number;
}

export interface RateBucketConsumption {
  /** True when the request may proceed (the window is not yet saturated). */
  allowed: boolean;
  /** Number of requests recorded inside the current window. */
  count: number;
  /** Seconds to wait before retrying (0 when allowed). */
  retryAfterSeconds: number;
}

interface Bucket {
  limited: boolean;
  retryAfterSeconds: number;
}

/**
 * Atomic sliding-window check-and-count on a sorted set:
 *   member  = timestamp (score) + a random tail so the set has real members
 *   ZCARD   = how many requests are already inside the window
 *   oldest  = when the entry that drops out first expires (used as a delay)
 *
 * Returns `[count, retryAfterMs]`, where count is the number of already
 * recorded requests; the current request is recorded only when count < max.
 */
const SLIDING_WINDOW_SCRIPT = `
local key      = KEYS[1]
local now      = tonumber(ARGV[1])
local windowMs = tonumber(ARGV[2])
local maxCount = tonumber(ARGV[3])

redis.call('ZREMRANGEBYSCORE', key, '-inf', now - windowMs)
local count = redis.call('ZCARD', key)

if count < maxCount then
  local member = now .. ':' .. math.floor(math.random() * 1e9)
  redis.call('ZADD', key, now, member)
end

redis.call('PEXPIRE', key, windowMs)

local earliest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
local oldestScore = 0
if earliest and earliest[1] then oldestScore = tonumber(earliest[2]) end
local retryAfterMs = math.max(0, windowMs - (now - oldestScore))

return { count, retryAfterMs }
`;

/**
 * Consume one unit from `key` against `limit`. Pure helper (no Express) so it
 * can be unit-tested with a fake Redis client.
 */
export async function consumeBucket(
  client: Redis,
  key: string,
  limit: RateLimit,
): Promise<RateBucketConsumption> {
  const now = Date.now();
  const windowMs = Math.round(limit.windowSeconds * 1000);
  const [count, retryAfterMs] = (await client.eval(
    SLIDING_WINDOW_SCRIPT,
    1,
    key,
    String(now),
    String(windowMs),
    String(limit.max),
  )) as [number, number];

  const limited = count >= limit.max;
  return {
    allowed: !limited,
    count,
    retryAfterSeconds: limited ? Math.ceil(retryAfterMs / 1000) : 0,
  };
}

/** Fail-safe consume: any Redis error is logged and treated as "not limited". */
async function consumeOrFailOpen(
  client: Redis,
  key: string,
  limit: RateLimit,
): Promise<Bucket> {
  try {
    const result = await consumeBucket(client, key, limit);
    return { limited: !result.allowed, retryAfterSeconds: result.retryAfterSeconds };
  } catch (error) {
    logger.warn({ err: error, key }, 'rate limiter unavailable; failing open');
    return { limited: false, retryAfterSeconds: 0 };
  }
}

/** Extract a normalised mobile bucket key from the (already parsed) body. */
function mobileFromRequest(req: Request): string | null {
  const body = req.body as { mobile?: unknown } | undefined;
  const mobile = body?.mobile;
  return typeof mobile === 'string' && mobile.trim().length > 0 ? mobile.trim() : null;
}

const AUTH_MOBILE_LIMIT: RateLimit = {
  // Larger than the BR-32 3-attempt OTP lockout so the limiter never pre-empts
  // the challenge lockout (proven by the BR-32-named test).
  windowSeconds: config.AUTH_RATE_LIMIT_WINDOW_SECONDS,
  max: config.AUTH_RATE_LIMIT_MAX,
};

const AUTH_IP_LIMIT: RateLimit = {
  windowSeconds: config.AUTH_RATE_LIMIT_IP_WINDOW_SECONDS,
  max: config.AUTH_RATE_LIMIT_IP_MAX,
};

/**
 * Auth-surface limiter, keyed by BOTH mobile (from the body) and client IP. A
 * request is rejected as soon as either bucket is saturated, so roaming behind
 * a shared NAT still cannot fuzz many numbers and one host cannot hammer its
 * own number.
 *
 * Mount in front of the routes it guards:
 *   authRouter.post('/login', validate(...), authRateLimit(), handler)
 */
export function authRateLimit(client: Redis = redis): RequestHandler {
  return async (req, res, next) => {
    const buckets: Array<{ key: string; limit: RateLimit }> = [];

    const mobile = mobileFromRequest(req);
    if (mobile !== null) {
      buckets.push({ key: `auth:mobile:${mobile}`, limit: AUTH_MOBILE_LIMIT });
    }
    const ip = req.ip ?? '';
    if (ip.length > 0) {
      buckets.push({ key: `auth:ip:${ip}`, limit: AUTH_IP_LIMIT });
    }

    if (buckets.length === 0) {
      next();
      return;
    }

    let retryAfterSeconds = 0;
    for (const bucket of buckets) {
      const result = await consumeOrFailOpen(client, bucket.key, bucket.limit);
      if (result.limited) {
        retryAfterSeconds = Math.max(retryAfterSeconds, result.retryAfterSeconds);
      }
    }

    if (retryAfterSeconds > 0) {
      // RFC 6585 Retry-After header plus the standard 429 problem+json body,
      // matching the TooManyRequests response declared in docs/openapi.yaml.
      res.setHeader('Retry-After', String(retryAfterSeconds));
      next(
        new AppError('RATE_LIMITED', {
          detail: 'Too many requests. Try again shortly.',
          meta: { retryAfterSeconds },
        }),
      );
      return;
    }

    next();
  };
}