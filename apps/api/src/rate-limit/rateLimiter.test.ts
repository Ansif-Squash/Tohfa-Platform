import { describe, expect, it } from 'vitest';
import request from 'supertest';
import express from 'express';
import type { Redis } from 'ioredis';
import { config } from '../config.js';
import { authRateLimit, consumeBucket, type RateLimit } from './rateLimiter.js';
import { errorHandler } from '../http/errorHandler.js';

/**
 * A fake Redis client that reproduces the sliding-window Lua script semantics:
 *   - entries older than `now - windowMs` are dropped
 *   - a request is allowed while the recorded count is below max
 *   - the current request is recorded only when allowed
 * This lets us unit-test the limiter without a running Redis.
 */
function fakeRedis(): Redis {
  const buckets = new Map<string, { timestamps: number[]; windowMs: number }>();

  return {
    async eval(
      _script: string,
      _numKeys: number,
      key: string,
      now: string,
      windowMs: string,
      max: string,
    ) {
      const tNow = Number(now);
      const wMs = Number(windowMs);
      const m = Number(max);
      let bucket = buckets.get(key);
      if (bucket === undefined || bucket.windowMs !== wMs) {
        bucket = { timestamps: [], windowMs: wMs };
        buckets.set(key, bucket);
      }
      bucket.timestamps = bucket.timestamps.filter((t) => t > tNow - wMs);
      const count = bucket.timestamps.length;
      if (count < m) bucket.timestamps.push(tNow);
      const oldest = bucket.timestamps[0] ?? tNow;
      const retryAfterMs = Math.max(0, wMs - (tNow - oldest));
      return [count, retryAfterMs];
    },
  } as unknown as Redis;
}

function probeApp(client: Redis): express.Express {
  const app = express();
  app.use(express.json());
  app.post('/v1/auth/otp/send', authRateLimit(client), (_req, res) => {
    res.status(202).json({ ok: true });
  });
  // The SAME terminal problem+json translator createApp() mounts LAST, so the
  // 429 assertions below prove the full production path limiter -> AppError ->
  // problem+json body (code/status), not Express's default HTML error page.
  app.use(errorHandler);
  return app;
}

const WINDOW: RateLimit = { windowSeconds: 60, max: 3 };

describe('sliding window limiter', () => {
  it('allows requests within the budget and reports remaining count', async () => {
    const redis = fakeRedis();
    expect((await consumeBucket(redis, 'b', WINDOW)).allowed).toBe(true);
    const second = await consumeBucket(redis, 'b', WINDOW);
    expect(second.count).toBe(1);
  });

  it('rejects once the window is saturated and reports retry-after', async () => {
    const redis = fakeRedis();
    for (let i = 0; i < 3; i += 1) await consumeBucket(redis, 'b', WINDOW);
    const over = await consumeBucket(redis, 'b', WINDOW);
    expect(over.allowed).toBe(false);
    expect(over.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('keeps distinct keys on separate budgets', async () => {
    const redis = fakeRedis();
    for (let i = 0; i < 3; i += 1) await consumeBucket(redis, 'auth:mobile:+919000000001', WINDOW);
    const other = await consumeBucket(redis, 'auth:mobile:+919000000002', WINDOW);
    expect(other.count).toBe(0);
  });
});

describe('auth rate limiter middleware', () => {
  it('returns 429 problem+json with Retry-After when the mobile bucket is exhausted', async () => {
    const app = probeApp(fakeRedis());
    const mobile = '+919000000001';
    for (let i = 0; i < 20; i += 1) {
      await request(app).post('/v1/auth/otp/send').send({ mobile, purpose: 'LOGIN' });
    }
    const rejected = await request(app)
      .post('/v1/auth/otp/send')
      .send({ mobile, purpose: 'LOGIN' });

    expect(rejected.status).toBe(429);
    expect(rejected.headers['retry-after']).toBeDefined();
    expect(rejected.body.code).toBe('RATE_LIMITED');
    expect(rejected.body.status).toBe(429);
  });

  it('does not share a budget across mobile numbers', async () => {
    const app = probeApp(fakeRedis());
    // Exhaust the first mobile budget; a second mobile is not impacted.
    const first = '+919000000001';
    const second = '+919000000002';
    for (let i = 0; i < 20; i += 1) {
      await request(app).post('/v1/auth/otp/send').send({ mobile: first, purpose: 'LOGIN' });
    }
    const res = await request(app).post('/v1/auth/otp/send').send({ mobile: second, purpose: 'LOGIN' });
    expect(res.status).toBe(202);
  });

  it('fail-open: a Redis outage never errors the request', async () => {
    const brokenClient = {
      async eval() {
        throw new Error('ECONNREFUSED');
      },
    } as unknown as Redis;
    const res = await request(probeApp(brokenClient))
      .post('/v1/auth/otp/send')
      .send({ mobile: '+919000000001', purpose: 'LOGIN' });
    expect(res.status).toBe(202);
  });

  it('BR-32: the limiter budget never pre-empts the 3-attempt OTP lockout', () => {
    // Per the manual, a test "named with BR-32" must prove the limiter does not
    // weaken or replace the per-challenge 3-attempt lockout. The whole coupling
    // lives here: the per-mobile and per-IP budgets must stay >= the number of
    // wrong attempts that BR-32 allows before OTP_LOCKED fires.
    expect(config.AUTH_RATE_LIMIT_MAX).toBeGreaterThanOrEqual(config.OTP_MAX_ATTEMPTS);
    expect(config.AUTH_RATE_LIMIT_IP_MAX).toBeGreaterThanOrEqual(config.OTP_MAX_ATTEMPTS);
  });
});