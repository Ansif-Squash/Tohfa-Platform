/**
 * Test data builders.
 *
 * Every builder takes a `Partial<T>` of overrides and fills the rest with
 * valid defaults, so a test only states what it actually cares about:
 *
 *   const actor = anActor({ roles: [aRole('SUB_WH_ADMIN', { warehouseId: WH_OOTY })] });
 *
 * Keep defaults VALID. A builder that produces an invalid object by default
 * makes every test that uses it accidentally a validation test.
 */
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { config as loadDotenv } from 'dotenv';
import { describe } from 'vitest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import { REPO_ROOT } from '../paths.js';

loadDotenv({ path: join(REPO_ROOT, '.env') });
import type { Actor } from '../auth/requireAuth.js';
import type { RoleAssignment } from '../auth/jwt.js';
import type { ResolvedScope } from '../rbac/requirePermission.js';
import type { WarehouseResponse } from '../modules/_example/warehouses.schema.js';

/** Stable ids so assertions read well and failures are diffable. */
export const IDS = {
  userSuperAdmin: '00000000-0000-4000-8000-000000000001',
  userTohfaAdmin: '00000000-0000-4000-8000-000000000005',
  userSubWhAdmin: '00000000-0000-4000-8000-000000000002',
  userFarmerAdmin: '00000000-0000-4000-8000-000000000003',
  userFarmer: '00000000-0000-4000-8000-000000000004',
  warehouseOoty: '10000000-0000-4000-8000-000000000001',
  warehouseCoonoor: '10000000-0000-4000-8000-000000000002',
  zoneNorth: '20000000-0000-4000-8000-000000000001',
  farmer: '30000000-0000-4000-8000-000000000001',
  customer: '40000000-0000-4000-8000-000000000001',
} as const;

export function aRole(
  code: RoleCode,
  overrides: Omit<Partial<RoleAssignment>, 'code'> = {},
): RoleAssignment {
  return { code, ...overrides };
}

export function anActor(overrides: Partial<Actor> = {}): Actor {
  return {
    userId: IDS.userSuperAdmin,
    roles: [aRole(RoleCode.SUPER_ADMIN)],
    farmerId: null,
    customerId: null,
    ...overrides,
  };
}

export function aSubWarehouseAdmin(warehouseId: string = IDS.warehouseOoty): Actor {
  return anActor({
    userId: IDS.userSubWhAdmin,
    roles: [aRole(RoleCode.SUB_WH_ADMIN, { warehouseId })],
  });
}

export function aFarmerAdmin(zoneId: string = IDS.zoneNorth): Actor {
  return anActor({
    userId: IDS.userFarmerAdmin,
    roles: [aRole(RoleCode.FARMER_ADMIN, { zoneId })],
  });
}

export function aFarmer(farmerId: string = IDS.farmer): Actor {
  return anActor({
    userId: IDS.userFarmer,
    roles: [aRole(RoleCode.FARMER)],
    farmerId,
  });
}

export function aScope(overrides: Partial<ResolvedScope> = {}): ResolvedScope {
  return {
    level: ScopeLevel.ALL,
    permission: 'warehouse.all.view',
    roleCode: RoleCode.SUPER_ADMIN,
    warehouseIds: [],
    zoneIds: [],
    userId: IDS.userSuperAdmin,
    ...overrides,
  };
}

export function aWarehouse(overrides: Partial<WarehouseResponse> = {}): WarehouseResponse {
  return {
    id: IDS.warehouseOoty,
    code: 'WH-OOTY',
    name: 'Ooty Main Warehouse',
    type: 'MAIN',
    city: 'Ooty',
    capacityKg: 50_000,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

export const newId = (): string => randomUUID();

/**
 * Integration tests run when a DATABASE_URL is configured. They additionally
 * soft-skip at runtime if the server is unreachable or the schema has not been
 * migrated yet (see `databaseReady`), so `pnpm test` stays green on a laptop
 * with no Docker running and in CI before `pnpm db:migrate` has run.
 */
export const hasDatabase = (process.env['DATABASE_URL'] ?? '').length > 0;

/** Minimal structural type: vitest's own SuiteAPI type is not portable across
 *  project references, and a suite callback is all we need here. */
type DescribeFn = (name: string, fn: () => void) => void;

export const describeIfDatabase: DescribeFn = hasDatabase ? describe : describe.skip;

/** True when we can connect AND `table` exists. Never throws. */
export async function databaseReady(table: string): Promise<boolean> {
  if (!hasDatabase) return false;
  try {
    const { pool } = await import('../db/pool.js');
    const target = table.includes('.') ? table : `public.${table}`;
    const result = await pool.query<{ present: boolean }>(
      'SELECT to_regclass($1) IS NOT NULL AS present',
      [target],
    );
    return result.rows[0]?.present === true;
  } catch {
    return false;
  }
}
