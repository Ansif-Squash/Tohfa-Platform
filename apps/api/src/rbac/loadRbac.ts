/**
 * docs/rbac.json loader.
 *
 * `docs/rbac.json` is the AUTHORITATIVE role/permission matrix — it is derived
 * from the Requirements and the Role & Feature Matrix, and both the database
 * (`role_permissions`) and this API are checked against it by
 * `pnpm rbac:check`. Never fork the rules into code; add a permission to the
 * JSON first, then reference its code from a route.
 *
 * The file is read once and cached. It is a build artefact of the repo, not
 * runtime-mutable state, so a process restart is the correct way to pick up an
 * edit (and CI blocks an edit that drifts from the DB).
 */
import { readFileSync } from 'node:fs';
import { z } from 'zod';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import { RBAC_JSON_PATH } from '../paths.js';

const roleCodeSchema = z.enum([
  RoleCode.SUPER_ADMIN,
  RoleCode.TOHFA_ADMIN,
  RoleCode.FARMER_ADMIN,
  RoleCode.MAIN_WH_ADMIN,
  RoleCode.SUB_WH_ADMIN,
  RoleCode.FARMER,
  RoleCode.CUSTOMER,
]);

const scopeLevelSchema = z.enum([
  ScopeLevel.ALL,
  ScopeLevel.OWN,
  ScopeLevel.VIEW,
  ScopeLevel.CONDITIONAL,
  ScopeLevel.NONE,
]);

const roleSchema = z.object({
  code: roleCodeSchema,
  name: z.string(),
  level: z.number().int(),
  colorHex: z.string().nullable().optional(),
  /** `warehouse_id` for Sub Warehouse Admin, `zone_id` for Farmer Admin. */
  scopeDimension: z.enum(['warehouse_id', 'zone_id', 'farmer_id', 'customer_id']).nullable(),
  summary: z.string().optional(),
});

const predicateSchema = z.object({
  description: z.string(),
  enforcement: z.string(),
  onViolation: z.string(),
});

const permissionSchema = z.object({
  code: z.string().min(1),
  module: z.string(),
  description: z.string().optional(),
  grants: z.record(roleCodeSchema, scopeLevelSchema),
  predicate: z.string().optional(),
  source: z.string().optional(),
});

const scopeFilterSchema = z.object({
  role: roleCodeSchema,
  dimension: z.string(),
  rule: z.string(),
  source: z.string().optional(),
});

const rbacSchema = z.object({
  version: z.string(),
  scopeLevels: z.record(z.string(), z.string()),
  roles: z.array(roleSchema).min(1),
  predicates: z.record(z.string(), predicateSchema),
  permissions: z.array(permissionSchema).min(1),
  scopeFilters: z.array(scopeFilterSchema).default([]),
});

export type RbacRole = z.infer<typeof roleSchema>;
export type RbacPermission = z.infer<typeof permissionSchema>;
export type RbacPredicate = z.infer<typeof predicateSchema>;
export type RbacDocument = z.infer<typeof rbacSchema>;
export type PredicateCode = string;

export interface Rbac {
  readonly version: string;
  readonly document: RbacDocument;
  /** permission code -> permission */
  readonly byCode: ReadonlyMap<string, RbacPermission>;
  /** role code -> role */
  readonly rolesByCode: ReadonlyMap<RoleCode, RbacRole>;
  /** Grant lookup with an explicit `none` default for unlisted roles. */
  grantFor(permissionCode: string, role: RoleCode): ScopeLevel;
  permission(permissionCode: string): RbacPermission;
  predicate(name: string): RbacPredicate | undefined;
}

let cached: Rbac | undefined;

export function loadRbac(filePath: string = RBAC_JSON_PATH): Rbac {
  if (cached !== undefined && filePath === RBAC_JSON_PATH) return cached;

  const raw: unknown = JSON.parse(readFileSync(filePath, 'utf8'));
  const parsed = rbacSchema.safeParse(raw);
  if (!parsed.success) {
    const lines = parsed.error.issues.map(
      (issue) => `  - ${issue.path.join('.')}: ${issue.message}`,
    );
    throw new Error(`${filePath} does not match the expected RBAC shape:\n${lines.join('\n')}`);
  }

  const document = parsed.data;

  const byCode = new Map<string, RbacPermission>();
  for (const permission of document.permissions) {
    if (byCode.has(permission.code)) {
      throw new Error(`Duplicate permission code in rbac.json: ${permission.code}`);
    }
    byCode.set(permission.code, permission);
  }

  const rolesByCode = new Map<RoleCode, RbacRole>();
  for (const role of document.roles) rolesByCode.set(role.code, role);

  const permission = (permissionCode: string): RbacPermission => {
    const found = byCode.get(permissionCode);
    if (found === undefined) {
      // A typo'd permission code must never fail open.
      throw new Error(
        `Unknown permission code "${permissionCode}". Add it to docs/rbac.json first.`,
      );
    }
    return found;
  };

  const rbac: Rbac = {
    version: document.version,
    document,
    byCode,
    rolesByCode,
    permission,
    grantFor: (permissionCode: string, role: RoleCode): ScopeLevel =>
      permission(permissionCode).grants[role] ?? ScopeLevel.NONE,
    predicate: (name: string): RbacPredicate | undefined => document.predicates[name],
  };

  if (filePath === RBAC_JSON_PATH) cached = rbac;
  return rbac;
}

/** Test hook — drop the cache so a fixture file can be loaded. */
export function resetRbacCache(): void {
  cached = undefined;
}
