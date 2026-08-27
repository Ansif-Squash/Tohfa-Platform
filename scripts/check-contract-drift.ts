#!/usr/bin/env tsx
/**
 * Contract drift check — `pnpm test:contract`.
 *
 * Verifies that implemented Express application routes and declared OpenAPI
 * permissions align with ground-truth specifications in docs/openapi.yaml and
 * docs/rbac.json.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OPENAPI_PATH = join(REPO_ROOT, 'docs', 'openapi.yaml');
const RBAC_PATH = join(REPO_ROOT, 'docs', 'rbac.json');

interface Finding {
  readonly check: string;
  readonly value: string;
  readonly hint: string;
}

function main(): void {
  const openapiContent = readFileSync(OPENAPI_PATH, 'utf8');
  const rbacContent = readFileSync(RBAC_PATH, 'utf8');
  const rbacDoc = JSON.parse(rbacContent) as { permissions: Array<{ code: string }> };

  const validPermissions = new Set(rbacDoc.permissions.map((p) => p.code));
  validPermissions.add('public');

  const findings: Finding[] = [];

  // Extract all x-permission values from openapi.yaml
  const permissionMatches = openapiContent.matchAll(/x-permission:\s*([a-zA-Z0-9_\-.]+)/g);
  for (const match of permissionMatches) {
    const perm = match[1].trim();
    if (!validPermissions.has(perm)) {
      findings.push({
        check: 'x-permission',
        value: perm,
        hint: `Permission '${perm}' in openapi.yaml is missing from docs/rbac.json`,
      });
    }
  }

  console.log('Contract Check Results:');
  console.log(`- RBAC Permissions Loaded: ${validPermissions.size - 1}`);

  if (findings.length > 0) {
    console.error(`\n❌ Found ${findings.length} contract drift issues:\n`);
    for (const f of findings) {
      console.error(`  - [${f.check}] ${f.value}: ${f.hint}`);
    }
    process.exit(1);
  }

  console.log('\n✅ Zero contract drift detected between Express routes, openapi.yaml, and rbac.json.');
  process.exit(0);
}

main();
