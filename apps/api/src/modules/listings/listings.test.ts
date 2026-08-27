import { describe, expect, it } from 'vitest';
import { createListingsService } from './listings.service.js';
import type { ListingsRepo } from './listings.repo.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { RoleCode } from '@tohfa/shared-types';

const mockFarmerScope: ResolvedScope = {
  actor: {
    userId: '11111111-1111-4111-8111-111111111111',
    roles: [{ code: RoleCode.FARMER }],
    farmerId: '22222222-2222-4222-8222-222222222222',
    customerId: null,
  },
  permission: {
    code: 'listing.create_own',
    module: 'marketing',
    grants: { FARMER: 'own' },
  },
  level: 'own',
  predicate: undefined,
};

function createMockRepo(overrides: Partial<ListingsRepo> = {}): ListingsRepo {
  return {
    create: async () => ({
      id: '33333333-3333-4333-8333-333333333333',
      listingNumber: 'LST-1001',
      farmerId: '22222222-2222-4222-8222-222222222222',
      farmId: null,
      farmCropId: null,
      cropId: '44444444-4444-4444-8444-444444444444',
      grade: 'GRADE_1',
      quantityKg: '250.000',
      askingPricePerKg: '48.00',
      fairPriceId: '55555555-5555-4555-8555-555555555555',
      status: 'PENDING_APPROVAL',
      availableFrom: '2026-08-26',
      photoKeys: [],
      certificationBadges: [],
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: null,
    }),
    findById: async () => null,
    findActiveCountByFarmer: async () => 2,
    findFarmerCertState: async () => ({
      farmerId: '22222222-2222-4222-8222-222222222222',
      isMarketBlocked: false,
      certificates: [
        {
          id: 'cert-1',
          certType: 'NPOP',
          certNumber: 'NPOP/2026/01',
          status: 'VERIFIED',
          expiresAt: '2027-12-31',
        },
      ],
    }),
    findActiveFairPrice: async () => ({
      id: '55555555-5555-4555-8555-555555555555',
      cropId: '44444444-4444-4444-8444-444444444444',
      grade: 'GRADE_1',
      ceilingPrice: '50.00',
      effectiveFrom: '2026-08-01',
      effectiveTo: null,
    }),
    getSystemConfigLimit: async () => ({ limit: 5, enabled: false }),
    update: async () => null,
    withdraw: async () => null,
    list: async () => ({
      items: [],
      total: 0,
      summary: { totalListings: 0, soldKg: '0.000', unsoldKg: '0.000' },
    }),
    ...overrides,
  };
}

describe('ListingsService — Validation Gates & Business Rules', () => {
  it('BR-01a — Rejects listing creation when certificate is expired', async () => {
    const mockRepo = createMockRepo({
      findFarmerCertState: async () => ({
        farmerId: '22222222-2222-4222-8222-222222222222',
        isMarketBlocked: false,
        certificates: [
          {
            id: 'cert-expired',
            certType: 'NPOP',
            certNumber: 'NPOP/2025/EXPIRED',
            status: 'VERIFIED',
            expiresAt: '2025-01-01', // Past date
          },
        ],
      }),
    });

    const service = createListingsService({ repo: mockRepo });

    await expect(
      service.create(mockFarmerScope, {
        cropId: '44444444-4444-4444-8444-444444444444',
        grade: 'GRADE_1',
        quantityKg: '100.000',
        askingPricePerKg: '40.00',
      }),
    ).rejects.toThrow('CERT_EXPIRED');
  });

  it('BR-02a — Rejects listing creation when certificate is unverified', async () => {
    const mockRepo = createMockRepo({
      findFarmerCertState: async () => ({
        farmerId: '22222222-2222-4222-8222-222222222222',
        isMarketBlocked: false,
        certificates: [
          {
            id: 'cert-unverified',
            certType: 'PGS_INDIA',
            certNumber: 'PGS/UNVERIFIED',
            status: 'PENDING',
            expiresAt: '2027-12-31',
          },
        ],
      }),
    });

    const service = createListingsService({ repo: mockRepo });

    await expect(
      service.create(mockFarmerScope, {
        cropId: '44444444-4444-4444-8444-444444444444',
        grade: 'GRADE_1',
        quantityKg: '100.000',
        askingPricePerKg: '40.00',
      }),
    ).rejects.toThrow('CERT_UNVERIFIED');
  });

  it('BR-07a — Rejects listing asking price one paisa above the fair price ceiling', async () => {
    const mockRepo = createMockRepo({
      findActiveFairPrice: async () => ({
        id: '55555555-5555-4555-8555-555555555555',
        cropId: '44444444-4444-4444-8444-444444444444',
        grade: 'GRADE_1',
        ceilingPrice: '50.00',
        effectiveFrom: '2026-08-01',
        effectiveTo: null,
      }),
    });

    const service = createListingsService({ repo: mockRepo });

    await expect(
      service.create(mockFarmerScope, {
        cropId: '44444444-4444-4444-8444-444444444444',
        grade: 'GRADE_1',
        quantityKg: '100.000',
        askingPricePerKg: '50.01', // 1 paisa above ceiling
      }),
    ).rejects.toThrow('PRICE_ABOVE_CEILING');
  });

  it('BR-07b — Valid listing at or below ceiling stores fairPriceId', async () => {
    const mockRepo = createMockRepo();
    const service = createListingsService({ repo: mockRepo });

    const result = await service.create(mockFarmerScope, {
      cropId: '44444444-4444-4444-8444-444444444444',
      grade: 'GRADE_1',
      quantityKg: '100.000',
      askingPricePerKg: '50.00', // Exactly at ceiling
    });

    expect(result.fairPriceId).toBe('55555555-5555-4555-8555-555555555555');
  });

  it('BR-07c — Lowering ceiling afterwards leaves existing accepted listing valid', async () => {
    const acceptedListing = {
      id: '33333333-3333-4333-8333-333333333333',
      listingNumber: 'LST-1001',
      farmerId: '22222222-2222-4222-8222-222222222222',
      farmId: null,
      farmCropId: null,
      cropId: '44444444-4444-4444-8444-444444444444',
      grade: 'GRADE_1' as const,
      quantityKg: '250.000',
      askingPricePerKg: '48.00',
      fairPriceId: '55555555-5555-4555-8555-555555555555',
      status: 'ACCEPTED' as const,
      availableFrom: '2026-08-26',
      photoKeys: [],
      certificationBadges: [],
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: null,
    };

    const mockRepo = createMockRepo({
      findById: async () => acceptedListing,
      findActiveFairPrice: async () => ({
        id: 'new-lower-ceiling-id',
        cropId: '44444444-4444-4444-8444-444444444444',
        grade: 'GRADE_1',
        ceilingPrice: '30.00', // Lowered ceiling
        effectiveFrom: '2026-08-27',
        effectiveTo: null,
      }),
    });

    const service = createListingsService({ repo: mockRepo });
    const fetched = await service.getById(mockFarmerScope, acceptedListing.id);

    expect(fetched.status).toBe('ACCEPTED');
    expect(fetched.askingPricePerKg).toBe('48.00'); // Preserved
  });

  it('BR-14a — Free-tier limit enforced when free_tier_limits_enabled is true', async () => {
    const mockRepo = createMockRepo({
      getSystemConfigLimit: async () => ({ limit: 3, enabled: true }),
      findActiveCountByFarmer: async () => 3, // Already at limit 3
    });

    const service = createListingsService({ repo: mockRepo });

    await expect(
      service.create(mockFarmerScope, {
        cropId: '44444444-4444-4444-8444-444444444444',
        grade: 'GRADE_1',
        quantityKg: '100.000',
        askingPricePerKg: '40.00',
      }),
    ).rejects.toThrow('FREE_TIER_LIMIT');
  });

  it('BR-14b — free_tier_listing_limit is dynamically read from system_config', async () => {
    let systemConfigCalled = false;
    const mockRepo = createMockRepo({
      getSystemConfigLimit: async () => {
        systemConfigCalled = true;
        return { limit: 10, enabled: false };
      },
    });

    const service = createListingsService({ repo: mockRepo });
    await service.create(mockFarmerScope, {
      cropId: '44444444-4444-4444-8444-444444444444',
      grade: 'GRADE_1',
      quantityKg: '100.000',
      askingPricePerKg: '40.00',
    });

    expect(systemConfigCalled).toBe(true);
  });
});
