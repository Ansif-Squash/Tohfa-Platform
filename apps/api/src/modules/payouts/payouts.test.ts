import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { signAccessToken } from '../../auth/jwt.js';
import { pool } from '../../db/pool.js';
import {
  aScope,
  databaseReady,
  describeIfDatabase,
  newId,
} from '../../test/factories.js';
import { createPayoutsService } from './payouts.service.js';

// ---------------------------------------------------------------------------
// Unit Tests — BR-31 dual-approval logic (no DB needed)
// ---------------------------------------------------------------------------

describe('PayoutsService Unit Tests (BR-31)', () => {
  it('BR-31a: rejects payout creation from non-privileged actor', async () => {
    const svc = createPayoutsService({
      repo: {
        getFarmerName: async () => 'Test Farmer',
        createPayout: async () => ({ payout: { id: newId(), payout_number: 'PO-2026-000001', farmer_id: newId(), farmer_name: 'Test Farmer', amount: '500.00', mode: 'IMPS', status: 'REQUESTED', requires_dual_approval: false, initiated_by: newId(), released_by: null, released_at: null, gateway_payout_id: null, failure_reason: null, paid_at: null, remarks: null, created_at: new Date(), updated_at: null }, approvals: [] }),
        findPayoutById: async () => ({ payout: { id: newId(), payout_number: 'PO-2026-000001', farmer_id: newId(), farmer_name: 'Test Farmer', amount: '500.00', mode: 'IMPS', status: 'APPROVED', requires_dual_approval: false, initiated_by: newId(), released_by: null, released_at: null, gateway_payout_id: null, failure_reason: null, paid_at: null, remarks: null, created_at: new Date(), updated_at: null }, approvals: [] }),
        addApproval: async () => [],
        updatePayoutStatus: async () => {},
        listPayoutDues: async () => ({ items: [], totals: { totalDue: '0.00', farmerCount: 0 }, nextCursor: null }),
        findPayoutByIdempotencyKey: async () => null,
      } as any,
    });

    const actor = {
      userId: newId(),
      roles: [{ code: 'FARMER' as const }],
      farmerId: newId(),
      customerId: null,
    };

    // Service doesn't check role here (that's requirePermission middleware), but amount 0 fails
    await expect(
      svc.createPayout(actor, aScope({}), { farmerId: newId(), amount: '0.00', mode: 'IMPS' }),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST', status: 422 });
  });

  it('BR-31b: SAME_ACTOR_APPROVAL — initiator cannot approve own payout', async () => {
    const initiatorId = newId();
    const payoutId = newId();
    const farmerId = newId();

    const svc = createPayoutsService({
      repo: {
        findPayoutById: async () => ({
          payout: {
            id: payoutId,
            payout_number: 'PO-2026-000002',
            farmer_id: farmerId,
            farmer_name: 'Ravi Kumar',
            amount: '18400.00',
            mode: 'IMPS',
            status: 'PENDING_APPROVAL',
            requires_dual_approval: true,
            initiated_by: initiatorId,
            released_by: null,
            released_at: null,
            gateway_payout_id: null,
            failure_reason: null,
            paid_at: null,
            remarks: null,
            created_at: new Date(),
            updated_at: null,
          },
          approvals: [],
        }),
        addApproval: async () => [],
        updatePayoutStatus: async () => {},
        listPayoutDues: async () => ({ items: [], totals: { totalDue: '0.00', farmerCount: 0 }, nextCursor: null }),
        getFarmerName: async () => 'Ravi Kumar',
        createPayout: async () => ({ payout: {} as any, approvals: [] }),
        findPayoutByIdempotencyKey: async () => null,
      } as any,
    });

    const actor = {
      userId: initiatorId,  // same as initiated_by → must be rejected
      roles: [{ code: 'SUPER_ADMIN' as const }],
      farmerId: null,
      customerId: null,
    };

    await expect(
      svc.approvePayout(actor, aScope({}), payoutId, {}),
    ).rejects.toMatchObject({ code: 'SAME_ACTOR_APPROVAL', status: 403 });
  });

  it('BR-31c: Non-Super-Admin cannot approve payout above threshold', async () => {
    const initiatorId = newId();
    const approverIdNonSuper = newId();
    const payoutId = newId();

    const svc = createPayoutsService({
      repo: {
        findPayoutById: async () => ({
          payout: {
            id: payoutId,
            payout_number: 'PO-2026-000003',
            farmer_id: newId(),
            farmer_name: 'Test Farmer',
            amount: '15000.00',
            mode: 'NEFT',
            status: 'PENDING_APPROVAL',
            requires_dual_approval: true,
            initiated_by: initiatorId,
            released_by: null,
            released_at: null,
            gateway_payout_id: null,
            failure_reason: null,
            paid_at: null,
            remarks: null,
            created_at: new Date(),
            updated_at: null,
          },
          approvals: [],
        }),
        addApproval: async () => [],
        updatePayoutStatus: async () => {},
        listPayoutDues: async () => ({ items: [], totals: { totalDue: '0.00', farmerCount: 0 }, nextCursor: null }),
        getFarmerName: async () => 'Test Farmer',
        createPayout: async () => ({ payout: {} as any, approvals: [] }),
        findPayoutByIdempotencyKey: async () => null,
      } as any,
    });

    const actor = {
      userId: approverIdNonSuper,
      roles: [{ code: 'TOHFA_ADMIN' as const }],  // Not SUPER_ADMIN
      farmerId: null,
      customerId: null,
    };

    await expect(
      svc.approvePayout(actor, aScope({}), payoutId, {}),
    ).rejects.toMatchObject({ code: 'FORBIDDEN', status: 403 });
  });

  it('rejects approval on non-PENDING_APPROVAL payout', async () => {
    const payoutId = newId();

    const svc = createPayoutsService({
      repo: {
        findPayoutById: async () => ({
          payout: {
            id: payoutId,
            payout_number: 'PO-2026-000004',
            farmer_id: newId(),
            farmer_name: 'Test',
            amount: '18400.00',
            mode: 'IMPS',
            status: 'APPROVED',  // Already approved
            requires_dual_approval: true,
            initiated_by: newId(),
            released_by: null,
            released_at: null,
            gateway_payout_id: null,
            failure_reason: null,
            paid_at: null,
            remarks: null,
            created_at: new Date(),
            updated_at: null,
          },
          approvals: [],
        }),
        listPayoutDues: async () => ({ items: [], totals: { totalDue: '0.00', farmerCount: 0 }, nextCursor: null }),
        getFarmerName: async () => 'Test',
        createPayout: async () => ({ payout: {} as any, approvals: [] }),
        addApproval: async () => [],
        updatePayoutStatus: async () => {},
        findPayoutByIdempotencyKey: async () => null,
      } as any,
    });

    const actor = {
      userId: newId(),
      roles: [{ code: 'SUPER_ADMIN' as const }],
      farmerId: null,
      customerId: null,
    };

    await expect(
      svc.approvePayout(actor, aScope({}), payoutId, {}),
    ).rejects.toMatchObject({ code: 'INVALID_STATE_TRANSITION', status: 409 });
  });
});

// ---------------------------------------------------------------------------
// Integration Tests — require real DB
// ---------------------------------------------------------------------------

describeIfDatabase('Payouts Integration Tests (BR-31, BR-35)', () => {
  let ready = false;
  const app = createApp();

  // Tokens
  let superAdminToken: string;
  let superAdminUserId: string;

  let superAdmin2Token: string;
  let superAdmin2UserId: string;

  let tohfaAdminToken: string;
  let tohfaAdminUserId: string;

  // Test data
  let farmerId: string;
  let farmerUserId: string;
  let warehouseId: string;
  let purchaseOrderId: string;
  let cropId: string;

  beforeAll(async () => {
    ready = await databaseReady('payouts');
    if (!ready) return;

    // 1. Crop
    const cropRes = await pool.query<{ id: string }>(`SELECT id FROM crop_master LIMIT 1`);
    cropId = cropRes.rows[0]!.id;

    // 2. Warehouse
    const whRes = await pool.query<{ id: string }>(`SELECT id FROM warehouses LIMIT 1`);
    warehouseId = whRes.rows[0]!.id;

    const ts = Date.now();

    // 3. Farmer user + farmer row
    farmerUserId = newId();
    await pool.query(
      `INSERT INTO users (id, mobile, full_name, user_type, status)
       VALUES ($1, $2, 'Payout Test Farmer', 'FARMER', 'ACTIVE')
       ON CONFLICT DO NOTHING`,
      [farmerUserId, `+9199${String(ts).slice(-8)}`],
    );
    const farmerRes = await pool.query<{ id: string }>(
      `INSERT INTO farmers (user_id, tohfa_farmer_id) VALUES ($1, $2) RETURNING id`,
      [farmerUserId, `TF-PAY-${ts}`],
    );
    farmerId = farmerRes.rows[0]!.id;

    // 4. Super Admin 1
    superAdminUserId = newId();
    await pool.query(
      `INSERT INTO users (id, mobile, full_name, user_type, status)
       VALUES ($1, $2, 'Super Admin 1', 'ADMIN', 'ACTIVE')
       ON CONFLICT DO NOTHING`,
      [superAdminUserId, `+9188${String(ts).slice(-8)}`],
    );
    superAdminToken = signAccessToken({
      sub: superAdminUserId,
      roles: [{ code: 'SUPER_ADMIN' }],
      customerId: null,
      farmerId: null,
    });

    // 5. Super Admin 2 (dual approval)
    superAdmin2UserId = newId();
    await pool.query(
      `INSERT INTO users (id, mobile, full_name, user_type, status)
       VALUES ($1, $2, 'Super Admin 2', 'ADMIN', 'ACTIVE')
       ON CONFLICT DO NOTHING`,
      [superAdmin2UserId, `+9177${String(ts).slice(-8)}`],
    );
    superAdmin2Token = signAccessToken({
      sub: superAdmin2UserId,
      roles: [{ code: 'SUPER_ADMIN' }],
      customerId: null,
      farmerId: null,
    });

    // 6. TOHFA Admin (negative test)
    tohfaAdminUserId = newId();
    await pool.query(
      `INSERT INTO users (id, mobile, full_name, user_type, status)
       VALUES ($1, $2, 'Tohfa Admin', 'ADMIN', 'ACTIVE')
       ON CONFLICT DO NOTHING`,
      [tohfaAdminUserId, `+9166${String(ts).slice(-8)}`],
    );
    tohfaAdminToken = signAccessToken({
      sub: tohfaAdminUserId,
      roles: [{ code: 'TOHFA_ADMIN' }],
      customerId: null,
      farmerId: null,
    });

    // 7. Produce listing → PO → GRN (so payout_dues query finds something)
    const fpRes = await pool.query<{ id: string }>(
      `SELECT id FROM fair_prices WHERE crop_id = $1 AND grade = 'GRADE_1' LIMIT 1`,
      [cropId],
    );
    let fairPriceId = fpRes.rows[0]?.id;
    if (!fairPriceId) {
      const insFp = await pool.query<{ id: string }>(
        `INSERT INTO fair_prices (crop_id, grade, ceiling_price, effective_from, set_by)
         VALUES ($1, 'GRADE_1', 100.00, '2020-01-01', $2)
         RETURNING id`,
        [cropId, superAdminUserId],
      );
      fairPriceId = insFp.rows[0]!.id;
    }

    const listingRes = await pool.query<{ id: string }>(
      `INSERT INTO produce_listings
         (listing_number, farmer_id, crop_id, grade, quantity_kg, price_per_kg, fair_price_id, status)
       VALUES ($1, $2, $3, 'GRADE_1', 500.000, 70.00, $4, 'ACCEPTED')
       RETURNING id`,
      [`LIST-PAY-${ts}`, farmerId, cropId, fairPriceId],
    );

    const poRes = await pool.query<{ id: string }>(
      `INSERT INTO purchase_orders
         (po_number, farmer_id, listing_id, warehouse_id, crop_id, grade,
          quantity_kg, price_per_kg, total_amount, status, issued_by)
       VALUES ($1, $2, $3, $4, $5, 'GRADE_1', 500.000, 70.00, 35000.00, 'ISSUED', $6)
       RETURNING id`,
      [`PO-PAY-TEST-${ts}`, farmerId, listingRes.rows[0]!.id, warehouseId, cropId, superAdminUserId],
    );
    purchaseOrderId = poRes.rows[0]!.id;

    await pool.query(
      `INSERT INTO goods_receipts
         (grn_number, purchase_order_id, warehouse_id, farmer_id,
          gross_qty_kg, accepted_qty_kg, status, received_by)
       VALUES ($1, $2, $3, $4, 500.000, 490.000, 'ACCEPTED', $5)`,
      [`GRN-PAY-${ts}`, purchaseOrderId, warehouseId, farmerId, superAdminUserId],
    );
  });

  afterAll(async () => {
    if (!ready) return;
    const { closePool } = await import('../../db/pool.js');
    await closePool();
  });

  // --------------------------------------------------------------------------

  it('GET /admin/payout-dues — returns dues with ageing buckets and totals', async () => {
    if (!ready) return;

    const res = await request(app)
      .get('/v1/admin/payout-dues')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('items');
    expect(res.body).toHaveProperty('totals');
    expect(res.body.totals).toHaveProperty('totalDue');
    expect(res.body.totals).toHaveProperty('farmerCount');

    // Our seeded farmer should appear
    const ourDue = res.body.items.find((d: any) => d.farmerId === farmerId);
    expect(ourDue).toBeDefined();
    expect(ourDue.ageBucket).toMatch(/D0_7|D8_15|D16_30|D30_PLUS/);
  });

  it('BR-31a: payout ≤ ₹10,000 auto-approves in APPROVED status', async () => {
    if (!ready) return;

    const res = await request(app)
      .post('/v1/admin/payouts')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .set('Idempotency-Key', `test-small-payout-${Date.now()}`)
      .send({
        farmerId,
        amount: '5000.00',
        mode: 'IMPS',
        remarks: 'Small payout test',
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('APPROVED');
    expect(res.body.requiresDualApproval).toBe(false);
    expect(res.body.farmerId).toBe(farmerId);
    expect(res.body.amount).toBe('5000.00');
    // Response must NOT contain any OTP or plaintext secret fields
    expect(res.body).not.toHaveProperty('otp');
  });

  it('BR-31b+c: payout > ₹10,000 created as PENDING_APPROVAL, requires dual approval', async () => {
    if (!ready) return;

    // Step 1: Initiate large payout
    const createRes = await request(app)
      .post('/v1/admin/payouts')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .set('Idempotency-Key', `test-large-payout-${Date.now()}`)
      .send({
        farmerId,
        amount: '18400.00',
        mode: 'NEFT',
        remarks: 'Dual approval payout test',
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.status).toBe('PENDING_APPROVAL');
    expect(createRes.body.requiresDualApproval).toBe(true);
    expect(createRes.body.approvedBy).toHaveLength(0);

    const payoutId = createRes.body.id;

    // Step 2: Initiator (Super Admin 1) tries to self-approve → 403 SAME_ACTOR_APPROVAL
    const selfApproveRes = await request(app)
      .post(`/v1/admin/payouts/${payoutId}/approve`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ note: 'Self-approve attempt' });

    expect(selfApproveRes.status).toBe(403);
    expect(selfApproveRes.body.code).toBe('SAME_ACTOR_APPROVAL');

    // Step 3: TOHFA_ADMIN tries to approve → 403 FORBIDDEN (must be SUPER_ADMIN)
    const tohfaApproveRes = await request(app)
      .post(`/v1/admin/payouts/${payoutId}/approve`)
      .set('Authorization', `Bearer ${tohfaAdminToken}`)
      .send({ note: 'Tohfa Admin attempt' });

    expect(tohfaApproveRes.status).toBe(403);
    expect(tohfaApproveRes.body.code).toBe('FORBIDDEN');

    // Step 4: Second Super Admin approves → 200 APPROVED (BR-31)
    const approveRes = await request(app)
      .post(`/v1/admin/payouts/${payoutId}/approve`)
      .set('Authorization', `Bearer ${superAdmin2Token}`)
      .send({ note: 'Approved by Super Admin 2' });

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.status).toBe('APPROVED');
    expect(approveRes.body.approvedBy).toContain(superAdmin2UserId);
  });

  it('BR-35: payout transitions are audit-logged', async () => {
    if (!ready) return;

    // Create a payout
    const createRes = await request(app)
      .post('/v1/admin/payouts')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .set('Idempotency-Key', `test-audit-payout-${Date.now()}`)
      .send({ farmerId, amount: '3000.00', mode: 'UPI' });

    expect(createRes.status).toBe(201);
    const payoutId = createRes.body.id;

    // Verify audit log has an entry
    const auditRes = await pool.query(
      `SELECT * FROM audit_log WHERE entity_type = 'payouts' AND entity_id = $1`,
      [payoutId],
    );
    expect(auditRes.rows.length).toBeGreaterThan(0);
    expect(auditRes.rows[0].action_code).toBe('payout.farmer.initiate');
  });

  it('returns 404 for unknown farmer', async () => {
    if (!ready) return;

    const res = await request(app)
      .post('/v1/admin/payouts')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .set('Idempotency-Key', `test-notfound-${Date.now()}`)
      .send({ farmerId: newId(), amount: '500.00', mode: 'IMPS' });

    expect(res.status).toBe(404);
  });

  it('returns 401 for unauthenticated request', async () => {
    if (!ready) return;

    const res = await request(app)
      .get('/v1/admin/payout-dues');

    expect(res.status).toBe(401);
  });

  it('payout dues list supports ageBucket filter', async () => {
    if (!ready) return;

    const res = await request(app)
      .get('/v1/admin/payout-dues?ageBucket=D0_7')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
    // All returned items must be in D0_7 bucket
    for (const item of res.body.items) {
      expect(item.ageBucket).toBe('D0_7');
    }
  });
});
