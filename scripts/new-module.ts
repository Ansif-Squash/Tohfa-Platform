#!/usr/bin/env tsx
/**
 * Module scaffolder — `pnpm new:module <plural-name> [--singular <name>]`.
 *
 * Copies `apps/api/src/modules/_example` (the warehouses reference module) into
 * `apps/api/src/modules/<plural-name>` and renames every identifier. The point
 * is that every module in this codebase has the same five files in the same
 * shape, so a reviewer (or an agent) only has to learn one layout.
 *
 *   pnpm new:module listings
 *   pnpm new:module inventory --singular inventoryItem
 *
 * After scaffolding you must still:
 *   1. add the permission codes to docs/rbac.json
 *   2. replace the placeholder permission code in <name>.routes.ts
 *   3. mount the router in apps/api/src/app.ts
 *   4. add the paths to docs/openapi.yaml
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MODULES_DIR = join(REPO_ROOT, 'apps', 'api', 'src', 'modules');
const TEMPLATE_DIR = join(MODULES_DIR, '_example');

const TEMPLATE_PLURAL = 'warehouses';
const TEMPLATE_SINGULAR = 'warehouse';

interface Args {
  plural: string;
  singular: string;
}

function parseArgs(argv: string[]): Args {
  const positional = argv.filter((arg) => !arg.startsWith('--'));
  const plural = positional[0];

  if (plural === undefined || !/^[a-z][a-zA-Z0-9]*$/.test(plural)) {
    throw new Error(
      'Usage: pnpm new:module <plural-name> [--singular <name>]\n' +
        '  <plural-name> must be lowerCamelCase, e.g. "listings", "counterOffers".',
    );
  }

  const singularFlag = argv.indexOf('--singular');
  const singular =
    singularFlag === -1
      ? plural.endsWith('ies')
        ? `${plural.slice(0, -3)}y`
        : plural.endsWith('s')
          ? plural.slice(0, -1)
          : plural
      : (argv[singularFlag + 1] ?? plural);

  return { plural, singular };
}

const upperFirst = (value: string): string =>
  value.length === 0 ? value : `${value[0]?.toUpperCase() ?? ''}${value.slice(1)}`;

/**
 * Identifiers that merely CONTAIN "warehouse" but belong to shared
 * infrastructure outside the module, so renaming them produces a module that
 * references symbols nobody exports (`testmoduleColumn`, `aTestmodule`, ...).
 *
 * Longest first: `warehouseIds` must be masked before `warehouseId` would
 * match its prefix.
 */
const PROTECTED_TOKENS: readonly string[] = [
  'aSubWarehouseAdmin', // test/factories.ts
  'warehouseCoonoor', // test/factories.ts — IDS.*
  'warehouseColumn', // rbac/requirePermission.ts — ScopedWhereOptions
  'warehouseOoty', // test/factories.ts — IDS.*
  'warehouseIds', // rbac/requirePermission.ts — ResolvedScope
  'aWarehouse', // test/factories.ts
  'warehouseId', // auth/jwt.ts — RoleAssignment
];

/** Sentinel that cannot occur in TypeScript source. */
const mask = (index: number): string => `\u0000tohfa-protected-${String(index)}\u0000`;

/**
 * Order matters: replace the longer (plural) token first, otherwise
 * "warehouses" would be half-rewritten by the "warehouse" rule.
 */
function rewrite(contents: string, args: Args): string {
  let working = contents;

  // Mask shared-infrastructure identifiers so the renames below cannot touch
  // them, then restore them verbatim afterwards.
  PROTECTED_TOKENS.forEach((token, index) => {
    working = working.split(token).join(mask(index));
  });

  working = working
    .split(TEMPLATE_PLURAL)
    .join(args.plural)
    .split(upperFirst(TEMPLATE_PLURAL))
    .join(upperFirst(args.plural))
    .split(TEMPLATE_SINGULAR)
    .join(args.singular)
    .split(upperFirst(TEMPLATE_SINGULAR))
    .join(upperFirst(args.singular))
    .split(TEMPLATE_PLURAL.toUpperCase())
    .join(args.plural.toUpperCase());

  PROTECTED_TOKENS.forEach((token, index) => {
    working = working.split(mask(index)).join(token);
  });

  return working;
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const targetDir = join(MODULES_DIR, args.plural);

  if (!existsSync(TEMPLATE_DIR)) {
    throw new Error(`Reference module not found at ${TEMPLATE_DIR}`);
  }
  if (existsSync(targetDir)) {
    throw new Error(`Module "${args.plural}" already exists at ${targetDir}`);
  }

  mkdirSync(targetDir, { recursive: true });

  const created: string[] = [];
  for (const file of readdirSync(TEMPLATE_DIR)) {
    if (!file.endsWith('.ts')) continue;

    const targetName = rewrite(file, args);
    const source = readFileSync(join(TEMPLATE_DIR, file), 'utf8');

    const body = rewrite(source, args)
      .replace(
        'REFERENCE PATTERN — copy this structure for every new module. See CLAUDE.md.',
        `Generated from the _example reference module. See CLAUDE.md.`,
      )
      .replace(
        /requirePermission\('[^']*'\)/g,
        `requirePermission('TODO.${args.plural}.view' /* TODO: add to docs/rbac.json */)`,
      );

    writeFileSync(join(targetDir, targetName), body, 'utf8');
    created.push(targetName);
  }

  console.log(`Created apps/api/src/modules/${args.plural}/`);
  for (const file of created) console.log(`  ${file}`);
  console.log(
    [
      '',
      'Next steps:',
      '  1. Add the permission codes to docs/rbac.json (the generated routes',
      `     reference TODO.${args.plural}.view, which will fail fast until you do).`,
      `  2. Mount the router in apps/api/src/app.ts:`,
      `       app.use('/v1/${args.plural}', ${args.plural}Router);`,
      '  3. Document the endpoints in docs/openapi.yaml.',
      '  4. Add the table + migration in db/migrations.',
    ].join('\n'),
  );
}

try {
  main();
} catch (error: unknown) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
