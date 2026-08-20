/**
 * End-to-end tests — `pnpm test:e2e`.
 *
 * These drive the real Express app through supertest: middleware order,
 * problem+json shape, correlation headers and the auth/permission chain.
 * They do NOT require a database: everything asserted here is rejected before
 * a query would run. Database-backed e2e cases belong in their own module
 * `*.e2e.test.ts` files and should use `databaseReady()` to soft-skip.
 */
import type { Express } from 'express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { RoleCode } from '@tohfa/shared-types';
import { createApp, CORRELATION_HEADER } from './app.js';
import { signAccessToken } from './auth/jwt.js';
import { IDS } from './test/factories.js';

let app: Express;

beforeAll(() => {
  app = createApp();
});

afterAll(async () => {
  const [{ closePool }, { closeRedis }] = await Promise.all([
    import('./db/pool.js'),
    import('./redis.js'),
  ]);
  await Promise.allSettled([closePool(), closeRedis()]);
});

describe('GET /healthz', () => {
  it('reports the process as alive without touching any dependency', async () => {
    const response = await request(app).get('/healthz');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ status: 'ok' });
  });

  it('echoes a client-supplied correlation id', async () => {
    const response = await request(app)
      .get('/healthz')
      .set(CORRELATION_HEADER, 'trace-from-the-mobile-app');

    expect(response.headers[CORRELATION_HEADER]).toBe('trace-from-the-mobile-app');
  });

  it('mints a correlation id when the client does not supply one', async () => {
    const response = await request(app).get('/healthz');
    expect(response.headers[CORRELATION_HEADER]).toMatch(/^[0-9a-f-]{36}$/);
  });
});

describe('problem+json contract', () => {
  it('returns NOT_FOUND for an unmatched route', async () => {
    const response = await request(app).get('/v1/does-not-exist');

    expect(response.status).toBe(404);
    expect(response.headers['content-type']).toContain('application/problem+json');
    expect(response.body).toMatchObject({ code: 'NOT_FOUND', status: 404 });
    expect(response.body.traceId).toEqual(expect.any(String));
  });

  it('returns UNAUTHENTICATED without a bearer token', async () => {
    const response = await request(app).get('/v1/warehouses');

    expect(response.status).toBe(401);
    expect(response.body.code).toBe('UNAUTHENTICATED');
  });

  it('returns UNAUTHENTICATED for a malformed token', async () => {
    const response = await request(app)
      .get('/v1/warehouses')
      .set('Authorization', 'Bearer not-a-real-jwt');

    expect(response.status).toBe(401);
    expect(response.body.code).toBe('UNAUTHENTICATED');
  });
});

describe('permission chain', () => {
  const tokenFor = (roles: Array<{ code: RoleCode; warehouseId?: string }>): string =>
    signAccessToken({
      sub: IDS.userSuperAdmin,
      roles,
      farmerId: null,
      customerId: null,
    });

  it('rejects a role with no grant for the permission with 403', async () => {
    const response = await request(app)
      .get('/v1/warehouses')
      .set('Authorization', `Bearer ${tokenFor([{ code: RoleCode.CUSTOMER }])}`);

    expect(response.status).toBe(403);
    expect(response.body.code).toBe('FORBIDDEN');
    expect(response.body.meta).toMatchObject({ permission: 'warehouse.all.view' });
  });

  it('validates query parameters after the permission check passes', async () => {
    const response = await request(app)
      .get('/v1/warehouses?pageSize=9999')
      .set('Authorization', `Bearer ${tokenFor([{ code: RoleCode.SUPER_ADMIN }])}`);

    expect(response.status).toBe(422);
    expect(response.body.code).toBe('VALIDATION_FAILED');
    expect(Object.keys(response.body.errors)).toContain('query.pageSize');
  });

  it('rejects unknown query parameters (schemas are strict)', async () => {
    const response = await request(app)
      .get('/v1/warehouses?sneaky=1')
      .set('Authorization', `Bearer ${tokenFor([{ code: RoleCode.SUPER_ADMIN }])}`);

    expect(response.status).toBe(422);
    expect(response.body.code).toBe('VALIDATION_FAILED');
  });
});
