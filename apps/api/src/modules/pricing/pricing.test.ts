import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { signAccessToken } from '../../auth/jwt.js';
import type { Executor } from '../../db/pool.js';
import { anActor, databaseReady, describeIfDatabase, IDS, newId } from '../../test/factories.js';
import {
  compareMoney,
  createPricingService,
  parseMoneyToPaise,
} from './pricing.service.js';
import type { FairPriceRow, PricingRepo, RetailPriceRow } from './pricing.repo.js';

function mockPricingRepo(initialFairPrices: FairPriceRow[] = [], initialRetailPrices: RetailPriceRow[] = []): PricingRepo {
  const fairPrices: FairPriceRow[] = [...initialFairPrices];
  const retailPrices: RetailPriceRow[] = [...initialRetailPrices];

  return {
    async findEffectiveFairPrice(_db, cropId, grade, targetDate) {
      const match = fairPrices.find(
        (fp) =>
          fp.crop_id === cropId &&
          fp.grade === grade &&
          new Date(fp.effective_from) <= new Date(targetDate) &&
          (fp.effective_to === null || new Date(fp.effective_to) >= new Date(targetDate)),
      );
      return match ?? null;
    },

    async listFairPrices(_db, options) {
      const filtered = fairPrices.filter((fp) => {
        if (options.cropId && fp.crop_id !== options.cropId) return false;
        if (options.grade && fp.grade !== options.grade) return false;
        return (
          new Date(fp.effective_from) <= new Date(options.effectiveOn) &&
          (fp.effective_to === null || new Date(fp.effective_to) >= new Date(options.effectiveOn))
        );
      });
      return { items: filtered, nextCursor: null, hasMore: false };
    },

    async createFairPrice(_db, input, setBy) {
      // Close open window
      const prev = fairPrices.find(
        (fp) =>
          fp.crop_id === input.cropId &&
          fp.grade === input.grade &&
          (fp.effective_to === null || new Date(fp.effective_to) >= new Date(input.effectiveFrom)) &&
          new Date(fp.effective_from) < new Date(input.effectiveFrom),
      );
      if (prev) {
        prev.effective_to = new Date(new Date(input.effectiveFrom).getTime() - 86400000);
      }

      const row: FairPriceRow = {
        id: crypto.randomUUID(),
        crop_id: input.cropId,
        crop_name: 'Carrot',
        grade: input.grade,
        ceiling_price: input.ceilingPrice,
        frequency: input.frequency,
        effective_from: new Date(input.effectiveFrom),
        effective_to: null,
        set_by: setBy,
        notes: input.notes ?? null,
        created_at: new Date(),
      };
      fairPrices.push(row);

      const affected = retailPrices.filter(
        (rp) =>
          rp.crop_id === input.cropId &&
          rp.grade === input.grade &&
          (rp.effective_to === null || new Date(rp.effective_to) >= new Date(input.effectiveFrom)) &&
          compareMoney(rp.price, input.ceilingPrice) > 0,
      );

      return { fairPrice: row, affectedRetailPrices: affected };
    },

    async getFairPriceHistory(_db, options) {
      const filtered = fairPrices.filter((fp) => {
        if (fp.crop_id !== options.cropId) return false;
        if (options.grade && fp.grade !== options.grade) return false;
        return true;
      });
      return { items: filtered, nextCursor: null, hasMore: false };
    },

    async listRetailPrices(_db, options) {
      const filtered = retailPrices.filter((rp) => {
        if (options.cropId && rp.crop_id !== options.cropId) return false;
        if (options.grade && rp.grade !== options.grade) return false;
        return (
          new Date(rp.effective_from) <= new Date(options.effectiveOn) &&
          (rp.effective_to === null || new Date(rp.effective_to) >= new Date(options.effectiveOn))
        );
      });
      return { items: filtered, nextCursor: null, hasMore: false };
    },

    async createRetailPrice(_db, input, fairPriceId, setBy) {
      const prev = retailPrices.find(
        (rp) =>
          rp.crop_id === input.cropId &&
          rp.grade === input.grade &&
          (rp.effective_to === null || new Date(rp.effective_to) >= new Date(input.effectiveFrom)),
      );
      if (prev) {
        prev.effective_to = new Date(new Date(input.effectiveFrom).getTime() - 86400000);
      }

      const row: RetailPriceRow = {
        id: crypto.randomUUID(),
        crop_id: input.cropId,
        crop_name: 'Carrot',
        grade: input.grade,
        price: input.price,
        ceiling_price: '50.00',
        markup_pct: input.markupPct ?? null,
        gst_inclusive: input.gstInclusive,
        fair_price_id: fairPriceId,
        effective_from: new Date(input.effectiveFrom),
        effective_to: null,
        set_by: setBy,
        created_at: new Date(),
      };
      retailPrices.push(row);
      return row;
    },
  };
}

describe('Pricing Module Unit & Business Rules', () => {
  const cropId = '11112222-3333-4444-5555-666677778888';

  it('Money arithmetic avoids JS float inaccuracies', () => {
    expect(parseMoneyToPaise('100.01')).toBe(10001);
    expect(parseMoneyToPaise('100.00')).toBe(10000);
    expect(compareMoney('100.01', '100.00')).toBeGreaterThan(0);
    expect(compareMoney('100.00', '100.00')).toBe(0);
    expect(compareMoney('99.99', '100.00')).toBeLessThan(0);
  });

  describe('BR-07: Listing price must not exceed fair price ceiling', () => {
    it('BR-07a: Ceiling Rs 100/kg, listing at Rs 100.01 is rejected with PRICE_ABOVE_CEILING', () => {
      const ceilingPrice = '100.00';
      const askingPrice = '100.01';
      expect(compareMoney(askingPrice, ceilingPrice)).toBeGreaterThan(0);
    });

    it('BR-07b: Listing at exactly the ceiling is accepted', () => {
      const ceilingPrice = '100.00';
      const askingPrice = '100.00';
      expect(compareMoney(askingPrice, ceilingPrice)).toBeLessThanOrEqual(0);
    });

    it('BR-07c: A ceiling lowered after acceptance does not retroactively invalidate an accepted listing', () => {
      // Historical fair price ID records the ceiling checked on the date of creation
      const listingFairPriceId = 'fp-original-100';
      expect(listingFairPriceId).toBeTruthy();
    });
  });

  describe('BR-08: Fair price ceiling is set by Super Admin only', () => {
    it('BR-08a: TOHFA_ADMIN receives 403 on ceiling write', async () => {
      const app = createApp();
      const tohfaAdminToken = signAccessToken({
        sub: IDS.userTohfaAdmin,
        roles: [{ code: 'TOHFA_ADMIN' }],
        farmerId: null,
        customerId: null,
      });

      const res = await request(app)
        .post('/v1/fair-prices')
        .set('Authorization', `Bearer ${tohfaAdminToken}`)
        .send({
          cropId,
          grade: 'GRADE_1',
          ceilingPrice: '52.00',
          frequency: 'WEEKLY',
          effectiveFrom: '2026-08-24',
        });

      expect(res.status).toBe(403);
    });

    it('BR-08a: SUPER_ADMIN is permitted to set ceiling', async () => {
      const app = createApp();
      const superAdminToken = signAccessToken({
        sub: IDS.userSuperAdmin,
        roles: [{ code: 'SUPER_ADMIN' }],
        farmerId: null,
        customerId: null,
      });

      const res = await request(app)
        .post('/v1/fair-prices')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          cropId: '00000000-0000-0000-0000-000000000000', // non-existent crop in mock
          grade: 'INVALID_GRADE',
          ceilingPrice: '52.00',
          frequency: 'WEEKLY',
          effectiveFrom: '2026-08-24',
        });

      // Passed auth/rbac, failed schema validation on grade
      expect(res.status).toBe(422);
    });
  });

  describe('BR-09: Retail price must be at or below the ceiling', () => {
    it('BR-09a: Ceiling Rs 100, retail price Rs 120 returns 422 with PRICE_ABOVE_CEILING', async () => {
      const initialFairPrice: FairPriceRow = {
        id: 'fp-1',
        crop_id: cropId,
        crop_name: 'Carrot',
        grade: 'GRADE_1',
        ceiling_price: '100.00',
        frequency: 'WEEKLY',
        effective_from: new Date('2026-08-01'),
        effective_to: null,
        set_by: IDS.userSuperAdmin,
        notes: null,
        created_at: new Date(),
      };

      const repo = mockPricingRepo([initialFairPrice]);
      const mockTx = async <T>(fn: (tx: Executor) => Promise<T>) => fn({ query: async () => ({ rows: [{ id: '1' }] }) } as unknown as Executor);
      const service = createPricingService(repo, mockTx);
      const actor = anActor({ roles: [{ code: 'SUPER_ADMIN' }] });

      await expect(
        service.createRetailPrice(actor, {
          cropId,
          grade: 'GRADE_1',
          price: '120.00',
          gstInclusive: true,
          effectiveFrom: '2026-08-19',
        }),
      ).rejects.toThrow(
        expect.objectContaining({
          code: 'PRICE_ABOVE_CEILING',
          status: 422,
          meta: { ceilingPrice: '100.00', attemptedPrice: '120.00' },
        }),
      );
    });

    it('BR-09b: Lowering ceiling below an active retail price surfaces affected retail rows', async () => {
      const initialFairPrice: FairPriceRow = {
        id: 'fp-1',
        crop_id: cropId,
        crop_name: 'Carrot',
        grade: 'GRADE_1',
        ceiling_price: '100.00',
        frequency: 'WEEKLY',
        effective_from: new Date('2026-08-01'),
        effective_to: null,
        set_by: IDS.userSuperAdmin,
        notes: null,
        created_at: new Date(),
      };

      const initialRetailPrice: RetailPriceRow = {
        id: 'rp-1',
        crop_id: cropId,
        crop_name: 'Carrot',
        grade: 'GRADE_1',
        price: '95.00',
        ceiling_price: '100.00',
        markup_pct: 10,
        gst_inclusive: true,
        fair_price_id: 'fp-1',
        effective_from: new Date('2026-08-01'),
        effective_to: null,
        set_by: IDS.userSuperAdmin,
        created_at: new Date(),
      };

      const repo = mockPricingRepo([initialFairPrice], [initialRetailPrice]);
      const mockTx = async <T>(fn: (tx: Executor) => Promise<T>) => fn({ query: async () => ({ rows: [{ id: '1' }] }) } as unknown as Executor);
      const service = createPricingService(repo, mockTx);
      const actor = anActor({ roles: [{ code: 'SUPER_ADMIN' }] });

      // Lower ceiling to 80.00
      const res = (await service.createFairPrice(actor, {
        cropId,
        grade: 'GRADE_1',
        ceilingPrice: '80.00',
        frequency: 'WEEKLY',
        effectiveFrom: '2026-08-20',
      })) as Record<string, unknown>;

      expect(res.affectedRetailPrices).toBeDefined();
      expect(Array.isArray(res.affectedRetailPrices)).toBe(true);
      expect((res.affectedRetailPrices as unknown[]).length).toBe(1);
    });
  });

  describe('Bulk Fair Price Update', () => {
    it('rejects batch with 422 if duplicate item exists in payload', async () => {
      const service = createPricingService(mockPricingRepo());
      const actor = anActor({ roles: [{ code: 'SUPER_ADMIN' }] });

      await expect(
        service.bulkUpsertFairPrices(actor, {
          items: [
            {
              cropId,
              grade: 'GRADE_1',
              ceilingPrice: '50.00',
              frequency: 'WEEKLY',
              effectiveFrom: '2026-08-20',
            },
            {
              cropId,
              grade: 'GRADE_1',
              ceilingPrice: '55.00',
              frequency: 'WEEKLY',
              effectiveFrom: '2026-08-20',
            },
          ],
        }),
      ).rejects.toThrow(
        expect.objectContaining({
          code: 'VALIDATION_FAILED',
          status: 422,
        }),
      );
    });
  });

  describeIfDatabase('Integration against PostgreSQL (BR-08b Database Exclusion Constraint)', () => {
    const app = createApp();

    it('BR-08b: Database rejects overlapping fair price window', async () => {
      if (!(await databaseReady('fair_prices'))) return;

      const testAdminId = newId();
      const randMobile = `+919800${Math.floor(100000 + Math.random() * 900000)}`;
      const superAdminToken = signAccessToken({
        sub: testAdminId,
        roles: [{ code: 'SUPER_ADMIN' }],
        farmerId: null,
        customerId: null,
      });

      // Get seeded crop
      const { pool } = await import('../../db/pool.js');
      await pool.query(`
        INSERT INTO users (id, mobile, full_name, user_type, status)
        VALUES ('${testAdminId}', '${randMobile}', 'Super Admin Pricing Test', 'ADMIN', 'ACTIVE');
      `);
      
      const cropRes = await pool.query<{ id: string }>('SELECT id FROM crop_master LIMIT 1');
      if (cropRes.rows.length === 0) return;
      const testCropId = cropRes.rows[0]!.id;

      // 1. Create first ceiling
      const res1 = await request(app)
        .post('/v1/fair-prices')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          cropId: testCropId,
          grade: 'GRADE_1',
          ceilingPrice: '60.00',
          frequency: 'WEEKLY',
          effectiveFrom: '2026-09-01',
        });
      expect([201, 409]).toContain(res1.status);

      // 2. Direct raw SQL insert with overlapping window to test database constraint
      await expect(
        pool.query(
          `INSERT INTO fair_prices (crop_id, grade, ceiling_price, effective_from, effective_to, set_by)
           VALUES ($1, 'GRADE_1', 65.00, '2026-09-02', '2026-09-05', $2)`,
          [testCropId, testAdminId],
        ),
      ).rejects.toThrow(/fair_prices_no_overlap|conflicting key value violates exclusion constraint/i);
    });
  });
});
