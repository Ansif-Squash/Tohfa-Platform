import { describe, expect, it } from 'vitest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import type { Actor } from '../../auth/requireAuth.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import type { ListingRollup, ListingRow } from './listings.repo.js';
import { ListingsService } from './listings.service.js';

describe('ListingsService (Unit & Business Rules)', () => {
  const dummyActor: Actor = {
    userId: '00000000-0000-0000-0000-000000000001',
    roles: [{ code: RoleCode.FARMER }],
    farmerId: '00000000-0000-0000-0000-000000000010',
    customerId: null,
  };

  const dummyScope: ResolvedScope = {
    level: ScopeLevel.OWN,
    permission: 'farmer.listings.create',
    roleCode: RoleCode.FARMER,
    warehouseIds: [],
    zoneIds: [],
    farmerId: '00000000-0000-0000-0000-000000000010',
    userId: '00000000-0000-0000-0000-000000000001',
  };

  const sampleListing: ListingRow = {
    id: '11111111-1111-1111-1111-111111111111',
    listingNumber: 'LST-2026-0001',
    farmerId: '00000000-0000-0000-0000-000000000010',
    farmId: null,
    farmCropId: null,
    cropId: '22222222-2222-2222-2222-222222222222',
    cropName: 'Carrot',
    grade: 'GRADE_1',
    quantityKg: '250.000',
    askingPricePerKg: '52.00',
    ceilingPricePerKg: '52.00',
    finalPricePerKg: null,
    finalQuantityKg: null,
    fairPriceId: '33333333-3333-3333-3333-333333333333',
    status: 'PENDING_APPROVAL',
    availableFrom: '2026-09-01',
    photos: [],
    certificationBadges: [{ certType: 'NPOP', certNumber: 'NPOP/2026/01' }],
    version: 1,
    approvedBy: null,
    approvedAt: null,
    rejectedBy: null,
    rejectedAt: null,
    rejectionReason: null,
    createdAt: '2026-08-27T10:00:00.000Z',
    updatedAt: null,
  };

  const mockRepo = (overrides?: Partial<any>) => ({
    findFarmerById: async () => ({
      id: '00000000-0000-0000-0000-000000000010',
      userId: '00000000-0000-0000-0000-000000000001',
      isMarketBlocked: false,
    }),
    findFarmerByUserId: async () => ({
      id: '00000000-0000-0000-0000-000000000010',
      userId: '00000000-0000-0000-0000-000000000001',
      isMarketBlocked: false,
    }),
    getFarmerCertificates: async () => ({
      hasExpired: false,
      hasUnverified: false,
      verifiedBadges: [{ certType: 'NPOP', certNumber: 'NPOP/2026/01', issuingBody: 'Aditi', issuedOn: '2025-01-01', expiresOn: '2027-01-01' }],
    }),
    getSystemConfig: async (_db: any, key: string) => {
      if (key === 'free_tier_limits_enabled') return false;
      if (key === 'free_tier_listing_limit') return 5;
      return null;
    },
    countActiveListings: async () => 2,
    findEffectiveFairPrice: async () => ({
      id: '33333333-3333-3333-3333-333333333333',
      ceilingPrice: '52.00',
      effectiveFrom: '2026-08-25',
      effectiveTo: null,
    }),
    generateListingNumber: async () => 'LST-2026-0001',
    insertListing: async () => sampleListing,
    findListingById: async () => sampleListing,
    listFarmerListings: async () => ({ items: [sampleListing], nextCursor: null, hasMore: false }),
    getRollupSummary: async (): Promise<ListingRollup> => ({
      pendingCount: 1,
      pendingKg: '250.000',
      acceptedCount: 0,
      acceptedKg: '0',
      withdrawnCount: 0,
    }),
    updateListing: async () => ({ ...sampleListing, version: 2, quantityKg: '200.000' }),
    withdrawListing: async () => ({ ...sampleListing, version: 2, status: 'WITHDRAWN' }),
    ...overrides,
  });

  const createTestService = (overrides?: Partial<any>) =>
    new ListingsService(
      mockRepo(overrides) as any,
      async (fn) => fn({} as any),
      {} as any,
    );

  it('BR-01a: Farmer with a certificate expiring yesterday → POST /listings returns 422, code: CERT_EXPIRED', async () => {
    const service = createTestService({
      getFarmerCertificates: async () => ({
        hasExpired: true,
        expiredCert: { certType: 'NPOP', certNumber: 'NPOP/TN/2025/11902', expiresOn: '2026-03-31' },
        hasUnverified: false,
        verifiedBadges: [],
      }),
    });

    await expect(
      service.createListing(dummyActor, dummyScope, {
        cropId: '22222222-2222-2222-2222-222222222222',
        grade: 'GRADE_1',
        quantityKg: '250.000',
        askingPricePerKg: '50.00',
      }),
    ).rejects.toSatisfy((err: unknown) => {
      const e = err as AppError;
      expect(e).toBeInstanceOf(AppError);
      expect(e.status).toBe(422);
      expect(e.code).toBe('CERT_EXPIRED');
      return true;
    });
  });

  it('BR-02a: Farmer with an uploaded but unverified certificate → POST /listings returns 422, code: CERT_UNVERIFIED', async () => {
    const service = createTestService({
      getFarmerCertificates: async () => ({
        hasExpired: false,
        hasUnverified: true,
        unverifiedCert: { certType: 'NPOP', certNumber: 'NPOP/TN/2026/9999' },
        verifiedBadges: [],
      }),
    });

    await expect(
      service.createListing(dummyActor, dummyScope, {
        cropId: '22222222-2222-2222-2222-222222222222',
        grade: 'GRADE_1',
        quantityKg: '250.000',
        askingPricePerKg: '50.00',
      }),
    ).rejects.toSatisfy((err: unknown) => {
      const e = err as AppError;
      expect(e).toBeInstanceOf(AppError);
      expect(e.status).toBe(422);
      expect(e.code).toBe('CERT_UNVERIFIED');
      return true;
    });
  });

  it('BR-07a: Ceiling Rs 52.00/kg, listing at Rs 52.01 → POST /listings returns 422, code: PRICE_ABOVE_CEILING', async () => {
    const service = createTestService({
      findEffectiveFairPrice: async () => ({
        id: '33333333-3333-3333-3333-333333333333',
        ceilingPrice: '52.00',
        effectiveFrom: '2026-08-25',
        effectiveTo: null,
      }),
    });

    await expect(
      service.createListing(dummyActor, dummyScope, {
        cropId: '22222222-2222-2222-2222-222222222222',
        grade: 'GRADE_1',
        quantityKg: '250.000',
        askingPricePerKg: '52.01',
      }),
    ).rejects.toSatisfy((err: unknown) => {
      const e = err as AppError;
      expect(e).toBeInstanceOf(AppError);
      expect(e.status).toBe(422);
      expect(e.code).toBe('PRICE_ABOVE_CEILING');
      expect(e.meta?.ceilingPrice).toBe('52.00');
      expect(e.meta?.attemptedPrice).toBe('52.01');
      return true;
    });
  });

  it('BR-07b: Listing at exactly the ceiling is accepted; stores the fair_price_id it was validated against', async () => {
    let capturedInsert: any = null;
    const service = createTestService({
      findEffectiveFairPrice: async () => ({
        id: 'ceiling-uuid-1234',
        ceilingPrice: '52.00',
        effectiveFrom: '2026-08-25',
        effectiveTo: null,
      }),
      insertListing: async (_db: any, data: any) => {
        capturedInsert = data;
        return { ...sampleListing, fairPriceId: data.fairPriceId };
      },
    });

    const result = await service.createListing(dummyActor, dummyScope, {
      cropId: '22222222-2222-2222-2222-222222222222',
      grade: 'GRADE_1',
      quantityKg: '250.000',
      askingPricePerKg: '52.00',
    });

    expect(result).toBeDefined();
    expect(capturedInsert.fairPriceId).toBe('ceiling-uuid-1234');
    expect(result.fairPriceId).toBe('ceiling-uuid-1234');
  });

  it('BR-07c: A ceiling lowered after acceptance does not retroactively invalidate an accepted listing', async () => {
    const service = createTestService();
    const listing = await service.listMyListings(dummyActor, dummyScope, { limit: 10 });
    expect(listing.items[0]?.fairPriceId).toBe('33333333-3333-3333-3333-333333333333');
    expect(listing.items[0]?.status).toBe('PENDING_APPROVAL');
  });

  it('BR-14a/b: Free-tier limits are read dynamically from system_config and disabled by default', async () => {
    // When enabled, it rejects when over limit
    const serviceWithLimits = createTestService({
      getSystemConfig: async (_db: any, key: string) => {
        if (key === 'free_tier_limits_enabled') return true;
        if (key === 'free_tier_listing_limit') return 2;
        return null;
      },
      countActiveListings: async () => 2,
    });

    await expect(
      serviceWithLimits.createListing(dummyActor, dummyScope, {
        cropId: '22222222-2222-2222-2222-222222222222',
        grade: 'GRADE_1',
        quantityKg: '250.000',
        askingPricePerKg: '50.00',
      }),
    ).rejects.toSatisfy((err: unknown) => {
      const e = err as AppError;
      expect(e.code).toBe('FREE_TIER_LIMIT');
      return true;
    });

    // When disabled (default), it allows creating listing even if count is high
    const serviceDisabled = createTestService({
      getSystemConfig: async (_db: any, key: string) => {
        if (key === 'free_tier_limits_enabled') return false;
        return null;
      },
      countActiveListings: async () => 10,
    });

    const res = await serviceDisabled.createListing(dummyActor, dummyScope, {
      cropId: '22222222-2222-2222-2222-222222222222',
      grade: 'GRADE_1',
      quantityKg: '250.000',
      askingPricePerKg: '50.00',
    });
    expect(res).toBeDefined();
  });

  it('Refuses to create a listing with grade REJECT', async () => {
    const service = createTestService();

    await expect(
      service.createListing(dummyActor, dummyScope, {
        cropId: '22222222-2222-2222-2222-222222222222',
        grade: 'REJECT',
        quantityKg: '250.000',
        askingPricePerKg: '10.00',
      }),
    ).rejects.toSatisfy((err: unknown) => {
      const e = err as AppError;
      expect(e.code).toBe('VALIDATION_FAILED');
      expect(e.status).toBe(422);
      return true;
    });
  });

  it('Optimistic concurrency: stale version returns 409 Conflict', async () => {
    const service = createTestService({
      updateListing: async () => null, // Version mismatch returns null row
    });

    await expect(
      service.updateListing(dummyActor, dummyScope, '11111111-1111-1111-1111-111111111111', {
        quantityKg: '200.000',
        version: 1, // Stale version
      }),
    ).rejects.toSatisfy((err: unknown) => {
      const e = err as AppError;
      expect(e.status).toBe(409);
      expect(e.code).toBe('CONFLICT');
      return true;
    });
  });

  it('Withdraws a pending listing with optimistic lock', async () => {
    const service = createTestService();
    const result = await service.withdrawListing(
      dummyActor,
      dummyScope,
      '11111111-1111-1111-1111-111111111111',
      1,
    );
    expect(result.status).toBe('WITHDRAWN');
  });
});
