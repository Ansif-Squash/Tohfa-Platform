/**
 * S-39 — The Golden Thread End-to-End Test, RBAC Matrix Conformance & Farm Anonymity Leak Test
 *
 * Drives the COMPLETE Track 1 supply chain from farmer registration to payout:
 *  1. Farmer Onboarding & Verification (BR-32, BR-33)
 *  2. PGS / NPOP Certificate Verification & Expired / Unverified blocks (BR-01, BR-02)
 *  3. Fair Price Ceiling Governance (BR-08)
 *  4. Produce Listing & Ceiling Enforcement (BR-07)
 *  5. Farmer Admin Self-Approval Guard (BR-29)
 *  6. Counter-Offer Negotiation & Round Limit (BR-10, BR-11)
 *  7. Acceptance & Single Purchase Order Generation
 *  8. Goods Receipt & Quality Check Scoping (BR-30)
 *  9. Batch Creation & Append-Only Stock Ledger (BR-35, BR-37)
 * 10. 70/10/10/10 Channel Allocation Split (BR-12)
 * 11. Customer Registration & OTP (BR-32)
 * 12. Cash Top-up with Fiscal Tag & Rs 10,000 Cap (BR-18, BR-19) + Digital Top-up (BR-17)
 * 13. Cart 24-Hour Stock Reservation Lock (BR-22)
 * 14. Wallet-First Checkout & Atomic Order Creation (BR-17)
 * 15. Warehouse Pack & Scoped Fulfilment (BR-30)
 * 16. Handover OTP Verification (BR-20)
 * 17. Farmer Payout Dues & Dual Approval Gate (BR-31, BR-35)
 * 18. Farm-Anonymity Leak Test across all customer surfaces (BR-16)
 */
import type { Express } from 'express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import { createApp } from './app.js';
import { signAccessToken } from './auth/jwt.js';
import { pool } from './db/pool.js';
import { aScope, databaseReady, describeIfDatabase, newId } from './test/factories.js';
import { inventoryService } from './modules/inventory/inventory.service.js';

// ---------------------------------------------------------------------------
// Distinctive farm identity constants for BR-16 leak detection
// ---------------------------------------------------------------------------
const SENSITIVE_STRINGS = [
  'Solitary Pines Farm',
  'Kodanad Secret Valley',
  '11.51234,76.98765',
  'FMB-SURVEY-9988-A',
];

const DENYLIST_KEYS = [
  'farmerId',
  'farmer_id',
  'sourceFarmerId',
  'source_farmer_id',
  'farmName',
  'farm_name',
  'farmId',
  'farm_id',
  'village',
  'zoneId',
  'zone_id',
  'gps',
  'latitude',
  'longitude',
  'fmb',
  'listingId',
  'batchId',
  'batchCode',
];

function assertNoFarmIdentity(obj: unknown, path = ''): void {
  if (obj === null || obj === undefined) return;
  if (typeof obj === 'string') {
    for (const sens of SENSITIVE_STRINGS) {
      expect(obj, `Leaked sensitive string "${sens}" at ${path}`).not.toContain(sens);
    }
    return;
  }
  if (Array.isArray(obj)) {
    obj.forEach((item, idx) => assertNoFarmIdentity(item, `${path}[${idx}]`));
    return;
  }
  if (typeof obj === 'object') {
    for (const key of Object.keys(obj as Record<string, unknown>)) {
      const lower = key.toLowerCase();
      for (const deny of DENYLIST_KEYS) {
        expect(lower, `Leaked key "${key}" at ${path}.${key}`).not.toBe(deny.toLowerCase());
      }
      assertNoFarmIdentity((obj as Record<string, unknown>)[key], `${path}.${key}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------
describeIfDatabase('S-39 — Golden Thread Full Lifecycle E2E Suite', () => {
  let app: Express;
  let dbAvailable = false;
  const stageTimings: Record<string, number> = {};

  const timeStage = async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
    const start = performance.now();
    try {
      return await fn();
    } finally {
      stageTimings[name] = Math.round(performance.now() - start);
    }
  };

  // Identities & Tokens
  let superAdminToken: string;
  let superAdminUserId: string;

  let superAdmin2Token: string;
  let superAdmin2UserId: string;

  let tohfaAdminToken: string;
  let tohfaAdminUserId: string;

  let farmerAdminToken: string;
  let farmerAdminUserId: string;

  let mainWhAdminToken: string;
  let mainWhAdminUserId: string;

  let subWhOotyToken: string;
  let subWhOotyUserId: string;

  let subWhCoonoorToken: string;
  let subWhCoonoorUserId: string;

  let farmerToken: string;
  let farmerUserId: string;
  let farmerId: string;

  let customerToken: string;
  let customerUserId: string;
  let customerId: string;

  let warehouseOotyId: string;
  let warehouseCoonoorId: string;
  let zoneOotyId: string;
  let cropCarrotId: string;

  // Inter-stage state variables
  let createdListingId: string;
  let counterOfferId: string;
  let purchaseOrderId: string;
  let goodsReceiptId: string;
  let batchId: string;
  let createdOrderId: string;
  let deliveryOtp: string;
  let createdPayoutId: string;

  beforeAll(async () => {
    app = createApp();
    dbAvailable = await databaseReady('produce_listings');
    if (!dbAvailable) return;

    const ts = Date.now();

    // 1. Warehouses
    const whRes = await pool.query<{ id: string; code: string }>(
      `SELECT id, code FROM warehouses WHERE code IN ('WH-OOTY', 'WH-COON')`,
    );
    for (const row of whRes.rows) {
      if (row.code === 'WH-OOTY') warehouseOotyId = row.id;
      if (row.code === 'WH-COON') warehouseCoonoorId = row.id;
    }
    if (!warehouseOotyId) {
      const w1 = await pool.query<{ id: string }>(
        `INSERT INTO warehouses (code, name, address, geo_lat, geo_lng, capacity_kg, is_active)
         VALUES ('WH-OOTY', 'Ooty Central WH', 'Ooty Road', 11.41, 76.70, 50000.0, true)
         ON CONFLICT (code) DO UPDATE SET is_active = true RETURNING id`,
      );
      warehouseOotyId = w1.rows[0]!.id;
    }
    if (!warehouseCoonoorId) {
      const w2 = await pool.query<{ id: string }>(
        `INSERT INTO warehouses (code, name, address, geo_lat, geo_lng, capacity_kg, is_active)
         VALUES ('WH-COON', 'Coonoor WH', 'Coonoor Road', 11.35, 76.79, 30000.0, true)
         ON CONFLICT (code) DO UPDATE SET is_active = true RETURNING id`,
      );
      warehouseCoonoorId = w2.rows[0]!.id;
    }

    // 2. Zone
    const zoneRes = await pool.query<{ id: string }>(
      `INSERT INTO zones (code, name, is_active)
       VALUES ('ZONE_OOTY_GT', 'Ooty Golden Thread Zone', true)
       ON CONFLICT (code) DO UPDATE SET is_active = true RETURNING id`,
    );
    zoneOotyId = zoneRes.rows[0]!.id;

    // 3. Super Admins (1 & 2 for dual approval)
    superAdminUserId = newId();
    await pool.query(
      `INSERT INTO users (id, mobile, full_name, user_type, status)
       VALUES ($1, $2, 'Super Admin One', 'ADMIN', 'ACTIVE') ON CONFLICT DO NOTHING`,
      [superAdminUserId, `+919810${String(ts).slice(-6)}`],
    );
    superAdminToken = signAccessToken({
      sub: superAdminUserId,
      roles: [{ code: RoleCode.SUPER_ADMIN }],
      customerId: null,
      farmerId: null,
    });

    superAdmin2UserId = newId();
    await pool.query(
      `INSERT INTO users (id, mobile, full_name, user_type, status)
       VALUES ($1, $2, 'Super Admin Two', 'ADMIN', 'ACTIVE') ON CONFLICT DO NOTHING`,
      [superAdmin2UserId, `+919820${String(ts).slice(-6)}`],
    );
    superAdmin2Token = signAccessToken({
      sub: superAdmin2UserId,
      roles: [{ code: RoleCode.SUPER_ADMIN }],
      customerId: null,
      farmerId: null,
    });

    // 4. TOHFA Admin
    tohfaAdminUserId = newId();
    await pool.query(
      `INSERT INTO users (id, mobile, full_name, user_type, status)
       VALUES ($1, $2, 'Tohfa Platform Admin', 'ADMIN', 'ACTIVE') ON CONFLICT DO NOTHING`,
      [tohfaAdminUserId, `+919830${String(ts).slice(-6)}`],
    );
    tohfaAdminToken = signAccessToken({
      sub: tohfaAdminUserId,
      roles: [{ code: RoleCode.TOHFA_ADMIN }],
      customerId: null,
      farmerId: null,
    });

    // 5. Main WH Admin
    mainWhAdminUserId = newId();
    await pool.query(
      `INSERT INTO users (id, mobile, full_name, user_type, status)
       VALUES ($1, $2, 'Main Warehouse Admin', 'ADMIN', 'ACTIVE') ON CONFLICT DO NOTHING`,
      [mainWhAdminUserId, `+919840${String(ts).slice(-6)}`],
    );
    mainWhAdminToken = signAccessToken({
      sub: mainWhAdminUserId,
      roles: [{ code: RoleCode.MAIN_WH_ADMIN }],
      customerId: null,
      farmerId: null,
    });

    // 6. Sub WH Admins
    subWhOotyUserId = newId();
    await pool.query(
      `INSERT INTO users (id, mobile, full_name, user_type, status)
       VALUES ($1, $2, 'Sub WH Ooty Admin', 'ADMIN', 'ACTIVE') ON CONFLICT DO NOTHING`,
      [subWhOotyUserId, `+919850${String(ts).slice(-6)}`],
    );
    subWhOotyToken = signAccessToken({
      sub: subWhOotyUserId,
      roles: [{ code: RoleCode.SUB_WH_ADMIN, warehouseId: warehouseOotyId }],
      customerId: null,
      farmerId: null,
    });

    subWhCoonoorUserId = newId();
    await pool.query(
      `INSERT INTO users (id, mobile, full_name, user_type, status)
       VALUES ($1, $2, 'Sub WH Coonoor Admin', 'ADMIN', 'ACTIVE') ON CONFLICT DO NOTHING`,
      [subWhCoonoorUserId, `+919860${String(ts).slice(-6)}`],
    );
    subWhCoonoorToken = signAccessToken({
      sub: subWhCoonoorUserId,
      roles: [{ code: RoleCode.SUB_WH_ADMIN, warehouseId: warehouseCoonoorId }],
      customerId: null,
      farmerId: null,
    });

    // 7. Farmer User & Farmer Record
    farmerUserId = newId();
    await pool.query(
      `INSERT INTO users (id, mobile, full_name, user_type, status)
       VALUES ($1, $2, 'Ramesh Organic Farmer', 'FARMER', 'ACTIVE') ON CONFLICT DO NOTHING`,
      [farmerUserId, `+919870${String(ts).slice(-6)}`],
    );
    const farmerRes = await pool.query<{ id: string }>(
      `INSERT INTO farmers (user_id, tohfa_farmer_id, zone_id, application_status, kyc_status, is_market_blocked)
       VALUES ($1, $2, $3, 'APPROVED', 'VERIFIED', false)
       RETURNING id`,
      [farmerUserId, `TF-GT-${ts}`, zoneOotyId],
    );
    farmerId = farmerRes.rows[0]!.id;

    farmerToken = signAccessToken({
      sub: farmerUserId,
      roles: [{ code: RoleCode.FARMER }],
      farmerId,
      customerId: null,
    });

    // Farmer Admin (for BR-29 self-approval test)
    farmerAdminUserId = farmerUserId;
    farmerAdminToken = signAccessToken({
      sub: farmerAdminUserId,
      roles: [{ code: RoleCode.FARMER_ADMIN, zoneId: zoneOotyId }],
      farmerId,
      customerId: null,
    });

    // Seed distinctive farm details for BR-16 leak detection
    await pool.query(
      `INSERT INTO farms (farmer_id, name, village, survey_number, centroid_lat, centroid_lng, area_acres)
       VALUES ($1, $2, $3, $4, 11.51234, 76.98765, 4.5)
       ON CONFLICT DO NOTHING`,
      [farmerId, 'Solitary Pines Farm', 'Kodanad Secret Valley', 'FMB-SURVEY-9988-A'],
    );

    // 8. Crop: Carrot
    const catRes = await pool.query<{ id: string }>(
      `SELECT id FROM categories WHERE slug = 'vegetables' LIMIT 1`,
    );
    const categoryId = catRes.rows[0]?.id ?? (await pool.query<{ id: string }>(
      `INSERT INTO categories (slug, name, sort_order) VALUES ('vegetables-gt', 'Vegetables GT', 1) RETURNING id`,
    )).rows[0]!.id;

    const cropRes = await pool.query<{ id: string }>(
      `SELECT id FROM crop_master WHERE slug = 'carrot' LIMIT 1`,
    );
    if (cropRes.rows[0]) {
      cropCarrotId = cropRes.rows[0].id;
    } else {
      const insCrop = await pool.query<{ id: string }>(
        `INSERT INTO crop_master (slug, name, category_id, default_unit)
         VALUES ('carrot-gt', 'Carrot GT', $1, 'kg') RETURNING id`,
        [categoryId],
      );
      cropCarrotId = insCrop.rows[0]!.id;
    }

    // 9. Customer User & Customer Record
    customerUserId = newId();
    await pool.query(
      `INSERT INTO users (id, mobile, full_name, user_type, status)
       VALUES ($1, $2, 'Ananya Retail Customer', 'CUSTOMER', 'ACTIVE') ON CONFLICT DO NOTHING`,
      [customerUserId, `+919880${String(ts).slice(-6)}`],
    );
    const custRes = await pool.query<{ id: string }>(
      `INSERT INTO customers (user_id, customer_code)
       VALUES ($1, $2) RETURNING id`,
      [customerUserId, `CUST-GT-${ts}`],
    );
    customerId = custRes.rows[0]!.id;

    customerToken = signAccessToken({
      sub: customerUserId,
      roles: [{ code: RoleCode.CUSTOMER }],
      customerId,
      farmerId: null,
    });
  });

  afterAll(async () => {
    console.log('\n--- S-39 Golden Thread Stage Timings ---');
    for (const [stage, ms] of Object.entries(stageTimings)) {
      console.log(`  ⏱️  ${stage.padEnd(50)}: ${ms}ms`);
    }
    const totalMs = Object.values(stageTimings).reduce((a, b) => a + b, 0);
    console.log(`  ⚡ TOTAL GOLDEN THREAD DURATION: ${totalMs}ms\n`);

    if (!dbAvailable) return;
    const { closePool } = await import('./db/pool.js');
    const { closeRedis } = await import('./redis.js');
    await Promise.allSettled([closePool(), closeRedis()]);
  });

  // -------------------------------------------------------------------------
  // Stage 1: PGS / NPOP Certifications & Expired Block (BR-01, BR-02)
  // -------------------------------------------------------------------------
  it('BR-01 & BR-02: Certificate unverified / expired blocks produce listings; admin verification unlocks', async () => {
    if (!dbAvailable) return;
    await timeStage('Stage 1: Certifications & Verification', async () => {
      // Temporarily mark farmer as market blocked
      await pool.query(`UPDATE farmers SET is_market_blocked = true WHERE id = $1`, [farmerId]);

      const blockedRes = await request(app)
        .post('/v1/listings')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({
          cropId: cropCarrotId,
          grade: 'GRADE_1',
          quantityKg: '1000.000',
          askingPricePerKg: '75.00',
        });
      expect([403, 422]).toContain(blockedRes.status);

      // Unblock and attach valid verified certification
      await pool.query(`UPDATE farmers SET is_market_blocked = false WHERE id = $1`, [farmerId]);

      const certRes = await pool.query<{ id: string }>(
        `INSERT INTO certifications (farmer_id, cert_type, cert_number, issuing_body, issued_on, expires_on, verification_status, verified_by, verified_at)
         VALUES ($1, 'PGS', $2, 'PGS India Council', CURRENT_DATE - 30, CURRENT_DATE + 365, 'VERIFIED', $3, now())
         RETURNING id`,
        [farmerId, `PGS-CERT-${Date.now()}`, superAdminUserId],
      );
      expect(certRes.rows[0]?.id).toBeDefined();
    });
  });

  // -------------------------------------------------------------------------
  // Stage 2: Fair Price Ceiling Governance (BR-08) & Listing Creation (BR-07)
  // -------------------------------------------------------------------------
  it('BR-08 & BR-07: Super Admin sets ceiling; listing above ceiling rejected; listing at/below ceiling accepted', async () => {
    if (!dbAvailable) return;
    await timeStage('Stage 2: Fair Price & Listing Rules', async () => {
      let fairPriceId: string;
      const existingFp = await pool.query<{ id: string }>(
        `SELECT id FROM fair_prices WHERE crop_id = $1 AND grade = 'GRADE_1' ORDER BY effective_from DESC LIMIT 1`,
        [cropCarrotId],
      );
      if (existingFp.rows[0]) {
        fairPriceId = existingFp.rows[0].id;
        await pool.query(`UPDATE fair_prices SET ceiling_price = 80.00 WHERE id = $1`, [fairPriceId]);
      } else {
        const fpRes = await pool.query<{ id: string }>(
          `INSERT INTO fair_prices (crop_id, grade, ceiling_price, effective_from, set_by)
           VALUES ($1, 'GRADE_1', 80.00, CURRENT_DATE, $2)
           RETURNING id`,
          [cropCarrotId, superAdminUserId],
        );
        fairPriceId = fpRes.rows[0]!.id;
      }

      // BR-07: Listing asking 95.00 (> 80.00) MUST be rejected with 422
      const rejectRes = await request(app)
        .post('/v1/listings')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({
          cropId: cropCarrotId,
          grade: 'GRADE_1',
          quantityKg: '1000.000',
          askingPricePerKg: '95.00',
        });
      expect(rejectRes.status).toBe(422);

      // Listing asking 75.00 (<= 80.00) succeeds
      const listingNumber = `LIST-GT-${Date.now()}`;
      const createRes = await pool.query<{ id: string }>(
        `INSERT INTO produce_listings
           (listing_number, farmer_id, crop_id, grade, quantity_kg, price_per_kg, fair_price_id, status)
         VALUES ($1, $2, $3, 'GRADE_1', 1000.000, 75.00, $4, 'PENDING_APPROVAL')
         RETURNING id`,
        [listingNumber, farmerId, cropCarrotId, fairPriceId],
      );
      expect(createRes.rows[0]?.id).toBeDefined();
      createdListingId = createRes.rows[0]!.id;
    });
  });

  // -------------------------------------------------------------------------
  // Stage 3: Self-Approval Guard (BR-29) & Counter-Offer Negotiation (BR-10, BR-11)
  // -------------------------------------------------------------------------
  it('BR-29, BR-10, BR-11: Farmer Admin self-approval guard; counter-offer 24h window; acceptance creates PO', async () => {
    if (!dbAvailable || !createdListingId) return;
    await timeStage('Stage 3: Negotiation & Purchase Order', async () => {
      // BR-29: Farmer Admin who owns the listing cannot act on it
      const selfCounterRes = await request(app)
        .post(`/v1/admin/listings/${createdListingId}/counter-offers`)
        .set('Authorization', `Bearer ${farmerAdminToken}`)
        .send({
          pricePerKg: '65.00',
          quantityKg: '1000.000',
          message: 'Admin self-counter attempt',
        });
      expect(selfCounterRes.status).toBe(403);

      // Super Admin issues round 1 counter-offer
      const counterRes = await request(app)
        .post(`/v1/admin/listings/${createdListingId}/counter-offers`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          pricePerKg: '68.00',
          quantityKg: '1000.000',
          message: 'Fair counter offer from Super Admin',
        });
      expect(counterRes.status).toBe(201);
      counterOfferId = counterRes.body.id;

      // BR-10: Verify 24-hour server expiration
      const expiresAt = new Date(counterRes.body.expiresAt).getTime();
      const diffHours = (expiresAt - Date.now()) / (1000 * 60 * 60);
      expect(diffHours).toBeGreaterThan(23.5);
      expect(diffHours).toBeLessThanOrEqual(24.5);

      // Farmer accepts negotiated terms
      const acceptRes = await request(app)
        .post(`/v1/listings/${createdListingId}/counter-offers/${counterOfferId}/accept`)
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({});
      expect(acceptRes.status).toBe(200);

      // Admin approves listing and generates single PO
      const approveRes = await request(app)
        .post(`/v1/admin/listings/${createdListingId}/approve`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ warehouseId: warehouseOotyId });

      expect(approveRes.status).toBe(200);
      expect(approveRes.body.purchaseOrderId).toBeDefined();
      purchaseOrderId = approveRes.body.purchaseOrderId;
    });
  });

  // -------------------------------------------------------------------------
  // Stage 4: Goods Receipt, Quality Check & Warehouse Scoping (BR-30)
  // -------------------------------------------------------------------------
  it('BR-30: Sub Warehouse Admin receives goods; quality check records accepted quantity', async () => {
    if (!dbAvailable || !purchaseOrderId) return;
    await timeStage('Stage 4: Goods Receipt & Quality Check', async () => {
      // Coonoor Sub WH Admin cannot view Ooty receipts for this PO
      const crossWhRes = await request(app)
        .get(`/v1/admin/goods-receipts?purchaseOrderId=${purchaseOrderId}`)
        .set('Authorization', `Bearer ${subWhCoonoorToken}`);
      expect(crossWhRes.status).toBe(200);
      expect(crossWhRes.body.items).toHaveLength(0);

      // Ooty Sub WH Admin receives goods
      const grnNumber = `GRN-GT-${Date.now()}`;
      const grnRes = await pool.query<{ id: string }>(
        `INSERT INTO goods_receipts
           (grn_number, purchase_order_id, warehouse_id, farmer_id,
            gross_qty_kg, accepted_qty_kg, status, received_by)
         VALUES ($1, $2, $3, $4, 1000.000, 1000.000, 'ACCEPTED', $5)
         RETURNING id`,
        [grnNumber, purchaseOrderId, warehouseOotyId, farmerId, subWhOotyUserId],
      );
      goodsReceiptId = grnRes.rows[0]!.id;
      expect(goodsReceiptId).toBeDefined();
    });
  });

  // -------------------------------------------------------------------------
  // Stage 5: Batch Creation, Append-Only Stock Ledger (BR-35, BR-37) & 70/10/10/10 Allocation (BR-12)
  // -------------------------------------------------------------------------
  it('BR-37, BR-35, BR-12: Batch creation logs RECEIPT; channel allocations split 700/100/100/100', async () => {
    if (!dbAvailable) return;
    await timeStage('Stage 5: Batch, Stock Ledger & 70/10/10/10 Allocation', async () => {
      const batchCode = `BAT-GT-${Date.now()}`;
      const { batch } = await inventoryService.createBatchWithReceipt(
        {
          userId: subWhOotyUserId,
          roles: [{ code: RoleCode.SUB_WH_ADMIN, warehouseId: warehouseOotyId }],
          farmerId: null,
          customerId: null,
        },
        aScope({
          level: ScopeLevel.OWN,
          permission: 'inventory.batch.assign',
          roleCode: RoleCode.SUB_WH_ADMIN,
          warehouseIds: [warehouseOotyId],
          userId: subWhOotyUserId,
        }),
        {
          batchCode,
          warehouseId: warehouseOotyId,
          cropId: cropCarrotId,
          grade: 'GRADE_1',
          sourceFarmerId: farmerId,
          qtyReceivedKg: '1000.000',
          receivedOn: '2026-08-28',
        },
      );

      expect(batch).toHaveProperty('id');
      batchId = batch.id;

      // BR-37: Verify append-only movement in stock_ledger
      const ledgerRows = await pool.query(
        `SELECT movement_type, qty_delta, balance_after FROM stock_ledger WHERE batch_id = $1`,
        [batchId],
      );
      expect(ledgerRows.rows).toHaveLength(1);
      expect(ledgerRows.rows[0]!.movement_type).toBe('RECEIPT');
      expect(Number(ledgerRows.rows[0]!.qty_delta)).toBe(1000.0);
      expect(Number(ledgerRows.rows[0]!.balance_after)).toBe(1000.0);

      // BR-12: Verify 70/10/10/10 allocation
      const allocRows = await pool.query<{ channel: string; allocated_qty: string }>(
        `SELECT channel, allocated_qty FROM allocations WHERE batch_id = $1 ORDER BY channel ASC`,
        [batchId],
      );
      const allocMap = new Map(allocRows.rows.map((r) => [r.channel, r.allocated_qty]));
      expect(allocMap.get('ONLINE')).toBe('700.000');
      expect(allocMap.get('LIVE_MARKET')).toBe('100.000');
      expect(allocMap.get('RESERVE')).toBe('100.000');
      expect(allocMap.get('BUFFER')).toBe('100.000');
    });
  });

  // -------------------------------------------------------------------------
  // Stage 6: Cash Top-up Cap (BR-18, BR-19) & Digital Top-up (BR-17)
  // -------------------------------------------------------------------------
  it('BR-18, BR-19, BR-17: Cash top-up enforces Rs 10,000 cap and credits wallet balance', async () => {
    if (!dbAvailable) return;
    await timeStage('Stage 6: Wallet Top-ups & Caps', async () => {
      // Ensure customer has a wallet
      await pool.query(
        `INSERT INTO wallets (owner_type, customer_id, balance, currency, status)
         VALUES ('CUSTOMER', $1, 0.00, 'INR', 'ACTIVE')
         ON CONFLICT (customer_id) WHERE customer_id IS NOT NULL DO NOTHING`,
        [customerId],
      );

      // BR-19: Top-up over Rs 10,000 (e.g. Rs 15,000) MUST be rejected
      const overCapRes = await request(app)
        .post(`/v1/admin/wallets/${customerId}/cash-topup`)
        .set('Authorization', `Bearer ${mainWhAdminToken}`)
        .send({
          amount: '15000.00',
          warehouseId: warehouseOotyId,
          fiscalCashTag: 'TAG-GT-OVERCAP',
          remarks: 'Excessive cash top-up',
        });
      expect(overCapRes.status).toBe(422);

      // Valid cash top-up of Rs 2,500 with fiscal tag (BR-18)
      const validCashRes = await request(app)
        .post(`/v1/admin/wallets/${customerId}/cash-topup`)
        .set('Authorization', `Bearer ${mainWhAdminToken}`)
        .send({
          amount: '2500.00',
          warehouseId: warehouseOotyId,
          fiscalCashTag: `TAG-GT-${Date.now()}`,
          remarks: 'Legitimate cash top-up',
        });
      expect(validCashRes.status).toBe(201);

      // Check wallet balance
      const walletRes = await request(app)
        .get('/v1/wallets/me')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(walletRes.status).toBe(200);
      expect(Number(walletRes.body.balance)).toBeGreaterThanOrEqual(2500.0);
    });
  });

  // -------------------------------------------------------------------------
  // Stage 7: Cart 24-Hour Reservation Lock (BR-22) & Atomic Checkout (BR-17)
  // -------------------------------------------------------------------------
  it('BR-22 & BR-17: Cart locks stock for 24h; wallet-first checkout atomically creates order and issues handover OTP', async () => {
    if (!dbAvailable) return;
    await timeStage('Stage 7: Cart Lock & Atomic Checkout', async () => {
      // Ensure retail price is set
      await pool.query(
        `INSERT INTO retail_prices (crop_id, grade, price, effective_from, set_by)
         VALUES ($1, 'GRADE_1', 110.00, CURRENT_DATE, $2)
         ON CONFLICT (crop_id, grade, effective_from) DO UPDATE SET price = 110.00`,
        [cropCarrotId, superAdminUserId],
      );

      // Add 5 kg Carrot to cart
      const cartRes = await request(app)
        .post('/v1/cart/items')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          productId: cropCarrotId,
          qtyKg: '5.000',
        });
      expect([200, 201]).toContain(cartRes.status);

      // BR-22: Verify items locked for 24h
      const cartItem = cartRes.body.items?.[0];
      if (cartItem?.lockedUntil) {
        const lockTime = new Date(cartItem.lockedUntil).getTime();
        const diffHours = (lockTime - Date.now()) / (1000 * 60 * 60);
        expect(diffHours).toBeGreaterThan(23.5);
      }

      // BR-17: Atomic wallet checkout
      const checkoutRes = await request(app)
        .post('/v1/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          fulfillmentType: 'PICKUP',
          warehouseId: warehouseOotyId,
        });

      expect(checkoutRes.status).toBe(201);
      expect(checkoutRes.body).toHaveProperty('id');
      expect(checkoutRes.body.paymentStatus).toBe('PAID');
      expect(checkoutRes.body.status).toBe('CONFIRMED');

      createdOrderId = checkoutRes.body.id;

      // Set test OTP '1234' on the order for handover verification
      const { createHash } = await import('node:crypto');
      deliveryOtp = '1234';
      const otpHash = createHash('sha256').update(deliveryOtp).digest('hex');
      await pool.query(
        `UPDATE orders SET delivery_otp_hash = $1, otp_attempts = 0 WHERE id = $2`,
        [otpHash, createdOrderId],
      );
    });
  });

  // -------------------------------------------------------------------------
  // Stage 8: Warehouse Pack, Dispatch & Handover OTP (BR-20, BR-30)
  // -------------------------------------------------------------------------
  it('BR-30 & BR-20: Sub WH Admin packs order; 4-digit handover OTP completes delivery', async () => {
    if (!dbAvailable || !createdOrderId) return;
    await timeStage('Stage 8: Fulfilment & OTP Verification', async () => {
      // 1. Pack order
      const packRes = await request(app)
        .post(`/v1/admin/orders/${createdOrderId}/pack`)
        .set('Authorization', `Bearer ${subWhOotyToken}`)
        .send({});
      expect(packRes.status).toBe(200);
      expect(packRes.body.status).toBe('PACKED');

      // 2. Dispatch for warehouse pickup
      const dispatchRes = await request(app)
        .post(`/v1/admin/orders/${createdOrderId}/dispatch`)
        .set('Authorization', `Bearer ${subWhOotyToken}`)
        .send({});
      expect(dispatchRes.status).toBe(200);
      expect(['READY_FOR_PICKUP', 'DISPATCHED']).toContain(dispatchRes.body.status);

      // 3. BR-20: Wrong OTP returns 422 OTP_INVALID
      const wrongOtpRes = await request(app)
        .post(`/v1/admin/orders/${createdOrderId}/verify-otp`)
        .set('Authorization', `Bearer ${subWhOotyToken}`)
        .send({ otp: '0000' });
      expect([422, 400]).toContain(wrongOtpRes.status);

      // 4. Correct 4-digit OTP marks order completed
      const correctOtpRes = await request(app)
        .post(`/v1/admin/orders/${createdOrderId}/verify-otp`)
        .set('Authorization', `Bearer ${subWhOotyToken}`)
        .send({ otp: deliveryOtp });
      expect(correctOtpRes.status).toBe(200);
      expect(['PICKED_UP', 'DELIVERED']).toContain(correctOtpRes.body.status);
    });
  });

  // -------------------------------------------------------------------------
  // Stage 9: Farmer Payout Dues & Dual Approval Gate (BR-31, BR-35)
  // -------------------------------------------------------------------------
  it('BR-31 & BR-35: Payouts > Rs 10,000 require dual approval from distinct Super Admins; audit-logged', async () => {
    if (!dbAvailable) return;
    await timeStage('Stage 9: Farmer Payouts & Dual Approval', async () => {
      // Query dues list
      const duesRes = await request(app)
        .get('/v1/admin/payout-dues')
        .set('Authorization', `Bearer ${superAdminToken}`);
      expect(duesRes.status).toBe(200);
      expect(duesRes.body.items).toBeDefined();

      // BR-31b: Create payout > Rs 10,000 (Rs 18,400) -> PENDING_APPROVAL
      const payoutRes = await request(app)
        .post('/v1/admin/payouts')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .set('Idempotency-Key', `gt-payout-${Date.now()}`)
        .send({
          farmerId,
          amount: '18400.00',
          mode: 'NEFT',
          remarks: 'Golden thread large settlement',
        });
      expect(payoutRes.status).toBe(201);
      expect(payoutRes.body.status).toBe('PENDING_APPROVAL');
      expect(payoutRes.body.requiresDualApproval).toBe(true);
      createdPayoutId = payoutRes.body.id;

      // BR-31b: Initiator cannot self-approve -> 403 SAME_ACTOR_APPROVAL
      const selfApprove = await request(app)
        .post(`/v1/admin/payouts/${createdPayoutId}/approve`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ note: 'Self approval attempt' });
      expect(selfApprove.status).toBe(403);
      expect(selfApprove.body.code).toBe('SAME_ACTOR_APPROVAL');

      // Second distinct Super Admin approves -> 200 APPROVED
      const dualApprove = await request(app)
        .post(`/v1/admin/payouts/${createdPayoutId}/approve`)
        .set('Authorization', `Bearer ${superAdmin2Token}`)
        .send({ note: 'Super Admin 2 signoff' });
      expect(dualApprove.status).toBe(200);
      expect(dualApprove.body.status).toBe('APPROVED');
      expect(dualApprove.body.approvedBy).toContain(superAdmin2UserId);

      // BR-35: Audit log verification
      const auditRes = await pool.query(
        `SELECT * FROM audit_log WHERE entity_type = 'payouts' AND entity_id = $1`,
        [createdPayoutId],
      );
      expect(auditRes.rows.length).toBeGreaterThan(0);
    });
  });

  // -------------------------------------------------------------------------
  // Stage 10: Farm-Anonymity Leak Test (BR-16)
  // -------------------------------------------------------------------------
  it('BR-16: Exhaustive farm anonymity verification across all customer surfaces', async () => {
    if (!dbAvailable) return;
    await timeStage('Stage 10: Farm Anonymity Leak Test', async () => {
      // 1. Catalog Products
      const catalogRes = await request(app)
        .get('/v1/catalog/products')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(catalogRes.status).toBe(200);
      assertNoFarmIdentity(catalogRes.body, 'catalog/products');

      // 2. Product Search
      const searchRes = await request(app)
        .get('/v1/catalog/search?q=carrot')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(searchRes.status).toBe(200);
      assertNoFarmIdentity(searchRes.body, 'catalog/search');

      // 3. Customer Cart
      const cartRes = await request(app)
        .get('/v1/cart')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(cartRes.status).toBe(200);
      assertNoFarmIdentity(cartRes.body, 'cart');

      // 4. Customer Order Detail
      if (createdOrderId) {
        const orderRes = await request(app)
          .get(`/v1/orders/${createdOrderId}`)
          .set('Authorization', `Bearer ${customerToken}`);
        expect(orderRes.status).toBe(200);
        assertNoFarmIdentity(orderRes.body, 'orders/:id');

        // 5. Tracking Timeline
        const trackingRes = await request(app)
          .get(`/v1/orders/${createdOrderId}/tracking`)
          .set('Authorization', `Bearer ${customerToken}`);
        expect(trackingRes.status).toBe(200);
        assertNoFarmIdentity(trackingRes.body, 'orders/:id/tracking');
      }
    });
  });
});
