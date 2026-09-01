/**
 * Table-driven RBAC assertions against docs/rbac.json.
 *
 * WHY: docs/rbac.json is edited by humans and by agents. These cases pin the
 * grants that carry real financial or governance weight, so an accidental
 * widening ("just give TOHFA_ADMIN the fair price") fails CI instead of
 * shipping.
 *
 * HOW TO GROW THIS FILE: add a row to `GRANT_CASES`. Do not add a new
 * `it(...)` block — the table is the test. One row per (permission, role) pair
 * that a requirement or the role matrix states explicitly.
 */
import { describe, expect, it } from 'vitest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import { loadRbac } from './loadRbac.js';
import { resolveScope, scopedWhere } from './requirePermission.js';
import { IDS, aFarmerAdmin, aSubWarehouseAdmin, anActor } from '../test/factories.js';

interface GrantCase {
  permission: string;
  role: RoleCode;
  expected: ScopeLevel;
  /** Why this grant matters — quoted from the requirement where possible. */
  because: string;
}

const GRANT_CASES: readonly GrantCase[] = [
  // --- Fair price: Super Admin only. The whole pricing model rests on this. ---
  {
    permission: 'pricing.fair_price.set',
    role: RoleCode.SUPER_ADMIN,
    expected: ScopeLevel.ALL,
    because: 'Only the Super Admin may set the fair price ceiling.',
  },
  {
    permission: 'pricing.fair_price.set',
    role: RoleCode.TOHFA_ADMIN,
    expected: ScopeLevel.NONE,
    because: 'TOHFA Admin explicitly cannot set the fair price ceiling.',
  },
  {
    permission: 'pricing.fair_price.set',
    role: RoleCode.FARMER_ADMIN,
    expected: ScopeLevel.NONE,
    because: 'Elected farmer admins have no pricing authority.',
  },
  {
    permission: 'pricing.fair_price.bulk_update',
    role: RoleCode.SUPER_ADMIN,
    expected: ScopeLevel.ALL,
    because: 'Super Admin can bulk update fair price ceilings.',
  },
  {
    permission: 'pricing.fair_price.bulk_update',
    role: RoleCode.TOHFA_ADMIN,
    expected: ScopeLevel.NONE,
    because: 'TOHFA Admin explicitly cannot bulk update fair price ceilings.',
  },
  {
    permission: 'pricing.retail_price.set',
    role: RoleCode.SUPER_ADMIN,
    expected: ScopeLevel.ALL,
    because: 'Super Admin can set retail prices.',
  },
  {
    permission: 'pricing.retail_price.set',
    role: RoleCode.TOHFA_ADMIN,
    expected: ScopeLevel.ALL,
    because: 'TOHFA Admin can set retail prices.',
  },
  {
    permission: 'pricing.fair_price.view',
    role: RoleCode.FARMER,
    expected: ScopeLevel.VIEW,
    because: 'Farmers must see the ceiling to price a listing, but cannot change it.',
  },

  // --- Listing approval: conditional for Farmer Admin (never their own). ---
  {
    permission: 'listing.approve',
    role: RoleCode.FARMER_ADMIN,
    expected: ScopeLevel.CONDITIONAL,
    because: 'Farmer Admins approve peer listings but never their own (NOT_OWN_LISTING).',
  },
  {
    permission: 'listing.approve',
    role: RoleCode.SUB_WH_ADMIN,
    expected: ScopeLevel.NONE,
    because: 'Warehouse staff have no listing-approval authority.',
  },
  {
    permission: 'listing.approve',
    role: RoleCode.FARMER,
    expected: ScopeLevel.NONE,
    because: 'A farmer cannot approve any listing, including their own.',
  },

  // --- Warehouse scope: Sub Warehouse Admin is confined to its own warehouse. ---
  {
    permission: 'inventory.stock_ledger.view_own',
    role: RoleCode.SUB_WH_ADMIN,
    expected: ScopeLevel.OWN,
    because: 'Sub Warehouse Admin sees only its assigned warehouse ledger.',
  },
  {
    permission: 'inventory.stock_ledger.view_all',
    role: RoleCode.SUB_WH_ADMIN,
    expected: ScopeLevel.NONE,
    because: 'Cross-warehouse ledger access is Main Warehouse Admin and above.',
  },
  {
    permission: 'inventory.stock_adjustment.approve',
    role: RoleCode.SUB_WH_ADMIN,
    expected: ScopeLevel.NONE,
    because: 'A Sub Warehouse Admin cannot approve its own stock adjustments.',
  },
  {
    permission: 'transfer.inter_warehouse.initiate',
    role: RoleCode.TOHFA_ADMIN,
    expected: ScopeLevel.NONE,
    because: 'Inter-warehouse transfers are initiated by Main Warehouse Admin / Super Admin only.',
  },
  {
    permission: 'warehouse.all.view',
    role: RoleCode.MAIN_WH_ADMIN,
    expected: ScopeLevel.ALL,
    because: 'Main Warehouse Admin oversees all four warehouses.',
  },
  {
    permission: 'upload.signed_url.create',
    role: RoleCode.CUSTOMER,
    expected: ScopeLevel.ALL,
    because: 'Every authenticated role (including customer) can request signed upload targets.',
  },
  {
    permission: 'farmer.profile.view_own',
    role: RoleCode.FARMER,
    expected: ScopeLevel.OWN,
    because: 'Farmers may view their own farmer profile, farms, and zone assignment (BR-36).',
  },
  {
    permission: 'certification.manage_own',
    role: RoleCode.FARMER,
    expected: ScopeLevel.OWN,
    because: 'Farmers may create and manage their own PGS/NPOP certification records (BR-02).',
  },
  {
    permission: 'certification.mark_verified',
    role: RoleCode.SUPER_ADMIN,
    expected: ScopeLevel.ALL,
    because: 'Super Admin and TOHFA Admin may verify/unverify certifications manually (BR-02b).',
  },
  {
    permission: 'certification.mark_verified',
    role: RoleCode.FARMER,
    expected: ScopeLevel.NONE,
    because: 'Farmers cannot verify their own certificates under any circumstance (BR-02).',
  },
  {
    permission: 'notification.own.view',
    role: RoleCode.CUSTOMER,
    expected: ScopeLevel.ALL,
    because: 'All authenticated users can view their own in-app notifications (BR-36).',
  },
  {
    permission: 'notification.own.mark_read',
    role: RoleCode.FARMER,
    expected: ScopeLevel.ALL,
    because: 'Users can mark their own notifications as read (BR-36).',
  },
  // --- Cash Top-up: Super, TOHFA, Main and Sub WH Admins may process; Farmer Admin cannot ---
  {
    permission: 'wallet.cash_topup.process',
    role: RoleCode.SUPER_ADMIN,
    expected: ScopeLevel.ALL,
    because: 'Super Admin can process cash top-ups.',
  },
  {
    permission: 'wallet.cash_topup.process',
    role: RoleCode.TOHFA_ADMIN,
    expected: ScopeLevel.ALL,
    because: 'TOHFA Admin can process cash top-ups.',
  },
  {
    permission: 'wallet.cash_topup.process',
    role: RoleCode.MAIN_WH_ADMIN,
    expected: ScopeLevel.ALL,
    because: 'Main Warehouse Admin can process cash top-ups.',
  },
  {
    permission: 'wallet.cash_topup.process',
    role: RoleCode.SUB_WH_ADMIN,
    expected: ScopeLevel.ALL,
    because: 'Sub Warehouse Admin can process cash top-ups.',
  },
  {
    permission: 'wallet.cash_topup.process',
    role: RoleCode.FARMER_ADMIN,
    expected: ScopeLevel.NONE,
    because: 'Farmer Admin has no cash top-up authority.',
  },
  {
    permission: 'wallet.cash_topup.fiscal_tag',
    role: RoleCode.MAIN_WH_ADMIN,
    expected: ScopeLevel.ALL,
    because: 'Main Warehouse Admin can record fiscal cash tags.',
  },
  {
    permission: 'wallet.cash_topup.fiscal_tag',
    role: RoleCode.FARMER_ADMIN,
    expected: ScopeLevel.NONE,
    because: 'Farmer Admin has no fiscal tag authority.',
  },
];

describe('docs/rbac.json grants', () => {
  const rbac = loadRbac();

  it.each(GRANT_CASES)(
    '$permission for $role is "$expected" — $because',
    ({ permission, role, expected }) => {
      expect(rbac.grantFor(permission, role)).toBe(expected);
    },
  );

  it('declares every role code the platform knows about', () => {
    const declared = new Set(rbac.document.roles.map((r) => r.code));
    for (const code of Object.values(RoleCode)) {
      expect(declared.has(code)).toBe(true);
    }
  });

  it('references only predicates that are defined', () => {
    for (const permission of rbac.document.permissions) {
      if (permission.predicate === undefined) continue;
      expect(
        rbac.predicate(permission.predicate),
        `permission ${permission.code} references undefined predicate ${permission.predicate}`,
      ).toBeDefined();
    }
  });

  it('grants Super Admin something for every permission it is listed on', () => {
    for (const permission of rbac.document.permissions) {
      expect(
        permission.grants[RoleCode.SUPER_ADMIN],
        `permission ${permission.code} has no SUPER_ADMIN grant`,
      ).toBeDefined();
    }
  });

  it('exhaustively checks all 5 admin roles on every permission in docs/rbac.json (S-39 matrix conformance)', () => {
    const adminRoles = [
      RoleCode.SUPER_ADMIN,
      RoleCode.TOHFA_ADMIN,
      RoleCode.FARMER_ADMIN,
      RoleCode.MAIN_WH_ADMIN,
      RoleCode.SUB_WH_ADMIN,
    ];

    for (const perm of rbac.document.permissions) {
      for (const role of adminRoles) {
        const grant = rbac.grantFor(perm.code, role);
        expect(
          [ScopeLevel.ALL, ScopeLevel.OWN, ScopeLevel.CONDITIONAL, ScopeLevel.VIEW, ScopeLevel.NONE],
          `Permission ${perm.code} for role ${role} returned invalid scope ${grant}`,
        ).toContain(grant);
      }
    }
  });
});

describe('resolveScope', () => {
  it('returns null when no role grants the permission', () => {
    const farmerOnly = anActor({ roles: [{ code: RoleCode.FARMER }], farmerId: IDS.farmer });
    expect(resolveScope(farmerOnly, 'pricing.fair_price.set')).toBeNull();
  });

  it('picks the highest scope across multiple roles', () => {
    const dualRole = anActor({
      roles: [{ code: RoleCode.FARMER }, { code: RoleCode.SUPER_ADMIN }],
      farmerId: IDS.farmer,
    });
    expect(resolveScope(dualRole, 'pricing.fair_price.set')?.level).toBe(ScopeLevel.ALL);
  });

  it('carries the predicate through for a conditional grant', () => {
    const scope = resolveScope(aFarmerAdmin(), 'listing.approve');
    expect(scope?.level).toBe(ScopeLevel.CONDITIONAL);
    expect(scope?.predicate).toBe('NOT_OWN_LISTING');
  });

  it('carries the actor warehouse assignment into the scope', () => {
    const scope = resolveScope(aSubWarehouseAdmin(), 'inventory.stock_ledger.view_own');
    expect(scope?.level).toBe(ScopeLevel.OWN);
    expect(scope?.warehouseIds).toEqual([IDS.warehouseOoty]);
  });
});

describe('scopedWhere', () => {
  it('is unrestricted for "all"', () => {
    const scope = resolveScope(anActor(), 'warehouse.all.view');
    expect(scope).not.toBeNull();
    const filter = scopedWhere(scope!, { warehouseColumn: 'w.id' });
    expect(filter.sql).toBe('TRUE');
  });

  it('filters by warehouse for an "own" Sub Warehouse Admin scope', () => {
    const scope = resolveScope(aSubWarehouseAdmin(), 'inventory.stock_ledger.view_own');
    const filter = scopedWhere(scope!, { warehouseColumn: 'b.warehouse_id', startIndex: 3 });
    expect(filter.sql).toBe('(b.warehouse_id = ANY($3::uuid[]))');
    expect(filter.params).toEqual([[IDS.warehouseOoty]]);
    expect(filter.nextIndex).toBe(4);
  });

  it('still confines a conditional Farmer Admin to its own zones', () => {
    const scope = resolveScope(aFarmerAdmin(), 'listing.approve');
    const filter = scopedWhere(scope!, { zoneColumn: 'f.zone_id' });
    expect(filter.sql).toContain('f.zone_id = ANY($1::uuid[])');
    expect(filter.params).toEqual([[IDS.zoneNorth]]);
  });
});
