#!/usr/bin/env tsx
/**
 * Spec drift check — `pnpm spec:drift`.
 *
 * `docs/openapi.yaml` annotates every operation with `x-permission` and
 * `x-business-rules`, and its `Problem` schema lists the error codes clients
 * switch on. All three point at OTHER ground-truth files:
 *
 *   x-permission      -> a permission code in `docs/rbac.json`
 *   x-business-rules  -> a rule id (`BR-nn`) defined in `docs/rules.md`
 *   Problem codes     -> `ErrorCode` / `GenericProblemCode` in
 *                        `packages/shared-types/src/errors.ts`
 *
 * Nothing at runtime dereferences those pointers, so they rot silently: the
 * spec once carried its own private BR numbering and ~58 permission codes that
 * `rbac.json` had never heard of. A developer reading the contract would have
 * implemented `requirePermission('cart.read_own')` and it would have thrown at
 * boot. This script is what makes that a red build instead of a story.
 *
 * Deliberately dependency-free: it reads the YAML line by line rather than
 * pulling a parser into the root toolchain. The file is machine-formatted and
 * the three fields it cares about are one-liners, so a parser buys nothing —
 * and a check that cannot run because an install failed is not a check.
 *
 * Exit codes:
 *   0  spec, rbac.json, rules.md and errors.ts agree
 *   1  at least one dangling reference, reported per item
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OPENAPI_PATH = join(REPO_ROOT, 'docs', 'openapi.yaml');
const RBAC_PATH = join(REPO_ROOT, 'docs', 'rbac.json');
const RULES_PATH = join(REPO_ROOT, 'docs', 'rules.md');
const ERRORS_PATH = join(REPO_ROOT, 'packages', 'shared-types', 'src', 'errors.ts');

/**
 * `public` is not a permission code — it marks an unauthenticated endpoint and
 * is documented as such in the spec's `info.description`.
 */
const PUBLIC_SENTINEL = 'public';

interface Finding {
  readonly check: string;
  readonly where: string;
  readonly value: string;
  readonly hint: string;
}

interface Annotation {
  readonly where: string;
  readonly value: string;
}

// -----------------------------------------------------------------------------
// Ground truth readers
// -----------------------------------------------------------------------------

function readPermissionCodes(): Set<string> {
  const parsed = JSON.parse(readFileSync(RBAC_PATH, 'utf8')) as {
    permissions?: Array<{ code?: string }>;
  };
  const codes = new Set<string>();
  for (const permission of parsed.permissions ?? []) {
    if (typeof permission.code === 'string') codes.add(permission.code);
  }
  if (codes.size === 0) throw new Error(`${RBAC_PATH} declares no permissions`);
  return codes;
}

/** Rule ids come from the `### BR-nn — title` headings, nothing else. */
function readRuleIds(): Set<string> {
  const ids = new Set<string>();
  for (const match of readFileSync(RULES_PATH, 'utf8').matchAll(/^### (BR-\d{2}) /gm)) {
    if (match[1] !== undefined) ids.add(match[1]);
  }
  if (ids.size === 0) throw new Error(`${RULES_PATH} declares no BR-nn headings`);
  return ids;
}

/**
 * Every key of the `ErrorCode` and `GenericProblemCode` const objects. Read as
 * text on purpose: importing the package would make this check depend on a
 * successful build of the very thing it is checking.
 */
function readErrorCodes(): Set<string> {
  const source = readFileSync(ERRORS_PATH, 'utf8');
  const codes = new Set<string>();

  for (const objectName of ['ErrorCode', 'GenericProblemCode']) {
    const start = source.indexOf(`export const ${objectName} = {`);
    if (start === -1) throw new Error(`${ERRORS_PATH} does not export const ${objectName}`);
    const end = source.indexOf('} as const;', start);
    if (end === -1) throw new Error(`${ERRORS_PATH}: ${objectName} is not closed with "} as const;"`);
    for (const match of source.slice(start, end).matchAll(/^\s{2}([A-Z][A-Z0-9_]*):/gm)) {
      if (match[1] !== undefined) codes.add(match[1]);
    }
  }

  if (codes.size === 0) throw new Error(`${ERRORS_PATH} declares no codes`);
  return codes;
}

// -----------------------------------------------------------------------------
// OpenAPI readers
// -----------------------------------------------------------------------------

interface SpecAnnotations {
  readonly permissions: readonly Annotation[];
  readonly businessRules: readonly Annotation[];
  readonly problemCodes: readonly Annotation[];
}

function readSpec(): SpecAnnotations {
  const lines = readFileSync(OPENAPI_PATH, 'utf8').split('\n');

  const permissions: Annotation[] = [];
  const businessRules: Annotation[] = [];
  let operation = '(before the first operationId)';

  lines.forEach((line, index) => {
    const lineNo = index + 1;

    const operationId = /^\s+operationId: (\S+)\s*$/.exec(line)?.[1];
    if (operationId !== undefined) {
      operation = operationId;
      return;
    }

    const permission = /^\s+x-permission: (\S+)\s*$/.exec(line)?.[1];
    if (permission !== undefined) {
      permissions.push({ where: `${operation} (openapi.yaml:${lineNo})`, value: permission });
      return;
    }

    const rules = /^\s+x-business-rules: \[(.*)\]\s*$/.exec(line)?.[1];
    if (rules !== undefined) {
      for (const id of rules.split(',').map((part) => part.trim()).filter(Boolean)) {
        businessRules.push({ where: `${operation} (openapi.yaml:${lineNo})`, value: id });
      }
    }
  });

  if (permissions.length === 0) {
    throw new Error(`${OPENAPI_PATH} has no x-permission annotations — the scan is broken`);
  }

  return { permissions, businessRules, problemCodes: readProblemCodes(lines) };
}

/**
 * The `Problem` schema's description is the human-readable index of error codes.
 * Codes are written as `` `CODE` `` in that block; anything SCREAMING_SNAKE in
 * backticks there is a claim that the code exists in errors.ts.
 */
function readProblemCodes(lines: readonly string[]): Annotation[] {
  const start = lines.findIndex((line) => line === '    Problem:');
  if (start === -1) throw new Error(`${OPENAPI_PATH} has no components.schemas.Problem`);

  const descriptionAt = lines.indexOf('      description: |', start);
  if (descriptionAt === -1 || descriptionAt > start + 10) {
    throw new Error(`${OPENAPI_PATH}: Problem has no literal-block description`);
  }

  const found: Annotation[] = [];
  for (let i = descriptionAt + 1; i < lines.length; i += 1) {
    const line = lines[i] ?? '';
    // The block ends at the first line that is neither blank nor indented into it.
    if (line.trim() !== '' && !line.startsWith('        ')) break;
    for (const match of line.matchAll(/`([A-Z][A-Z0-9_]{2,})`/g)) {
      const code = match[1];
      if (code !== undefined) {
        found.push({ where: `Problem description (openapi.yaml:${i + 1})`, value: code });
      }
    }
  }

  if (found.length === 0) throw new Error(`${OPENAPI_PATH}: Problem description lists no codes`);
  return found;
}

// -----------------------------------------------------------------------------
// The check
// -----------------------------------------------------------------------------

function check(
  name: string,
  annotations: readonly Annotation[],
  known: ReadonlySet<string>,
  hint: string,
  skip: (value: string) => boolean = () => false,
): Finding[] {
  const findings: Finding[] = [];
  for (const annotation of annotations) {
    if (skip(annotation.value) || known.has(annotation.value)) continue;
    findings.push({ check: name, where: annotation.where, value: annotation.value, hint });
  }
  return findings;
}

function main(): void {
  const spec = readSpec();
  const permissionCodes = readPermissionCodes();
  const ruleIds = readRuleIds();
  const errorCodes = readErrorCodes();

  const findings: Finding[] = [
    ...check(
      'x-permission -> docs/rbac.json',
      spec.permissions,
      permissionCodes,
      'add the permission to docs/rbac.json (with grants for all 7 roles), or use an existing code',
      (value) => value === PUBLIC_SENTINEL,
    ),
    ...check(
      'x-business-rules -> docs/rules.md',
      spec.businessRules,
      ruleIds,
      'docs/rules.md is authoritative for BR ids; cite an id it defines with a "### BR-nn" heading',
    ),
    ...check(
      'Problem description -> packages/shared-types/src/errors.ts',
      spec.problemCodes,
      errorCodes,
      'add the code to ErrorCode (or GenericProblemCode) in packages/shared-types/src/errors.ts',
    ),
  ];

  const checked =
    spec.permissions.length + spec.businessRules.length + spec.problemCodes.length;

  if (findings.length === 0) {
    console.log(
      `spec:drift OK — ${checked} references resolve ` +
        `(${spec.permissions.length} permissions, ${spec.businessRules.length} rule ids, ` +
        `${spec.problemCodes.length} error codes).`,
    );
    return;
  }

  console.error(`spec:drift FAILED — ${findings.length} of ${checked} references do not resolve.\n`);
  const byCheck = new Map<string, Finding[]>();
  for (const finding of findings) {
    const bucket = byCheck.get(finding.check) ?? [];
    bucket.push(finding);
    byCheck.set(finding.check, bucket);
  }
  for (const [name, bucket] of byCheck) {
    console.error(`${name} — ${bucket.length} unresolved:`);
    for (const finding of bucket) {
      console.error(`  ✗ ${finding.value}`);
      console.error(`      at   ${finding.where}`);
      console.error(`      fix  ${finding.hint}`);
    }
    console.error('');
  }
  process.exit(1);
}

main();
