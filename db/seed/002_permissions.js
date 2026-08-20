#!/usr/bin/env node
// =============================================================================
// 002_permissions.js — sync `permissions` and `role_permissions` from rbac.json
//
// docs/rbac.json is the single source of truth for authorization. This script
// projects it into the database so the permission list is never written twice.
// Nobody hand-edits these two tables; if the DB and the file disagree, the file
// wins.
//
//   node db/seed/002_permissions.js              # apply (idempotent)
//   node db/seed/002_permissions.js --check      # CI: exit 1 on drift
//   node db/seed/002_permissions.js --verbose    # print every change
//
// Requires DATABASE_URL and the roles seeded by 001_reference.sql.
//
// Ordering: run AFTER 001_reference.sql. Grants reference roles by code and a
// missing role is a hard error, not a silent skip — a silently skipped grant is
// an authorization hole that nothing downstream will notice.
// =============================================================================

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import pg from 'pg';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const RBAC_PATH = path.resolve(HERE, '../../docs/rbac.json');

const VALID_SCOPES = new Set(['all', 'own', 'view', 'conditional', 'none']);
const SEP = '\u0000';

const args = new Set(process.argv.slice(2));
const CHECK_ONLY = args.has('--check');
const VERBOSE = args.has('--verbose');

// -----------------------------------------------------------------------------
// Read and validate rbac.json
// -----------------------------------------------------------------------------
function buildDesired(rbac) {
  const problems = [];
  const roleCodes = new Set((rbac.roles ?? []).map((r) => r.code));
  const predicateNames = new Set(Object.keys(rbac.predicates ?? {}));

  if (roleCodes.size === 0) problems.push('rbac.json declares no roles');

  /** code -> { module, description, predicate } */
  const permissions = new Map();
  /** `${roleCode}\0${permCode}` -> { roleCode, permCode, scope, predicate } */
  const grants = new Map();

  for (const perm of rbac.permissions ?? []) {
    if (!perm.code) {
      problems.push('a permission has no code');
      continue;
    }
    if (permissions.has(perm.code)) {
      problems.push(`duplicate permission code: ${perm.code}`);
      continue;
    }
    if (perm.predicate && !predicateNames.has(perm.predicate)) {
      problems.push(`${perm.code}: unknown predicate "${perm.predicate}"`);
    }

    permissions.set(perm.code, {
      module: perm.module ?? 'Uncategorised',
      description: perm.description ?? '',
      predicate: perm.predicate ?? null,
    });

    const granted = perm.grants ?? {};
    for (const roleCode of Object.keys(granted)) {
      if (!roleCodes.has(roleCode)) {
        problems.push(`${perm.code}: grant for unknown role "${roleCode}"`);
        continue;
      }
      const scope = granted[roleCode];
      if (!VALID_SCOPES.has(scope)) {
        problems.push(`${perm.code}/${roleCode}: invalid scope "${scope}"`);
        continue;
      }
      // A `conditional` grant with no predicate is a grant of `all` in disguise —
      // exactly how BR-29 would get quietly lost. The DB refuses it too.
      if (scope === 'conditional' && !perm.predicate) {
        problems.push(
          `${perm.code}/${roleCode}: scope "conditional" with no predicate on the permission`,
        );
        continue;
      }
      grants.set(`${roleCode}${SEP}${perm.code}`, {
        roleCode,
        permCode: perm.code,
        scope,
        predicate: scope === 'conditional' ? perm.predicate : null,
      });
    }

    // Every role must have an explicit verdict. An absent grant is ambiguous;
    // an explicit "none" is a decision.
    for (const roleCode of roleCodes) {
      if (!(roleCode in granted)) {
        problems.push(`${perm.code}: no grant recorded for role "${roleCode}"`);
      }
    }
  }

  return { permissions, grants, roleCodes, problems };
}

// -----------------------------------------------------------------------------
// Read current state
// -----------------------------------------------------------------------------
async function readActual(client) {
  const perms = await client.query(
    'SELECT code, module, description, predicate FROM permissions',
  );
  const rps = await client.query(`
    SELECT r.code AS role_code, p.code AS perm_code, rp.scope, rp.predicate
    FROM role_permissions rp
    JOIN roles r       ON r.id = rp.role_id
    JOIN permissions p ON p.id = rp.permission_id
  `);

  const permissions = new Map(
    perms.rows.map((r) => [
      r.code,
      { module: r.module, description: r.description, predicate: r.predicate },
    ]),
  );
  const grants = new Map(
    rps.rows.map((r) => [
      `${r.role_code}${SEP}${r.perm_code}`,
      {
        roleCode: r.role_code,
        permCode: r.perm_code,
        scope: r.scope,
        predicate: r.predicate,
      },
    ]),
  );
  return { permissions, grants };
}

// -----------------------------------------------------------------------------
// Diff
// -----------------------------------------------------------------------------
function diff(desired, actual) {
  const permAdds = [];
  const permUpdates = [];
  const permDeletes = [];
  const grantAdds = [];
  const grantUpdates = [];
  const grantDeletes = [];

  for (const [code, want] of desired.permissions) {
    const have = actual.permissions.get(code);
    if (!have) {
      permAdds.push(code);
    } else if (
      have.module !== want.module ||
      have.description !== want.description ||
      (have.predicate ?? null) !== (want.predicate ?? null)
    ) {
      permUpdates.push(code);
    }
  }
  for (const code of actual.permissions.keys()) {
    if (!desired.permissions.has(code)) permDeletes.push(code);
  }

  for (const [key, want] of desired.grants) {
    const have = actual.grants.get(key);
    if (!have) {
      grantAdds.push(key);
    } else if (
      have.scope !== want.scope ||
      (have.predicate ?? null) !== (want.predicate ?? null)
    ) {
      grantUpdates.push(key);
    }
  }
  for (const key of actual.grants.keys()) {
    if (!desired.grants.has(key)) grantDeletes.push(key);
  }

  return { permAdds, permUpdates, permDeletes, grantAdds, grantUpdates, grantDeletes };
}

const label = (key) => key.split(SEP).reverse().join(' / ');

// -----------------------------------------------------------------------------
// Apply
// -----------------------------------------------------------------------------
async function apply(client, desired) {
  const codes = [...desired.permissions.keys()];
  const modules = codes.map((c) => desired.permissions.get(c).module);
  const descriptions = codes.map((c) => desired.permissions.get(c).description);
  const predicates = codes.map((c) => desired.permissions.get(c).predicate);

  // 1. Upsert permissions.
  await client.query(
    `
    INSERT INTO permissions (code, module, description, predicate)
    SELECT * FROM unnest($1::text[], $2::text[], $3::text[], $4::text[])
    ON CONFLICT (code) DO UPDATE SET
      module      = EXCLUDED.module,
      description = EXCLUDED.description,
      predicate   = EXCLUDED.predicate,
      updated_at  = now()
    `,
    [codes, modules, descriptions, predicates],
  );

  // 2. Drop permissions no longer in rbac.json. This cascades to
  //    role_permissions, which is the point: a retired permission must not
  //    leave a live grant behind.
  const deletedPerms = await client.query(
    'DELETE FROM permissions WHERE code <> ALL($1::text[]) RETURNING code',
    [codes],
  );

  // 3. Upsert grants.
  const gvals = [...desired.grants.values()];
  await client.query(
    `
    INSERT INTO role_permissions (role_id, permission_id, scope, predicate)
    SELECT r.id, p.id, d.scope, d.predicate
    FROM unnest($1::text[], $2::text[], $3::text[], $4::text[])
         AS d(role_code, perm_code, scope, predicate)
    JOIN roles r       ON r.code = d.role_code
    JOIN permissions p ON p.code = d.perm_code
    ON CONFLICT (role_id, permission_id) DO UPDATE SET
      scope      = EXCLUDED.scope,
      predicate  = EXCLUDED.predicate,
      updated_at = now()
    `,
    [
      gvals.map((g) => g.roleCode),
      gvals.map((g) => g.permCode),
      gvals.map((g) => g.scope),
      gvals.map((g) => g.predicate),
    ],
  );

  // 4. Delete grants that rbac.json no longer describes.
  const deletedGrants = await client.query(
    `
    DELETE FROM role_permissions rp
    WHERE NOT EXISTS (
      SELECT 1
      FROM unnest($1::text[], $2::text[]) AS d(role_code, perm_code)
      JOIN roles r       ON r.code = d.role_code
      JOIN permissions p ON p.code = d.perm_code
      WHERE r.id = rp.role_id AND p.id = rp.permission_id
    )
    RETURNING role_id, permission_id
    `,
    [gvals.map((g) => g.roleCode), gvals.map((g) => g.permCode)],
  );

  return {
    permissions: codes.length,
    grants: gvals.length,
    deletedPermissions: deletedPerms.rowCount,
    deletedGrants: deletedGrants.rowCount,
  };
}

// -----------------------------------------------------------------------------
// Main
// -----------------------------------------------------------------------------
async function main() {
  const raw = await readFile(RBAC_PATH, 'utf8');
  const rbac = JSON.parse(raw);
  const desired = buildDesired(rbac);

  if (desired.problems.length > 0) {
    console.error(`rbac.json is invalid (${desired.problems.length} problem(s)):`);
    for (const p of desired.problems) console.error(`  - ${p}`);
    process.exit(2);
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is not set.');
    process.exit(2);
  }

  const client = new pg.Client({ connectionString });
  await client.connect();

  try {
    // Roles must already exist. A missing role would silently drop every grant
    // for it, which is an authorization hole rather than a warning.
    const roleRows = await client.query('SELECT code FROM roles');
    const dbRoles = new Set(roleRows.rows.map((r) => r.code));
    const missing = [...desired.roleCodes].filter((c) => !dbRoles.has(c));
    if (missing.length > 0) {
      console.error(
        `roles missing from the database: ${missing.join(', ')}\n` +
          'Run db/seed/001_reference.sql first.',
      );
      process.exit(2);
    }

    const actual = await readActual(client);
    const d = diff(desired, actual);
    const drifted =
      d.permAdds.length +
      d.permUpdates.length +
      d.permDeletes.length +
      d.grantAdds.length +
      d.grantUpdates.length +
      d.grantDeletes.length;

    if (CHECK_ONLY) {
      if (drifted === 0) {
        console.log(
          `rbac: in sync — ${desired.permissions.size} permissions, ${desired.grants.size} grants.`,
        );
        process.exit(0);
      }
      console.error(`rbac DRIFT: the database does not match docs/rbac.json (${drifted} difference(s)).`);
      for (const c of d.permAdds) console.error(`  + permission        ${c}`);
      for (const c of d.permUpdates) console.error(`  ~ permission        ${c}`);
      for (const c of d.permDeletes) console.error(`  - permission        ${c} (not in rbac.json)`);
      for (const k of d.grantAdds) console.error(`  + grant             ${label(k)}`);
      for (const k of d.grantUpdates) {
        const have = actual.grants.get(k);
        const want = desired.grants.get(k);
        console.error(`  ~ grant             ${label(k)}: ${have.scope} -> ${want.scope}`);
      }
      for (const k of d.grantDeletes) console.error(`  - grant             ${label(k)} (not in rbac.json)`);
      console.error('\nRun `node db/seed/002_permissions.js` to reconcile.');
      process.exit(1);
    }

    if (VERBOSE) {
      for (const c of d.permAdds) console.log(`  + permission ${c}`);
      for (const c of d.permUpdates) console.log(`  ~ permission ${c}`);
      for (const c of d.permDeletes) console.log(`  - permission ${c}`);
      for (const k of d.grantAdds) console.log(`  + grant ${label(k)}`);
      for (const k of d.grantUpdates) console.log(`  ~ grant ${label(k)}`);
      for (const k of d.grantDeletes) console.log(`  - grant ${label(k)}`);
    }

    await client.query('BEGIN');
    const result = await apply(client, desired);
    await client.query('COMMIT');

    console.log(
      `rbac synced from docs/rbac.json v${rbac.version ?? '?'}: ` +
        `${result.permissions} permissions, ${result.grants} grants ` +
        `(removed ${result.deletedPermissions} permission(s), ${result.deletedGrants} stale grant(s)).`,
    );
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
