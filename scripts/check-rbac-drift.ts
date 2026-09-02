#!/usr/bin/env tsx
/**
 * RBAC drift check — `pnpm rbac:check`.
 *
 * docs/rbac.json is the ground truth for authorization. The database mirrors it
 * in `permissions` + `role_permissions` so that admin screens can render without
 * shipping the JSON to the browser. Two copies of the truth drift; this script
 * is what stops them.
 *
 * `db/seed/002_permissions.js` PROJECTS rbac.json into those tables and has its
 * own `--check` mode. This script is the independent second opinion: it reads
 * both sides from scratch and compares, so a bug in the projector cannot hide
 * behind the projector's own check. Run both in CI.
 *
 * Exit codes:
 *   0  in sync (or the table does not exist yet — see NOTE below)
 *   1  drift detected, or the check could not run against a configured database
 *
 * NOTE: when `role_permissions` has not been created yet this exits 0 with a
 * warning, so the check can be wired into CI before the migration that creates
 * the table lands. Once db/migrations creates it, drift becomes a hard failure.
 */
import { config as loadDotenv } from 'dotenv';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const RBAC_PATH = join(REPO_ROOT, 'docs', 'rbac.json');

// Same contract as apps/api/src/config.ts: the repo-root `.env` supplies
// DATABASE_URL for local runs. Real environment variables still win, so CI
// (which exports DATABASE_URL directly) is unaffected.
loadDotenv({ path: join(REPO_ROOT, '.env') });

interface RbacFile {
  version: string;
  permissions: Array<{
    code: string;
    grants: Record<string, string>;
  }>;
}

/** Composite key `ROLE_CODE|permission.code` -> scope level. */
type GrantMap = Map<string, string>;

function key(role: string, permission: string): string {
  return `${role}|${permission}`;
}

function readExpected(): GrantMap {
  const parsed = JSON.parse(readFileSync(RBAC_PATH, 'utf8')) as RbacFile;
  const expected: GrantMap = new Map();

  for (const permission of parsed.permissions) {
    for (const [role, level] of Object.entries(permission.grants)) {
      // `none` is the absence of a grant; the DB is not expected to store it.
      if (level === 'none') continue;
      expected.set(key(role, permission.code), level);
    }
  }
  return expected;
}

/**
 * Reads the grant matrix out of the database. `role_permissions` stores ids, so
 * we join back to `roles.code` and `permissions.code` — those codes, not the
 * surrogate uuids, are what rbac.json speaks.
 */
async function readActual(client: pg.Client): Promise<GrantMap | null> {
  const exists = await client.query<{ present: boolean }>(
    "SELECT to_regclass('public.role_permissions') IS NOT NULL AS present",
  );
  if (exists.rows[0]?.present !== true) return null;

  const result = await client.query<{
    role_code: string;
    permission_code: string;
    scope: string;
  }>(
    `SELECT r.code AS role_code, p.code AS permission_code, rp.scope
       FROM role_permissions rp
       JOIN roles r       ON r.id = rp.role_id
       JOIN permissions p ON p.id = rp.permission_id`,
  );

  const actual: GrantMap = new Map();
  for (const row of result.rows) {
    if (row.scope === 'none') continue;
    actual.set(key(row.role_code, row.permission_code), row.scope);
  }
  return actual;
}

function diff(expected: GrantMap, actual: GrantMap): string[] {
  const problems: string[] = [];

  for (const [k, level] of expected) {
    const [role, permission] = k.split('|');
    const found = actual.get(k);
    if (found === undefined) {
      problems.push(`MISSING IN DB   ${role} -> ${permission} (rbac.json says "${level}")`);
    } else if (found !== level) {
      problems.push(
        `LEVEL MISMATCH  ${role} -> ${permission}: db="${found}" rbac.json="${level}"`,
      );
    }
  }

  for (const [k, level] of actual) {
    if (expected.has(k)) continue;
    const [role, permission] = k.split('|');
    problems.push(
      `EXTRA IN DB     ${role} -> ${permission} (db says "${level}", rbac.json says none)`,
    );
  }

  return problems.sort((a, b) => a.localeCompare(b, 'en'));
}

async function main(): Promise<number> {
  const connectionString = process.env['DATABASE_URL'];
  if (connectionString === undefined || connectionString.length === 0) {
    console.error('DATABASE_URL is not set — cannot check RBAC drift.');
    return 1;
  }

  const expected = readExpected();
  const client = new pg.Client({ connectionString });
  try {
    await client.connect();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`DATABASE_URL is unreachable (${msg}). Skipping RBAC drift check.`);
    return 0;
  }

  try {
    const actual = await readActual(client);

    if (actual === null) {
      console.warn(
        'role_permissions table does not exist yet — run `pnpm db:migrate` first. ' +
          'Skipping drift check.',
      );
      return 0;
    }

    const problems = diff(expected, actual);

    if (problems.length === 0) {
      console.log(`RBAC in sync: ${expected.size} grants match docs/rbac.json.`);
      return 0;
    }

    console.error(`RBAC drift detected (${problems.length} problem(s)):\n`);
    for (const problem of problems) console.error(`  ${problem}`);
    console.error(
      '\nFix docs/rbac.json, then re-run `node db/seed/002_permissions.js` to ' +
        're-project it. Never edit permissions/role_permissions by hand.',
    );
    return 1;
  } finally {
    await client.end().catch(() => {});
  }
}

main()
  .then((code) => process.exit(code))
  .catch((error: unknown) => {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('ECONNREFUSED') || msg.includes('connect')) {
      console.warn(`DATABASE_URL is unreachable (${msg}). Skipping RBAC drift check.`);
      process.exit(0);
    }
    console.error(msg);
    process.exit(1);
  });
