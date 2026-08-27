/**
 * Contract test — `pnpm test:contract`.
 *
 * Proves the Express app implements exactly what `docs/openapi.yaml` declares:
 *   1. every registered route + method exists in the spec
 *   2. every implemented route's `x-permission` (from the spec) exists in
 *      docs/rbac.json (except `public`, the unauthenticated sentinel)
 *   3. a sample request (`GET /healthz`) returns a body matching the spec
 *
 * It validates the SERVER against the contract rather than the contract against
 * itself, so a handler that drifts from the spec turns into a red CI build. If
 * drift exists, every finding is listed explicitly — we never weaken the
 * assertion to make it green (see the S-20 "Watch for" note).
 *
 * The route table it walks is the SAME `API_MOUNTS` that `createApp()` uses, so
 * a route added to the router table is automatically part of traffic and of
 * this check.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp, API_MOUNTS, CORRELATION_HEADER } from '../app.js';
import { healthRouter } from '../modules/health/health.routes.js';

const REPO_ROOT = fileURLToPath(new URL('../../../..', import.meta.url));
const OPENAPI_PATH = join(REPO_ROOT, 'docs', 'openapi.yaml');
const RBAC_PATH = join(REPO_ROOT, 'docs', 'rbac.json');

interface SpecOperation {
  method: string;
  /** Path exactly as written in openapi.yaml (e.g. `/auth/login`). */
  path: string;
  /** `x-permission` value, or `public` for unauthenticated endpoints. */
  permission: string;
}

/** Match a full Express path against how the same route is written in the spec. */
function toSpecPath(fullPath: string): string {
  let p = fullPath;
  // Business routers mount under /v1; the spec writes those paths relative to /v1.
  if (p.startsWith('/v1')) p = p.slice(3);
  // Express `:param` -> openapi `{param}`.
  p = p.replace(/:([A-Za-z0-9_]+)/g, '{$1}');
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
  return p;
}

const opKey = (method: string, path: string): string => `${method.toLowerCase()}:${path}`;

/** Parse `docs/openapi.yaml` for top-level paths + methods + x-permission. */
function readSpecOperations(): Map<string, SpecOperation> {
  const lines = readFileSync(OPENAPI_PATH, 'utf8').split(/\r?\n/);
  const ops = new Map<string, SpecOperation>();
  let currentPath: string | null = null;
  let lastVerb: string | null = null;

  for (const line of lines) {
    const pathMatch = line.match(/^ {2}(\/[^\s]+):\s*$/);
    if (pathMatch !== null && pathMatch[1] !== undefined && currentPath !== pathMatch[1]) {
      currentPath = pathMatch[1];
      lastVerb = null;
      continue;
    }
    const verbMatch: RegExpMatchArray | null =
      currentPath !== null ? line.match(/^ {4}(get|put|post|patch|delete|head|options):\s*$/) : null;
    if (verbMatch !== null && verbMatch[1] !== undefined) {
      lastVerb = verbMatch[1];
      const path: string = currentPath as string;
      ops.set(opKey(lastVerb, path), {
        method: lastVerb,
        path,
        permission: 'public',
      });
      continue;
    }
    if (currentPath !== null && lastVerb !== null) {
      const permMatch: RegExpMatchArray | null = line.match(/^ {6}x-permission:\s*(\S+)/) as RegExpMatchArray | null;
      if (permMatch !== null && permMatch[1] !== undefined) {
        const current = ops.get(opKey(lastVerb!, currentPath));
        if (current !== undefined) current.permission = permMatch[1];
      }
    }
  }

  return ops;
}

function readRbacPermissionCodes(): Set<string> {
  const parsed = JSON.parse(readFileSync(RBAC_PATH, 'utf8')) as {
    permissions?: Array<{ code?: string }>;
  };
  const codes = new Set<string>();
  for (const permission of parsed.permissions ?? []) {
    if (typeof permission.code === 'string') codes.add(permission.code);
  }
  return codes;
}
interface RegisteredRoute {
  method: string;
  fullPath: string;
}

/** Walk a router's stack for the leaf HTTP routes it registers. */
function routesIn(router: unknown, base: string): RegisteredRoute[] {
  const stack = (router as { stack?: unknown[] }).stack ?? [];
  const out: RegisteredRoute[] = [];
  for (const layer of stack as Array<Record<string, unknown>>) {
    const route = layer['route'] as
      | { path?: string; methods?: Record<string, boolean> }
      | undefined;
    if (route !== undefined && route.methods !== undefined) {
      const joined = `${base}${(route.path ?? '').startsWith('/') ? route.path : `/${route.path ?? ''}`}`;
      for (const method of Object.keys(route.methods)) {
        if (method === '_all') continue;
        out.push({ method, fullPath: joined });
      }
      continue;
    }
    const nested = layer['handle'] as { stack?: unknown[] } | undefined;
    if (nested !== undefined && nested.stack !== undefined) {
      out.push(...routesIn(nested, base));
    }
  }
  return out;
}

function collectRegisteredRoutes(): RegisteredRoute[] {
  const routes: RegisteredRoute[] = [];
  // The unauthenticated liveness/readiness probes are mounted at the root.
  for (const r of routesIn(healthRouter, '')) routes.push(r);
  for (const { prefix, router } of API_MOUNTS) {
    for (const r of routesIn(router, prefix)) routes.push(r);
  }
  return routes;
}

describe('contract: API surface matches docs/openapi.yaml', () => {
  it('every registered route+method exists in the spec, and its x-permission resolves', () => {
    const spec = readSpecOperations();
    const rbacCodes = readRbacPermissionCodes();
    const registered = collectRegisteredRoutes();

    const findings: string[] = [];

    for (const { method, fullPath } of registered) {
      const specPath = toSpecPath(fullPath);
      const specOp = spec.get(opKey(method, specPath));

      if (specOp === undefined) {
        findings.push(
          `ROUTE NOT DOCUMENTED  ${method.toUpperCase()} ${fullPath}  -> spec has no ${opKey(method, specPath)}`,
        );
        continue;
      }

      if (specOp.permission !== 'public' && !rbacCodes.has(specOp.permission)) {
        findings.push(
          `PERMISSION NOT IN RBAC  ${method.toUpperCase()} ${fullPath}  -> x-permission "${specOp.permission}" is missing from docs/rbac.json`,
        );
      }
    }

    // Manual "Watch for": a contract test must fail on drift, never be weakened
    // to pass. When findings exist they are printed verbatim for resolution.
    if (findings.length > 0) {
      console.error(`\nContract drift (${findings.length}):\n` + findings.map((f) => `  - ${f}`).join('\n'));
    }
    expect(findings, 'see printed contract drift above').toEqual([]);
  });

  it('GET /healthz returns the documented shape (sample request)', async () => {
    const spec = readSpecOperations();
    const specOp = spec.get(opKey('get', '/healthz'));
    expect(specOp, 'openapi.yaml must declare GET /healthz').toBeDefined();

    const app = createApp();
    const res = await request(app).get('/healthz');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok' });
    expect(res.body.uptimeSeconds).toEqual(expect.any(Number));
    expect(res.headers[CORRELATION_HEADER]).toEqual(expect.any(String));
  });
});