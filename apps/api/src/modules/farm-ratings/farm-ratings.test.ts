import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import type { Actor } from '../../auth/requireAuth.js';
import type { Executor } from '../../db/pool.js';
import { pool } from '../../db/pool.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { aFarmerAdmin, aScope, anActor, databaseReady, describeIfDatabase, IDS, newId } from '../../test/factories.js';
import { createFarmRatingsService } from './farm-ratings.service.js';
import {
  farmRatingsRepo,
  type ActiveCategoryRow,
  type CompleteRatingData,
  type CreateDraftRatingData,
  type FarmerZoneRow,
  type FarmRatingsRepo,
  type LatestRatingRow,
  type RatingScoreInput,
} from './farm-ratings.repo.js';
import type { FarmRatingModuleInput, SetFarmRatingBody } from './farm-ratings.schema.js';

describe('FarmRatingsService (Unit)', () => {
  const ZONE_NORTH = IDS.zoneNorth;
  const ZONE_SOUTH = '20000000-0000-4000-8000-000000000002';
  const FARMER_ID = IDS.farmer;

  // BR-06 (LOCKED): exactly 10 named categories, each worth 10 points, summed
  // directly (no multiplier) to a 0-100 total_score.
  const ACTIVE_CATEGORIES: ActiveCategoryRow[] = [
    { id: 'cat-certification', code: 'CERTIFICATION', sortOrder: 1 },
    { id: 'cat-soil-land', code: 'SOIL_LAND', sortOrder: 2 },
    { id: 'cat-farming-practices', code: 'FARMING_PRACTICES', sortOrder: 3 },
    { id: 'cat-environmental', code: 'ENVIRONMENTAL', sortOrder: 4 },
    { id: 'cat-produce-quality', code: 'PRODUCE_QUALITY', sortOrder: 5 },
    { id: 'cat-traceability', code: 'TRACEABILITY', sortOrder: 6 },
    { id: 'cat-social-labor', code: 'SOCIAL_LABOR', sortOrder: 7 },
    { id: 'cat-financial', code: 'FINANCIAL', sortOrder: 8 },
    { id: 'cat-market-relations', code: 'MARKET_RELATIONS', sortOrder: 9 },
    { id: 'cat-innovation', code: 'INNOVATION', sortOrder: 10 },
  ];

  const ALL_TEN_MODULES: FarmRatingModuleInput[] = [
    { categoryCode: 'CERTIFICATION', score: 8 },
    { categoryCode: 'SOIL_LAND', score: 7 },
    { categoryCode: 'FARMING_PRACTICES', score: 9 },
    { categoryCode: 'ENVIRONMENTAL', score: 6 },
    { categoryCode: 'PRODUCE_QUALITY', score: 7 },
    { categoryCode: 'TRACEABILITY', score: 8 },
    { categoryCode: 'SOCIAL_LABOR', score: 6 },
    { categoryCode: 'FINANCIAL', score: 5 },
    { categoryCode: 'MARKET_RELATIONS', score: 6 },
    { categoryCode: 'INNOVATION', score: 5 },
  ]; // sum 67 -> overallRating 67 (direct sum, no x2)

  const mockActorFarmerAdmin: Actor = aFarmerAdmin(ZONE_NORTH);
  const mockScopeFarmerAdminEdit: ResolvedScope = aScope({
    level: ScopeLevel.CONDITIONAL,
    permission: 'farmer.rating.edit',
    roleCode: RoleCode.FARMER_ADMIN,
    zoneIds: [ZONE_NORTH],
    userId: mockActorFarmerAdmin.userId,
    predicate: 'OWN_ZONE_ONLY',
  });

  const mockActorSuperAdmin: Actor = anActor({
    userId: IDS.userSuperAdmin,
    roles: [{ code: RoleCode.SUPER_ADMIN }],
  });
  const mockScopeSuperAdminEdit: ResolvedScope = aScope({
    level: ScopeLevel.ALL,
    permission: 'farmer.rating.edit',
    roleCode: RoleCode.SUPER_ADMIN,
  });

  let lastResolveTierScore: number | undefined;

  /**
   * A stateful fake, not a stub: setRating re-reads the assembled response
   * AFTER writing, and the DRAFT->COMPLETE transition depends on how many
   * distinct categories have been scored so far, so the fake has to actually
   * persist what was written across calls for a multi-call (incremental)
   * scoring test to mean anything.
   */
  const createMockRepo = (overrides?: Partial<FarmRatingsRepo>): FarmRatingsRepo => {
    let ratingId: string | null = null;
    let periodLabel = 'CYCLE-1';
    let status: LatestRatingRow['status'] = 'DRAFT';
    let totalScore: number | null = null;
    let tierCode: string | null = null;
    let ratedAt: Date | null = null;
    let cycleCount = 0;
    const scoresByCategoryId = new Map<string, number>();

    return {
      findFarmerZone: async (_tx, farmerId): Promise<FarmerZoneRow | null> => {
        if (farmerId !== FARMER_ID) return null;
        return { id: FARMER_ID, zoneId: ZONE_NORTH };
      },
      findFarmerForView: async (_tx, farmerId, scope) => {
        if (farmerId !== FARMER_ID) return null;
        if (scope.roleCode === RoleCode.FARMER_ADMIN && !scope.zoneIds.includes(ZONE_NORTH)) return null;
        return { id: FARMER_ID, zoneId: ZONE_NORTH };
      },
      findActiveCategories: async () => ACTIVE_CATEGORIES,
      findLatestRating: async (): Promise<LatestRatingRow | null> => {
        if (ratingId === null) return null;
        return { id: ratingId, periodLabel, status, totalScore, tierCode, ratedAt };
      },
      findScoresForRating: async () => new Map(scoresByCategoryId),
      countRatingCycles: async () => cycleCount,
      createDraftRating: async (_tx, data: CreateDraftRatingData) => {
        ratingId = newId();
        periodLabel = data.periodLabel;
        status = 'DRAFT';
        totalScore = null;
        tierCode = null;
        ratedAt = null;
        scoresByCategoryId.clear();
        cycleCount += 1;
        return ratingId;
      },
      upsertScores: async (_tx, _ratingId, scores: RatingScoreInput[]) => {
        for (const score of scores) {
          scoresByCategoryId.set(score.categoryId, score.score);
        }
      },
      updateNotes: async () => {},
      completeRating: async (_tx, _ratingId, data: CompleteRatingData) => {
        status = 'COMPLETE';
        totalScore = data.totalScore;
        tierCode = data.tierCode;
        ratedAt = new Date();
      },
      updateFarmerRatingCache: async () => {},
      resolveTierForScore: async (_tx, score) => {
        lastResolveTierScore = score;
        if (score < 50) return 'POOR';
        if (score < 70) return 'MODERATE';
        if (score < 85) return 'GOOD';
        return 'EXCELLENT';
      },
      ...overrides,
    };
  };

  const mockTx = { query: async () => ({ rows: [{ id: 'mock-audit-id' }] }) } as unknown as Executor;
  const mockRunTx = async <T>(fn: (tx: Executor) => Promise<T>): Promise<T> => fn(mockTx);
  const mockDb = { query: async () => ({ rows: [] }) } as unknown as Executor;

  const createTestService = (overrides?: Partial<FarmRatingsRepo>) =>
    createFarmRatingsService(createMockRepo(overrides), mockRunTx, mockDb);

  it('never-rated farmer: GET returns all 10 categories with score null, status DRAFT, overallRating/ratingTier/ratedAt null', async () => {
    const service = createTestService();
    const result = await service.getAdminRating(
      aScope({ level: ScopeLevel.ALL, permission: 'farmer.rating.view', roleCode: RoleCode.SUPER_ADMIN }),
      FARMER_ID,
    );
    expect(result.modules).toHaveLength(10);
    expect(result.modules.every((m) => m.score === null && m.maxScore === 10)).toBe(true);
    expect(result.status).toBe('DRAFT');
    expect(result.overallRating).toBeNull();
    expect(result.ratingTier).toBeNull();
    expect(result.ratedAt).toBeNull();
    expect(result.modules[0]!.categoryCode).toBe('CERTIFICATION');
    expect((result.modules[0] as Record<string, unknown>)['name']).toBeUndefined();
  });

  it('BR-06: a rating missing category scores stays DRAFT, not zero — a partial submission does not complete the cycle', async () => {
    const service = createTestService();
    const partial: SetFarmRatingBody = {
      modules: ALL_TEN_MODULES.slice(0, 4), // only 4 of 10 categories
    };
    const result = await service.setRating(mockActorSuperAdmin, mockScopeSuperAdminEdit, FARMER_ID, partial);

    expect(result.status).toBe('DRAFT');
    expect(result.overallRating).toBeNull();
    expect(result.ratingTier).toBeNull();
    expect(result.ratedAt).toBeNull();
    expect(result.modules.filter((m) => m.score !== null)).toHaveLength(4);
  });

  it('BR-06: submitting the remaining categories across a second call completes the same cycle (incremental scoring)', async () => {
    const service = createTestService();
    await service.setRating(mockActorSuperAdmin, mockScopeSuperAdminEdit, FARMER_ID, {
      modules: ALL_TEN_MODULES.slice(0, 4),
    });
    const result = await service.setRating(mockActorSuperAdmin, mockScopeSuperAdminEdit, FARMER_ID, {
      modules: ALL_TEN_MODULES.slice(4),
    });

    expect(result.status).toBe('COMPLETE');
    expect(result.overallRating).toBe(67); // direct sum, no multiplier
    expect(result.ratingTier).toBe('MODERATE'); // 50-69
    expect(result.ratedAt).not.toBeNull();
    expect(result.periodLabel).toBe('CYCLE-1');
  });

  it('computes overallRating as the DIRECT sum of all 10 category scores (no x2), and resolves the tier from rating_tier_config (BR-04a)', async () => {
    lastResolveTierScore = undefined;
    const service = createTestService();
    const result = await service.setRating(mockActorSuperAdmin, mockScopeSuperAdminEdit, FARMER_ID, {
      modules: ALL_TEN_MODULES,
    });

    expect(result.overallRating).toBe(67);
    expect(result.ratingTier).toBe('MODERATE');
    expect(lastResolveTierScore).toBe(67); // proves the tier was RESOLVED, not hardcoded
  });

  it('BR-04a: changing rating_tier_config changes which tier the same score maps to', async () => {
    const service = createTestService({
      resolveTierForScore: async () => 'EXCELLENT',
    });
    const result = await service.setRating(mockActorSuperAdmin, mockScopeSuperAdminEdit, FARMER_ID, {
      modules: ALL_TEN_MODULES,
    });
    expect(result.overallRating).toBe(67);
    expect(result.ratingTier).toBe('EXCELLENT');
  });

  it('resolves all 4 tiers correctly at their boundaries (POOR < 50, MODERATE 50-69, GOOD 70-84, EXCELLENT 85+)', async () => {
    const cases: Array<{ scores: number[]; expectedTotal: number; expectedTier: string }> = [
      { scores: [4, 4, 4, 4, 4, 4, 4, 4, 4, 5], expectedTotal: 41, expectedTier: 'POOR' },
      { scores: [5, 5, 5, 5, 5, 5, 5, 5, 5, 5], expectedTotal: 50, expectedTier: 'MODERATE' },
      { scores: [7, 7, 7, 7, 7, 7, 7, 7, 7, 7], expectedTotal: 70, expectedTier: 'GOOD' },
      { scores: [8, 8, 8, 8, 8, 9, 9, 9, 9, 9], expectedTotal: 85, expectedTier: 'EXCELLENT' },
    ];
    for (const { scores, expectedTotal, expectedTier } of cases) {
      const service = createTestService();
      const modules = ACTIVE_CATEGORIES.map((c, i) => ({ categoryCode: c.code, score: scores[i]! }));
      const result = await service.setRating(mockActorSuperAdmin, mockScopeSuperAdminEdit, FARMER_ID, { modules });
      expect(result.overallRating).toBe(expectedTotal);
      expect(result.ratingTier).toBe(expectedTier);
    }
  });

  it('BR-06b: rejects a categoryCode that is not one of the currently-active categories (422 VALIDATION_FAILED)', async () => {
    const service = createTestService();
    const body: SetFarmRatingBody = {
      modules: [{ categoryCode: 'NOT_A_REAL_CATEGORY', score: 5 }],
    };
    await expect(
      service.setRating(mockActorSuperAdmin, mockScopeSuperAdminEdit, FARMER_ID, body),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED', status: 422 });
  });

  it('BR-06b: rejects a duplicated categoryCode within the same request (422 VALIDATION_FAILED)', async () => {
    const service = createTestService();
    const body: SetFarmRatingBody = {
      modules: [
        { categoryCode: 'CERTIFICATION', score: 8 },
        { categoryCode: 'CERTIFICATION', score: 7 },
      ],
    };
    await expect(
      service.setRating(mockActorSuperAdmin, mockScopeSuperAdminEdit, FARMER_ID, body),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED', status: 422 });
  });

  it('BR-06a: rejects a category score of 11 with SCORE_OUT_OF_RANGE, not a generic 422', async () => {
    // The zod schema only checks integer-ness (score: 11 IS a valid integer),
    // so this exercises the service's own domain check, not request validation.
    const service = createTestService();
    const body: SetFarmRatingBody = {
      modules: [{ categoryCode: 'CERTIFICATION', score: 11 }],
    };
    await expect(
      service.setRating(mockActorSuperAdmin, mockScopeSuperAdminEdit, FARMER_ID, body),
    ).rejects.toMatchObject({ code: 'SCORE_OUT_OF_RANGE', status: 422 });
  });

  it('BR-06a: rejects a negative category score with SCORE_OUT_OF_RANGE', async () => {
    const service = createTestService();
    const body: SetFarmRatingBody = {
      modules: [{ categoryCode: 'CERTIFICATION', score: -1 }],
    };
    await expect(
      service.setRating(mockActorSuperAdmin, mockScopeSuperAdminEdit, FARMER_ID, body),
    ).rejects.toMatchObject({ code: 'SCORE_OUT_OF_RANGE', status: 422 });
  });

  it('OWN_ZONE_ONLY: a Farmer Admin cannot edit a farmer outside their own zone (403 WAREHOUSE_SCOPE_VIOLATION, not 404)', async () => {
    // requirePermission.ts's shared, unmodified assertPredicate implementation
    // throws WAREHOUSE_SCOPE_VIOLATION — mapped to 403 in problem.ts's
    // DEFAULT_STATUS table — for an OWN_ZONE_ONLY violation. The "cross-scope
    // reads return empty, not 403" rule (root CLAUDE.md §2.1) applies to
    // reads; this is a write whose predicate is evaluated only after the
    // farmer row is loaded, by the framework's own established mechanism.
    const service = createTestService();
    const scopeOutsideZone = aScope({
      level: ScopeLevel.CONDITIONAL,
      permission: 'farmer.rating.edit',
      roleCode: RoleCode.FARMER_ADMIN,
      zoneIds: [ZONE_SOUTH], // farmer is in ZONE_NORTH
      userId: mockActorFarmerAdmin.userId,
      predicate: 'OWN_ZONE_ONLY',
    });

    await expect(
      service.setRating(mockActorFarmerAdmin, scopeOutsideZone, FARMER_ID, { modules: ALL_TEN_MODULES }),
    ).rejects.toMatchObject({ code: 'WAREHOUSE_SCOPE_VIOLATION', status: 403 });
  });

  it('OWN_ZONE_ONLY: a Farmer Admin CAN edit a farmer inside their own zone', async () => {
    const service = createTestService();
    const result = await service.setRating(mockActorFarmerAdmin, mockScopeFarmerAdminEdit, FARMER_ID, {
      modules: ALL_TEN_MODULES,
    });
    expect(result.overallRating).toBe(67);
  });

  it('a farmer with no farmer profile gets 404 from GET /me (defensive)', async () => {
    const service = createTestService({ findFarmerZone: async () => null });
    const noFarmerScope = aScope({
      level: ScopeLevel.OWN,
      permission: 'farmer.rating.view',
      roleCode: RoleCode.FARMER,
      farmerId: 'ghost-farmer',
    });
    await expect(service.getMyRating(noFarmerScope)).rejects.toMatchObject({
      code: 'NOT_FOUND',
      status: 404,
    });
  });

  it('cross-zone admin GET returns 404, never 403 (root CLAUDE.md §2.1)', async () => {
    const service = createTestService();
    const scopeOutsideZone = aScope({
      level: ScopeLevel.VIEW,
      permission: 'farmer.rating.view',
      roleCode: RoleCode.FARMER_ADMIN,
      zoneIds: [ZONE_SOUTH],
    });
    await expect(service.getAdminRating(scopeOutsideZone, FARMER_ID)).rejects.toMatchObject({
      code: 'NOT_FOUND',
      status: 404,
    });
  });
});

// ---------------------------------------------------------------------------
// Integration tests — require a real DB (see apps/api/CLAUDE.md).
//
// These exist specifically to verify farm-ratings.repo.ts's scope-filtering
// SQL, which a mocked-repo unit test cannot exercise: MAIN_WH_ADMIN's
// rbac.json role has scopeDimension: null ("oversees all 4 warehouses"), so a
// naive scopedWhere() call would fail-closed to zero rows for it (see the
// long comment in findFarmerForView), plus the real end-to-end DRAFT ->
// COMPLETE lifecycle and tier resolution against the real seeded
// rating_tier_config.
// ---------------------------------------------------------------------------
describeIfDatabase('FarmRatingsRepo scope filtering (Integration)', () => {
  let ready = false;
  let warehouseOoty: string;
  let warehouseCoonoor: string;
  let zoneAtOoty: string;
  let zoneAtCoonoor: string;
  let farmerAtOoty: string;
  let farmerAtCoonoor: string;

  beforeAll(async () => {
    ready = await databaseReady('farm_ratings');
    if (!ready) return;

    const whRes = await pool.query<{ id: string; code: string }>(
      `SELECT id, code FROM warehouses WHERE code IN ('WH-OOTY', 'WH-COON') ORDER BY code`,
    );
    warehouseCoonoor = whRes.rows.find((r) => r.code === 'WH-COON')!.id;
    warehouseOoty = whRes.rows.find((r) => r.code === 'WH-OOTY')!.id;

    const ts = Date.now();

    const zoneOotyRes = await pool.query<{ id: string }>(
      `INSERT INTO zones (code, name, warehouse_id) VALUES ($1, 'FR Test Zone Ooty', $2) RETURNING id`,
      [`FR-TEST-OOTY-${ts}`, warehouseOoty],
    );
    zoneAtOoty = zoneOotyRes.rows[0]!.id;

    const zoneCoonoorRes = await pool.query<{ id: string }>(
      `INSERT INTO zones (code, name, warehouse_id) VALUES ($1, 'FR Test Zone Coonoor', $2) RETURNING id`,
      [`FR-TEST-COON-${ts}`, warehouseCoonoor],
    );
    zoneAtCoonoor = zoneCoonoorRes.rows[0]!.id;

    for (const [label, zoneId] of [
      ['ooty', zoneAtOoty],
      ['coonoor', zoneAtCoonoor],
    ] as const) {
      const userId = newId();
      await pool.query(
        `INSERT INTO users (id, mobile, full_name, user_type, status)
         VALUES ($1, $2, $3, 'FARMER', 'ACTIVE')`,
        [userId, `+9179${String(ts).slice(-8)}${label === 'ooty' ? '1' : '2'}`, `FR Test Farmer ${label}`],
      );
      const farmerRes = await pool.query<{ id: string }>(
        `INSERT INTO farmers (user_id, tohfa_farmer_id, zone_id) VALUES ($1, $2, $3) RETURNING id`,
        [userId, `TF-FR-${label.toUpperCase()}-${ts}`, zoneId],
      );
      if (label === 'ooty') farmerAtOoty = farmerRes.rows[0]!.id;
      else farmerAtCoonoor = farmerRes.rows[0]!.id;
    }
  });

  afterAll(async () => {
    if (!ready) return;
    await pool.query(`DELETE FROM farmers WHERE id = ANY($1::uuid[])`, [[farmerAtOoty, farmerAtCoonoor]]);
    await pool.query(`DELETE FROM zones WHERE id = ANY($1::uuid[])`, [[zoneAtOoty, zoneAtCoonoor]]);
  });

  it('MAIN_WH_ADMIN (scopeDimension: null) sees farmers in every zone under a "view" grant', async () => {
    if (!ready) return;
    const scope = aScope({
      level: ScopeLevel.VIEW,
      permission: 'farmer.rating.view',
      roleCode: RoleCode.MAIN_WH_ADMIN,
    });
    const ootyRow = await farmRatingsRepo.findFarmerForView(pool, farmerAtOoty, scope);
    const coonoorRow = await farmRatingsRepo.findFarmerForView(pool, farmerAtCoonoor, scope);
    expect(ootyRow).not.toBeNull();
    expect(coonoorRow).not.toBeNull();
  });

  it('SUB_WH_ADMIN sees only farmers whose zone belongs to their own warehouse', async () => {
    if (!ready) return;
    const scope = aScope({
      level: ScopeLevel.VIEW,
      permission: 'farmer.rating.view',
      roleCode: RoleCode.SUB_WH_ADMIN,
      warehouseIds: [warehouseOoty],
    });
    const ownWarehouseRow = await farmRatingsRepo.findFarmerForView(pool, farmerAtOoty, scope);
    const otherWarehouseRow = await farmRatingsRepo.findFarmerForView(pool, farmerAtCoonoor, scope);
    expect(ownWarehouseRow).not.toBeNull();
    expect(otherWarehouseRow).toBeNull();
  });

  it('FARMER_ADMIN sees only farmers in their own zone', async () => {
    if (!ready) return;
    const scope = aScope({
      level: ScopeLevel.VIEW,
      permission: 'farmer.rating.view',
      roleCode: RoleCode.FARMER_ADMIN,
      zoneIds: [zoneAtOoty],
    });
    const ownZoneRow = await farmRatingsRepo.findFarmerForView(pool, farmerAtOoty, scope);
    const otherZoneRow = await farmRatingsRepo.findFarmerForView(pool, farmerAtCoonoor, scope);
    expect(ownZoneRow).not.toBeNull();
    expect(otherZoneRow).toBeNull();
  });

  it('end-to-end: PUT (in two incremental calls) then GET computes overallRating/ratingTier from the real seeded rating_tier_config; a fresh cycle after COMPLETE preserves history', async () => {
    if (!ready) return;
    const service = createFarmRatingsService();
    const scope = aScope({
      level: ScopeLevel.ALL,
      permission: 'farmer.rating.edit',
      roleCode: RoleCode.SUPER_ADMIN,
    });
    const actor = anActor({ userId: IDS.userSuperAdmin, roles: [{ code: RoleCode.SUPER_ADMIN }] });

    const categoriesRes = await pool.query<{ code: string }>(
      `SELECT code FROM rating_categories WHERE is_active = true ORDER BY sort_order`,
    );
    const activeCodes = categoriesRes.rows.map((r) => r.code);
    expect(activeCodes).toHaveLength(10); // BR-06 (LOCKED)

    const firstBatch: FarmRatingModuleInput[] = activeCodes.slice(0, 5).map((code) => ({ categoryCode: code, score: 10 }));
    const secondBatch: FarmRatingModuleInput[] = activeCodes.slice(5).map((code) => ({ categoryCode: code, score: 10 }));

    const afterFirstBatch = await service.setRating(actor, scope, farmerAtOoty, { modules: firstBatch });
    expect(afterFirstBatch.status).toBe('DRAFT');
    expect(afterFirstBatch.overallRating).toBeNull();

    const afterSecondBatch = await service.setRating(actor, scope, farmerAtOoty, { modules: secondBatch });
    expect(afterSecondBatch.status).toBe('COMPLETE');
    expect(afterSecondBatch.overallRating).toBe(100); // 10 categories x 10, direct sum
    expect(afterSecondBatch.ratingTier).toBe('EXCELLENT'); // >= 85

    const fetched = await service.getAdminRating(scope, farmerAtOoty);
    expect(fetched.overallRating).toBe(100);
    expect(fetched.status).toBe('COMPLETE');

    // A fresh cycle after COMPLETE starts a new row rather than mutating the
    // completed one — history preserved (root CLAUDE.md §2.3's spirit).
    const lowScoreBatch: FarmRatingModuleInput[] = activeCodes.map((code) => ({ categoryCode: code, score: 5 }));
    const secondCycle = await service.setRating(actor, scope, farmerAtOoty, { modules: lowScoreBatch });
    expect(secondCycle.overallRating).toBe(50);
    expect(secondCycle.ratingTier).toBe('MODERATE');
    expect(secondCycle.periodLabel).not.toBe(afterSecondBatch.periodLabel);

    const cycles = await pool.query<{ count: string }>(
      `SELECT count(*)::text AS count FROM farm_ratings WHERE farmer_id = $1`,
      [farmerAtOoty],
    );
    expect(Number(cycles.rows[0]!.count)).toBeGreaterThanOrEqual(2);

    // The farmer-facing cache reflects the LATEST completed cycle, not the first.
    const cached = await pool.query<{ overall_rating: string; rating_tier_code: string }>(
      `SELECT overall_rating::text, rating_tier_code FROM farmers WHERE id = $1`,
      [farmerAtOoty],
    );
    expect(Number(cached.rows[0]!.overall_rating)).toBe(50);
    expect(cached.rows[0]!.rating_tier_code).toBe('MODERATE');

    // Definition of done: mutating admin actions write an audit_log row in
    // the same transaction.
    const auditRows = await pool.query<{ count: string }>(
      `SELECT count(*)::text AS count FROM audit_log WHERE entity_type = 'farm_rating' AND action_code = 'farmer.rating.edit'`,
    );
    expect(Number(auditRows.rows[0]!.count)).toBeGreaterThanOrEqual(3);
  });
});
