#!/usr/bin/env tsx
/**
 * SQL migration runner.
 *
 * Migrations are plain `.sql` files in `db/migrations`, applied in filename
 * order. Convention:
 *
 *   db/migrations/0001_initial.sql          -- the "up"
 *   db/migrations/0001_initial.down.sql     -- optional matching "down"
 *
 * A migration may instead carry BOTH directions in one file, delimited by
 * marker comments (the style every migration in this repo uses):
 *
 *   -- +migrate Up
 *   CREATE TABLE ...
 *   -- +migrate Down
 *   DROP TABLE ...
 *
 * When those markers are present only the relevant section is executed — the
 * whole file is never run as-is, or `db:migrate` would drop what it just made.
 *
 * Applied migrations are recorded in `schema_migrations` with a checksum, so
 * editing an already-applied file is detected and refused: on a shared database
 * that silently produces divergent schemas.
 *
 *   pnpm db:migrate            apply everything pending
 *   pnpm db:rollback           roll back the most recent migration
 *   pnpm db:rollback --all     roll back everything (used by db:reset)
 *   pnpm db:seed               run db/seed/* in filename order (idempotent).
 *                              `.sql` files run in a transaction; `.js` files
 *                              are executed with node (db/seed/002_permissions.js
 *                              projects docs/rbac.json into the DB).
 */
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { MIGRATIONS_DIR, SEED_DIR } from '../paths.js';
import { pool, withTransaction } from './pool.js';

const TRACKING_TABLE = `
  CREATE TABLE IF NOT EXISTS schema_migrations (
    version     text PRIMARY KEY,
    name        text NOT NULL,
    checksum    text NOT NULL,
    applied_at  timestamptz NOT NULL DEFAULT now()
  )
`;

interface MigrationFile {
  version: string;
  name: string;
  upPath: string;
  downPath: string | null;
}

const UP_MARKER = /^[^\S\r\n]*--[^\S\r\n]*\+migrate[^\S\r\n]+Up[^\S\r\n]*$/im;
const DOWN_MARKER = /^[^\S\r\n]*--[^\S\r\n]*\+migrate[^\S\r\n]+Down[^\S\r\n]*$/im;

/**
 * Split a migration file into its `up` and `down` halves.
 *
 * Files without `-- +migrate Up` markers are treated as up-only, which keeps
 * the older `<name>.down.sql` convention working.
 */
function splitSections(sql: string): { up: string; down: string | null } {
  const upMatch = UP_MARKER.exec(sql);
  if (upMatch === null) return { up: sql, down: null };

  const afterUp = sql.slice(upMatch.index + upMatch[0].length);
  const downMatch = DOWN_MARKER.exec(afterUp);
  if (downMatch === null) return { up: afterUp, down: null };

  return {
    up: afterUp.slice(0, downMatch.index),
    down: afterUp.slice(downMatch.index + downMatch[0].length),
  };
}

/** True when a SQL chunk contains something other than comments/whitespace. */
function hasStatements(sql: string): boolean {
  return (
    sql
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith('--'))
      .join('')
      .trim().length > 0
  );
}

function listMigrations(): MigrationFile[] {
  if (!existsSync(MIGRATIONS_DIR)) return [];

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith('.sql') && !file.endsWith('.down.sql'))
    .sort((a, b) => a.localeCompare(b, 'en'));

  return files.map((file) => {
    const base = file.slice(0, -'.sql'.length);
    const separator = base.indexOf('_');
    const version = separator === -1 ? base : base.slice(0, separator);
    const downPath = join(MIGRATIONS_DIR, `${base}.down.sql`);
    return {
      version,
      name: base,
      upPath: join(MIGRATIONS_DIR, file),
      downPath: existsSync(downPath) ? downPath : null,
    };
  });
}

function checksum(contents: string): string {
  return createHash('sha256').update(contents).digest('hex').slice(0, 16);
}

async function appliedVersions(): Promise<Map<string, string>> {
  await pool.query(TRACKING_TABLE);
  const result = await pool.query<{ version: string; checksum: string }>(
    'SELECT version, checksum FROM schema_migrations ORDER BY version',
  );
  return new Map(result.rows.map((row) => [row.version, row.checksum]));
}

async function up(): Promise<void> {
  const applied = await appliedVersions();
  const migrations = listMigrations();

  if (migrations.length === 0) {
    console.log('No migrations found in db/migrations — nothing to do.');
    return;
  }

  let count = 0;
  for (const migration of migrations) {
    const sql = readFileSync(migration.upPath, 'utf8');
    const sum = checksum(sql);
    const previous = applied.get(migration.version);

    if (previous !== undefined) {
      if (previous !== sum) {
        throw new Error(
          `Migration ${migration.name} has already been applied but its contents changed ` +
            `(recorded ${previous}, now ${sum}). Create a NEW migration instead of editing this one.`,
        );
      }
      continue;
    }

    const { up: upSql } = splitSections(sql);

    await withTransaction(async (tx) => {
      await tx.query(upSql);
      await tx.query(
        'INSERT INTO schema_migrations (version, name, checksum) VALUES ($1, $2, $3)',
        [migration.version, migration.name, sum],
      );
    });

    console.log(`applied  ${migration.name}`);
    count += 1;
  }

  console.log(count === 0 ? 'Database already up to date.' : `Applied ${count} migration(s).`);
}

async function down(all: boolean): Promise<void> {
  const applied = await appliedVersions();
  if (applied.size === 0) {
    console.log('Nothing to roll back.');
    return;
  }

  const byVersion = new Map(listMigrations().map((m) => [m.version, m]));
  const versions = [...applied.keys()].sort((a, b) => b.localeCompare(a, 'en'));
  const targets = all ? versions : versions.slice(0, 1);

  for (const version of targets) {
    const migration = byVersion.get(version);

    // An inline `-- +migrate Down` section wins; a sibling `.down.sql` is the
    // fallback for migrations written in the older two-file style.
    let downSql: string | null = null;
    if (migration !== undefined) {
      const inline = splitSections(readFileSync(migration.upPath, 'utf8')).down;
      if (inline !== null && hasStatements(inline)) {
        downSql = inline;
      } else if (migration.downPath !== null) {
        downSql = readFileSync(migration.downPath, 'utf8');
      }
    }

    if (downSql === null) {
      console.warn(
        `no down section for ${version}; dropping its tracking row only. ` +
          `Add a \`-- +migrate Down\` section (or db/migrations/<name>.down.sql) ` +
          `to make this reversible.`,
      );
      await pool.query('DELETE FROM schema_migrations WHERE version = $1', [version]);
      continue;
    }

    await withTransaction(async (tx) => {
      await tx.query(downSql);
      await tx.query('DELETE FROM schema_migrations WHERE version = $1', [version]);
    });
    console.log(`rolled back  ${migration?.name ?? version}`);
  }
}

async function seed(): Promise<void> {
  if (!existsSync(SEED_DIR)) {
    console.log('No db/seed directory — nothing to seed.');
    return;
  }

  const files = readdirSync(SEED_DIR)
    .filter((file) => file.endsWith('.sql') || file.endsWith('.js'))
    .sort((a, b) => a.localeCompare(b, 'en'));

  if (files.length === 0) {
    console.log('No seed files found.');
    return;
  }

  for (const file of files) {
    const path = join(SEED_DIR, file);

    if (file.endsWith('.js')) {
      // Executable seeds (e.g. 002_permissions.js, which projects
      // docs/rbac.json into permissions/role_permissions) own their own
      // connection and transaction handling.
      const result = spawnSync(process.execPath, [path], {
        stdio: 'inherit',
        env: process.env,
      });
      if (result.status !== 0) {
        throw new Error(`seed ${file} exited with status ${String(result.status)}`);
      }
      console.log(`seeded  ${file}`);
      continue;
    }

    const sql = readFileSync(path, 'utf8');
    await withTransaction(async (tx) => {
      await tx.query(sql);
    });
    console.log(`seeded  ${file}`);
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes('--seed')) {
    await seed();
  } else if (args.includes('--down')) {
    await down(args.includes('--all'));
  } else {
    await up();
  }
}

main()
  .then(() => pool.end())
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    void pool.end().finally(() => process.exit(1));
  });
