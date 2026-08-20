/**
 * Repo-root resolution.
 *
 * The API reads two things that live OUTSIDE its own package — `docs/rbac.json`
 * and `db/migrations/*.sql` — so it has to find the monorepo root at runtime.
 * We walk up from this file until we see `pnpm-workspace.yaml`, which works
 * identically for `tsx src/...` (source) and `node dist/...` (built).
 */
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const thisDir = dirname(fileURLToPath(import.meta.url));

function findRepoRoot(startDir: string): string {
  let current = resolve(startDir);
  // Guard against an infinite loop at the filesystem root.
  for (let depth = 0; depth < 12; depth += 1) {
    if (existsSync(join(current, 'pnpm-workspace.yaml'))) return current;
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }
  throw new Error(
    `Could not locate the monorepo root (no pnpm-workspace.yaml above ${startDir}).`,
  );
}

export const REPO_ROOT = findRepoRoot(thisDir);
export const DOCS_DIR = join(REPO_ROOT, 'docs');
export const DB_DIR = join(REPO_ROOT, 'db');
export const MIGRATIONS_DIR = join(DB_DIR, 'migrations');
export const SEED_DIR = join(DB_DIR, 'seed');
export const RBAC_JSON_PATH = join(DOCS_DIR, 'rbac.json');
export const OPENAPI_PATH = join(DOCS_DIR, 'openapi.yaml');
