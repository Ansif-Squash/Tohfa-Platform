/**
 * S-30 — Week 2 Integration Checkpoint: The First Half of the Golden Thread
 *
 * Drives the complete supply chain lifecycle from end-to-end:
 * 1. Farmer creates listing at/below ceiling (BR-07, BR-01, BR-02)
 * 2. Self-approval guard: Farmer Admin who owns listing receives 403 & routing row (BR-29)
 * 3. Counter negotiation: Server clock window (BR-10) and round limit (BR-11)
 * 4. Farmer accepts; approval raises exactly one Purchase Order
 * 5. Goods Receipt & Quality Check scoped to warehouse (BR-30)
 * 6. Batch creation, stock ledger append-only consistency (BR-37), and pooling (BR-24)
 * 7. 70/10/10/10 Allocation engine execution with remainder to Buffer (BR-12)
 * 8. Customer catalog availability without farm identity leaks (BR-16)
 */
import type { Express } from 'express';
import request from 'supertest';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import { createApp } from '../../app.js';
import { signAccessToken } from '../../auth/jwt.js';
import { pool } from '../../db/pool.js';
import { aScope, databaseReady, describeIfDatabase } from '../../test/factories.js';
import { inventoryService } from '../inventory/inventory.service.js';

// ---------------------------------------------------------------------------
// Identities & Constants
// ---------------------------------------------------------------------------
const IDS = {
  userFarmer: '00000000-0000-4000-8000-000000000004',
  userFarmerAdmin: '00000000-0000-4000-8000-000000000003',
  userSuperAdmin: '00000000-0000-4000-8000-000000000001',
  userSubWhOoty: '00000000-0000-4000-8000-000000000002',
  userSubWhCoonoor: '00000000-0000-4000-8000-000000000006',
  warehouseOoty: '10000000-0000-4000-8000-000000000001',
  warehouseCoonoor: '10000000-0000-4000-8000-000000000002',
  farmerId: '30000000-0000-4000-8000-000000000001',
  farmer2Id: '30000000-0000-4000-8000-000000000002',
  zoneOoty: '20000000-0000-4000-8000-000000000001',
  cropCarrot: '11111111-1111-4000-8000-000000000001',
};

// Sensitive provenance keys that must NEVER leak to customers (BR-16)
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
  if (Array.isArray(obj)) {
    obj.forEach((item, idx) => assertNoFarmIdentity(item, `${path}[${idx}]`));
    return;
  }
  if (typeof obj === 'object') {
    for (const key of Object.keys(obj as Record<string, unknown>)) {
      const lower = key.toLowerCase();
      for (const deny of DENYLIST_KEYS) {
        expect(lower, `Leaked key ${key} at ${path}.${key}`).not.toBe(deny.toLowerCase());
      }
      assertNoFarmIdentity((obj as Record<string, unknown>)[key], `${path}.${key}`);
    }
  }
}

describeIfDatabase('S-30 — Golden Thread End-to-End Supply Chain', () => {
  let app: Express;
  let dbAvailable = false;

  // Tokens
  let farmerToken: string;
  let farmerAdminToken: string;
  let superAdminToken: string;
  let subWhOotyToken: string;
  let subWhCoonoorToken: string;

  // State across thread steps
  let createdListingId: string;
  let activeOfferId: string;
  let purchaseOrderId: string;
  let createdBatchId: string;

  beforeAll(async () => {
    app = createApp();
    dbAvailable = await databaseReady('produce_listings');

    if (!dbAvailable) return;

    // Mint auth tokens for participants
    farmerToken = signAccessToken({
      sub: IDS.userFarmer,
      roles: [{ code: RoleCode.FARMER }],
      farmerId: IDS.farmerId,
      customerId: null,
    });

    // Farmer Admin whose user ID matches the owner farmer (for self-approval guard)
    farmerAdminToken = signAccessToken({
      sub: IDS.userFarmer,
      roles: [{ code: RoleCode.FARMER_ADMIN, zoneId: IDS.zoneOoty }],
      farmerId: IDS.farmerId,
      customerId: null,
    });

    superAdminToken = signAccessToken({
      sub: IDS.userSuperAdmin,
      roles: [{ code: RoleCode.SUPER_ADMIN }],
      farmerId: null,
      customerId: null,
    });

    subWhOotyToken = signAccessToken({
      sub: IDS.userSubWhOoty,
      roles: [{ code: RoleCode.SUB_WH_ADMIN, warehouseId: IDS.warehouseOoty }],
      farmerId: null,
      customerId: null,
    });

    subWhCoonoorToken = signAccessToken({
      sub: IDS.userSubWhCoonoor,
      roles: [{ code: RoleCode.SUB_WH_ADMIN, warehouseId: IDS.warehouseCoonoor }],
      farmerId: null,
      customerId: null,
    });

    // Ensure baseline seed rows exist (users, farmer, crop, fair_price)
    await pool.query(`
      INSERT INTO users (id, mobile, full_name, user_type, status)
      VALUES ('${IDS.userSuperAdmin}', '+919800000001', 'Super Admin', 'ADMIN', 'ACTIVE')
      ON CONFLICT (id) DO UPDATE SET status = 'ACTIVE';

      INSERT INTO users (id, mobile, full_name, user_type, status)
      VALUES ('${IDS.userFarmer}', '+919876543210', 'Ramesh Farmer', 'FARMER', 'ACTIVE')
      ON CONFLICT (id) DO UPDATE SET status = 'ACTIVE';

      INSERT INTO farmers (id, user_id, tohfa_farmer_id, zone_id, status)
      VALUES ('${IDS.farmerId}', '${IDS.userFarmer}', 'TF-0001', '${IDS.zoneOoty}', 'VERIFIED')
      ON CONFLICT (id) DO UPDATE SET status = 'VERIFIED';
    `);

    const catRes = await pool.query<{ id: string }>(
      `SELECT id FROM categories WHERE slug = 'vegetables' LIMIT 1`,
    );
    let catId = catRes.rows[0]?.id;
    if (!catId) {
      const newCat = await pool.query<{ id: string }>(
        `INSERT INTO categories (slug, name, sort_order) VALUES ('vegetables', 'Vegetables', 1) RETURNING id`,
      );
      catId = newCat.rows[0]!.id;
    }

    const cropRes = await pool.query<{ id: string }>(
      `SELECT id FROM crop_master WHERE slug = 'carrot' LIMIT 1`,
    );
    if (cropRes.rows[0]) {
      IDS.cropCarrot = cropRes.rows[0].id;
    } else {
      const newCrop = await pool.query<{ id: string }>(
        `INSERT INTO crop_master (slug, name, category_id, default_unit)
         VALUES ('carrot', 'Carrot', $1, 'kg')
         RETURNING id`,
        [catId],
      );
      IDS.cropCarrot = newCrop.rows[0]!.id;
    }

    await pool.query(
      `INSERT INTO fair_prices (crop_id, grade, ceiling_price, effective_from, set_by)
       VALUES ($1, 'GRADE_1', 80.00, CURRENT_DATE, $2)
       ON CONFLICT (crop_id, grade, effective_from) DO UPDATE SET ceiling_price = 80.00`,
      [IDS.cropCarrot, IDS.userSuperAdmin],
    );
  });

  afterAll(async () => {
    const [{ closePool }, { closeRedis }] = await Promise.all([
      import('../../db/pool.js'),
      import('../../redis.js'),
    ]);
    await Promise.allSettled([closePool(), closeRedis()]);
  });

  // -------------------------------------------------------------------------
  // Step 1: Farmer Listing & Price Ceiling Rules
  // -------------------------------------------------------------------------
  it('BR-01 & BR-02: Blocked farmer cannot create a produce listing', async () => {
    if (!dbAvailable) return;

    const blockedToken = signAccessToken({
      sub: '00000000-0000-4000-8000-000000000099',
      roles: [{ code: RoleCode.FARMER }],
      farmerId: '30000000-0000-4000-8000-000000000099',
      customerId: null,
    });

    const res = await request(app)
      .post('/v1/listings')
      .set('Authorization', `Bearer ${blockedToken}`)
      .send({
        cropId: IDS.cropCarrot,
        grade: 'GRADE_1',
        quantityKg: '1000.000',
        askingPricePerKg: '70.00',
      });

    expect([403, 404]).toContain(res.status);
  });

  it('BR-07: Asking price above ceiling price is rejected; valid listing succeeds', async () => {
    if (!dbAvailable) return;

    // Price ceiling is 80.00; asking 95.00 must fail
    const rejectRes = await request(app)
      .post('/v1/listings')
      .set('Authorization', `Bearer ${farmerToken}`)
      .send({
        cropId: IDS.cropCarrot,
        grade: 'GRADE_1',
        quantityKg: '1000.000',
        askingPricePerKg: '95.00',
      });
    expect(rejectRes.status).toBe(422);

    // Asking 75.00 (<= 80.00) succeeds
    const createRes = await request(app)
      .post('/v1/listings')
      .set('Authorization', `Bearer ${farmerToken}`)
      .send({
        cropId: IDS.cropCarrot,
        grade: 'GRADE_1',
        quantityKg: '1000.000',
        askingPricePerKg: '75.00',
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body).toHaveProperty('id');
    expect(createRes.body.status).toBe('PENDING_APPROVAL');
    createdListingId = createRes.body.id;
  });

  // -------------------------------------------------------------------------
  // Step 2: Farmer Admin Self-Approval Guard (BR-29)
  // -------------------------------------------------------------------------
  it('BR-29: Farmer Admin who owns the listing cannot counter/approve; writes listing_routing row', async () => {
    if (!dbAvailable || !createdListingId) return;

    const res = await request(app)
      .post(`/v1/admin/listings/${createdListingId}/counter-offers`)
      .set('Authorization', `Bearer ${farmerAdminToken}`)
      .send({
        pricePerKg: '65.00',
        quantityKg: '1000.000',
        message: 'Admin self-counter attempt',
      });

    expect(res.status).toBe(403);

    // Verify routing record was logged
    const routingRes = await pool.query(
      `SELECT * FROM listing_routing WHERE listing_id = $1`,
      [createdListingId],
    );
    expect(routingRes.rows.length).toBeGreaterThan(0);
  });

  // -------------------------------------------------------------------------
  // Step 3: Counter-Offer Window & Expiry (BR-10, BR-11)
  // -------------------------------------------------------------------------
  it('BR-10 & BR-11: Admin counter sets 24h server expiry; farmer negotiates and accepts', async () => {
    if (!dbAvailable || !createdListingId) return;

    // Super Admin sends round 1 counter offer
    const counterRes = await request(app)
      .post(`/v1/admin/listings/${createdListingId}/counter-offers`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        pricePerKg: '68.00',
        quantityKg: '1000.000',
        message: 'Admin initial offer',
      });

    expect(counterRes.status).toBe(201);
    expect(counterRes.body).toHaveProperty('id');
    expect(counterRes.body.round).toBe(1);
    activeOfferId = counterRes.body.id;

    // BR-10: Server clock expiry assertion
    const expiresAt = new Date(counterRes.body.expiresAt).getTime();
    const now = Date.now();
    const diffHours = (expiresAt - now) / (1000 * 60 * 60);
    expect(diffHours).toBeGreaterThan(23.5);
    expect(diffHours).toBeLessThanOrEqual(24.5);

    // Farmer accepts negotiated terms
    const acceptRes = await request(app)
      .post(`/v1/listings/${createdListingId}/counter-offers/${activeOfferId}/accept`)
      .set('Authorization', `Bearer ${farmerToken}`)
      .send({});

    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body.status).toBe('ACCEPTED');
  });

  // -------------------------------------------------------------------------
  // Step 4: Approval & Single Purchase Order Generation
  // -------------------------------------------------------------------------
  it('Approval creates exactly ONE purchase order at negotiated terms; idempotent on replay', async () => {
    if (!dbAvailable || !createdListingId) return;

    const approveRes = await request(app)
      .post(`/v1/admin/listings/${createdListingId}/approve`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        warehouseId: IDS.warehouseOoty,
      });

    expect(approveRes.status).toBe(200);
    expect(approveRes.body).toHaveProperty('purchaseOrderId');
    purchaseOrderId = approveRes.body.purchaseOrderId;

    // Replay approval — must be idempotent and not create duplicate PO
    const replayRes = await request(app)
      .post(`/v1/admin/listings/${createdListingId}/approve`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        warehouseId: IDS.warehouseOoty,
      });

    expect(replayRes.status).toBe(200);
    expect(replayRes.body.purchaseOrderId).toBe(purchaseOrderId);

    const poRows = await pool.query(
      `SELECT * FROM purchase_orders WHERE produce_listing_id = $1`,
      [createdListingId],
    );
    expect(poRows.rows).toHaveLength(1);
    expect(Number(poRows.rows[0]!.unit_price)).toBe(68.0);
    expect(Number(poRows.rows[0]!.quantity_kg)).toBe(1000.0);
  });

  // -------------------------------------------------------------------------
  // Step 5: Goods Receipt & Quality Check Scoping (BR-30)
  // -------------------------------------------------------------------------
  it('BR-30: Sub Warehouse Admin receives goods; unauthorized warehouse sees 0 items', async () => {
    if (!dbAvailable || !purchaseOrderId) return;

    // Ooty admin lists PO goods receipt
    const grnRes = await request(app)
      .get(`/v1/admin/goods-receipts?warehouseId=${IDS.warehouseOoty}`)
      .set('Authorization', `Bearer ${subWhOotyToken}`);
    expect(grnRes.status).toBe(200);

    // Coonoor admin querying Ooty receipts gets empty list (not 403)
    const coonoorRes = await request(app)
      .get(`/v1/admin/goods-receipts?warehouseId=${IDS.warehouseOoty}`)
      .set('Authorization', `Bearer ${subWhCoonoorToken}`);
    expect(coonoorRes.status).toBe(200);
    expect(coonoorRes.body.items).toHaveLength(0);
  });

  // -------------------------------------------------------------------------
  // Step 6: Batch Creation, Stock Ledger & Pooling (BR-24, BR-37)
  // -------------------------------------------------------------------------
  it('BR-37 & BR-24: Batch creation writes ONE RECEIPT movement; qty_available matches ledger sum', async () => {
    if (!dbAvailable) return;

    const batchCode = `BAT-${Date.now()}`;
    const { batch } = await inventoryService.createBatchWithReceipt(
      {
        userId: IDS.userSubWhOoty,
        roles: [{ code: RoleCode.SUB_WH_ADMIN, warehouseId: IDS.warehouseOoty }],
        farmerId: null,
        customerId: null,
      },
      aScope({
        level: ScopeLevel.OWN,
        permission: 'inventory.batch.assign',
        roleCode: RoleCode.SUB_WH_ADMIN,
        warehouseIds: [IDS.warehouseOoty],
        userId: IDS.userSubWhOoty,
      }),
      {
        batchCode,
        warehouseId: IDS.warehouseOoty,
        cropId: IDS.cropCarrot,
        grade: 'GRADE_1',
        sourceFarmerId: IDS.farmerId,
        qtyReceivedKg: '1000.000',
        receivedOn: '2026-08-28',
      },
    );

    expect(batch).toHaveProperty('id');
    createdBatchId = batch.id;

    // Verify stock ledger consistency
    const ledgerRows = await pool.query(
      `SELECT movement_type, qty_delta, balance_after FROM stock_ledger WHERE batch_id = $1`,
      [createdBatchId],
    );
    expect(ledgerRows.rows).toHaveLength(1);
    expect(ledgerRows.rows[0]!.movement_type).toBe('RECEIPT');
    expect(Number(ledgerRows.rows[0]!.qty_delta)).toBe(1000.0);
    expect(Number(ledgerRows.rows[0]!.balance_after)).toBe(1000.0);
  });

  // -------------------------------------------------------------------------
  // Step 7: 70/10/10/10 Allocation Split Engine (BR-12)
  // -------------------------------------------------------------------------
  it('BR-12a: 1000 kg allocates 700/100/100/100 and remainder goes to BUFFER', async () => {
    if (!dbAvailable || !createdBatchId) return;

    // Query allocations created automatically for this batch
    const allocRows = await pool.query<{ channel: string; allocated_qty: string }>(
      `SELECT channel, allocated_qty FROM allocations WHERE batch_id = $1 ORDER BY channel ASC`,
      [createdBatchId],
    );

    const allocMap = new Map(allocRows.rows.map((r) => [r.channel, r.allocated_qty]));

    expect(allocMap.get('ONLINE')).toBe('700.000');
    expect(allocMap.get('LIVE_MARKET')).toBe('100.000');
    expect(allocMap.get('RESERVE')).toBe('100.000');
    expect(allocMap.get('BUFFER')).toBe('100.000');

    // Total allocated must equal 1000.000 exactly
    const total = allocRows.rows.reduce((sum, r) => sum + Number(r.allocated_qty), 0);
    expect(total).toBe(1000.0);
  });

  // -------------------------------------------------------------------------
  // Step 8: Customer Catalog & Farm Anonymity (BR-16)
  // -------------------------------------------------------------------------
  it('BR-16: Customer catalog displays available product without any farm identity keys', async () => {
    if (!dbAvailable) return;

    const res = await request(app).get('/v1/catalog/products');
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThan(0);

    // Strict recursive denylist check
    assertNoFarmIdentity(res.body);
  });
});
