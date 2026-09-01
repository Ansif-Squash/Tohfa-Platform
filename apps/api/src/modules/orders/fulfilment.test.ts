import { beforeAll, describe, expect, it } from 'vitest';
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
import { createFulfilmentService } from './fulfilment.service.js';

describe('Fulfilment Unit Tests (State Machine & Logic)', () => {
  it('INVALID_STATE_TRANSITION: rejects illegal status transitions with 409', async () => {
    const actor = {
      userId: newId(),
      roles: [{ code: 'MAIN_WH_ADMIN' as const }],
      farmerId: null,
      customerId: null,
    };

    // Try packing an order in DELIVERED status
    const mockRepo = {
      findOrderForFulfilment: async () => ({
        id: newId(),
        orderNumber: 'TOH-2026-0001',
        status: 'DELIVERED' as const,
        channel: 'ONLINE' as const,
        fulfillmentType: 'PICKUP' as const,
        warehouseId: newId(),
        itemCount: 1,
        totalAmount: '100.00' as any,
        paymentStatus: 'PAID',
        deliveryDate: null,
        placedAt: new Date().toISOString(),
        subtotal: '100.00' as any,
        deliveryFee: '0.00' as any,
        discount: '0.00' as any,
        gstAmount: '0.00' as any,
        deliverySlot: null,
        deliveryAddressId: null,
        otpRequired: false,
        cancellationReason: null,
        deliveredAt: new Date().toISOString(),
        items: [],
      }),
    };

    const s = createFulfilmentService({ repo: mockRepo as any });
    await expect(
      s.packOrder(actor, aScope(), newId(), {}),
    ).rejects.toMatchObject({
      code: 'INVALID_STATE_TRANSITION',
      status: 409,
    });
  });
});

describeIfDatabase('Fulfilment Integration Tests (BR-20, BR-21, BR-30, BR-35)', () => {
  let ready = false;
  const app = createApp();

  let superAdminToken: string;
  let superAdminUserId: string;

  let mainWhAdminToken: string;
  let mainWhAdminUserId: string;

  let subWhAdminToken1: string;
  let subWhAdminUserId1: string;

  let subWhAdminToken2: string;
  let subWhAdminUserId2: string;

  let customerToken: string;
  let customerUserId: string;
  let customerId: string;

  let warehouseId1: string;
  let warehouseId2: string;
  let cropId: string;

  beforeAll(async () => {
    ready = await databaseReady('fulfilment');
    if (!ready) return;

    // 1. Resolve two warehouses
    const whRes = await pool.query<{ id: string }>(
      `SELECT id FROM warehouses ORDER BY code ASC LIMIT 2`,
    );
    warehouseId1 = whRes.rows[0]!.id;
    warehouseId2 = whRes.rows[1]!.id;

    // 2. Resolve crop
    const cropRes = await pool.query<{ id: string }>(
      `SELECT id FROM crop_master LIMIT 1`,
    );
    cropId = cropRes.rows[0]!.id;

    // 3. Super Admin
    superAdminUserId = newId();
    await pool.query(
      `INSERT INTO users (id, phone, role) VALUES ($1, $2, 'SUPER_ADMIN') ON CONFLICT DO NOTHING`,
      [superAdminUserId, '+919800000001'],
    );
    superAdminToken = signAccessToken({
      sub: superAdminUserId,
      roles: [{ code: 'SUPER_ADMIN' }],
      customerId: null,
      farmerId: null,
    });

    // 4. Main WH Admin
    mainWhAdminUserId = newId();
    await pool.query(
      `INSERT INTO users (id, phone, role) VALUES ($1, $2, 'MAIN_WH_ADMIN') ON CONFLICT DO NOTHING`,
      [mainWhAdminUserId, '+919800000002'],
    );
    mainWhAdminToken = signAccessToken({
      sub: mainWhAdminUserId,
      roles: [{ code: 'MAIN_WH_ADMIN' }],
      customerId: null,
      farmerId: null,
    });

    // 5. Sub WH Admin for Warehouse 1
    subWhAdminUserId1 = newId();
    await pool.query(
      `INSERT INTO users (id, phone, role, warehouse_id) VALUES ($1, $2, 'SUB_WH_ADMIN', $3) ON CONFLICT DO NOTHING`,
      [subWhAdminUserId1, '+919800000003', warehouseId1],
    );
    subWhAdminToken1 = signAccessToken({
      sub: subWhAdminUserId1,
      roles: [{ code: 'SUB_WH_ADMIN', warehouseId: warehouseId1 }],
      customerId: null,
      farmerId: null,
    });

    // 6. Sub WH Admin for Warehouse 2
    subWhAdminUserId2 = newId();
    await pool.query(
      `INSERT INTO users (id, phone, role, warehouse_id) VALUES ($1, $2, 'SUB_WH_ADMIN', $3) ON CONFLICT DO NOTHING`,
      [subWhAdminUserId2, '+919800000004', warehouseId2],
    );
    subWhAdminToken2 = signAccessToken({
      sub: subWhAdminUserId2,
      roles: [{ code: 'SUB_WH_ADMIN', warehouseId: warehouseId2 }],
      customerId: null,
      farmerId: null,
    });

    // 7. Customer
    customerUserId = newId();
    customerId = newId();
    await pool.query(
      `INSERT INTO users (id, phone, role) VALUES ($1, $2, 'CUSTOMER') ON CONFLICT DO NOTHING`,
      [customerUserId, '+919800000005'],
    );
    await pool.query(
      `INSERT INTO customers (id, user_id, name, email, phone)
       VALUES ($1, $2, 'Fulfilment Test Customer', 'fulfil@test.in', '+919800000005')
       ON CONFLICT DO NOTHING`,
      [customerId, customerUserId],
    );
    customerToken = signAccessToken({
      sub: customerUserId,
      roles: [{ code: 'CUSTOMER' }],
      customerId,
      farmerId: null,
    });
  });

  // Helper to create an order directly in DB
  async function seedOrder(opts: {
    warehouseId: string;
    status: string;
    fulfillmentType: 'PICKUP' | 'DELIVERY';
    otpPlaintext?: string;
    otpAttempts?: number;
  }) {
    const { createHash } = await import('node:crypto');
    const orderId = newId();
    const orderNumber = `TOH-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    const otpHash = opts.otpPlaintext
      ? createHash('sha256').update(opts.otpPlaintext).digest('hex')
      : null;

    let addressId: string | null = null;
    if (opts.fulfillmentType === 'DELIVERY') {
      const addrRes = await pool.query<{ id: string }>(
        `INSERT INTO customer_addresses (customer_id, line1, city, state, pincode)
         VALUES ($1, '12 Test Road', 'Coonoor', 'Tamil Nadu', '643101')
         RETURNING id`,
        [customerId],
      );
      addressId = addrRes.rows[0]!.id;
    }

    await pool.query(
      `INSERT INTO orders (
         id, order_number, customer_id, warehouse_id, channel,
         fulfilment_type, delivery_address_id, subtotal, delivery_fee,
         discount, gst_amount, total_amount, payment_method, payment_status,
         status, delivery_otp_hash, otp_attempts, placed_at
       )
       VALUES (
         $1, $2, $3, $4, 'ONLINE',
         $5, $6, 200.00, 0.00,
         0.00, 0.00, 200.00, 'WALLET', 'PAID',
         $7, $8, $9, now()
       )`,
      [
        orderId,
        orderNumber,
        customerId,
        opts.warehouseId,
        opts.fulfillmentType,
        addressId,
        opts.status,
        otpHash,
        opts.otpAttempts ?? 0,
      ],
    );

    // Insert order items
    await pool.query(
      `INSERT INTO order_items (
         order_id, crop_id, grade, qty_kg, unit_price, line_total, status
       )
       VALUES (
         $1, $2, 'GRADE_1', 2.000, 100.00, 200.00, 'PENDING'
       )`,
      [orderId, cropId],
    );

    // Initial status history
    await pool.query(
      `INSERT INTO order_status_history (
         order_id, from_status, to_status, note, created_at
       )
       VALUES ($1, NULL, $2, 'Order placed', now())`,
      [orderId, opts.status],
    );

    return { orderId, orderNumber };
  }

  it('BR-30a: Sub Warehouse Admin is scoped to own warehouse, cross-warehouse query is rejected (403/404)', async () => {
    if (!ready) return;

    // Create Order A in WH 1, Order B in WH 2
    const { orderId: orderWh1 } = await seedOrder({
      warehouseId: warehouseId1,
      status: 'CONFIRMED',
      fulfillmentType: 'PICKUP',
      otpPlaintext: '1234',
    });
    const { orderId: orderWh2 } = await seedOrder({
      warehouseId: warehouseId2,
      status: 'CONFIRMED',
      fulfillmentType: 'PICKUP',
      otpPlaintext: '5678',
    });

    // 1. Sub WH Admin 1 lists orders -> sees WH 1 order, never WH 2 order
    const listRes = await request(app)
      .get('/v1/admin/orders')
      .set('Authorization', `Bearer ${subWhAdminToken1}`);

    expect(listRes.status).toBe(200);
    const ids = listRes.body.items.map((it: any) => it.id);
    expect(ids).toContain(orderWh1);
    expect(ids).not.toContain(orderWh2);

    // 2. Sub WH Admin 1 querying WH 2 explicitly returns 403 WAREHOUSE_SCOPE_VIOLATION
    const crossQueryRes = await request(app)
      .get(`/v1/admin/orders?warehouseId=${warehouseId2}`)
      .set('Authorization', `Bearer ${subWhAdminToken1}`);

    expect(crossQueryRes.status).toBe(403);
    expect(crossQueryRes.body.code).toBe('WAREHOUSE_SCOPE_VIOLATION');

    // 3. Sub WH Admin 1 attempting to pack WH 2 order returns 404 (warehouse isolation)
    const packCrossRes = await request(app)
      .post(`/v1/admin/orders/${orderWh2}/pack`)
      .set('Authorization', `Bearer ${subWhAdminToken1}`)
      .send({});

    expect(packCrossRes.status).toBe(404);

    // 4. Sub WH Admin 2 sees only WH 2 order
    const listRes2 = await request(app)
      .get('/v1/admin/orders')
      .set('Authorization', `Bearer ${subWhAdminToken2}`);

    expect(listRes2.status).toBe(200);
    const ids2 = listRes2.body.items.map((it: any) => it.id);
    expect(ids2).toContain(orderWh2);
    expect(ids2).not.toContain(orderWh1);

    // 5. Main WH Admin sees orders from both warehouses
    const mainListRes = await request(app)
      .get('/v1/admin/orders')
      .set('Authorization', `Bearer ${mainWhAdminToken}`);

    expect(mainListRes.status).toBe(200);
    const mainIds = mainListRes.body.items.map((it: any) => it.id);
    expect(mainIds).toContain(orderWh1);
    expect(mainIds).toContain(orderWh2);

    // 6. Sub WH Admin 1 cannot call assign-warehouse (403 from requirePermission)
    const assignRes = await request(app)
      .post(`/v1/admin/orders/${orderWh1}/assign-warehouse`)
      .set('Authorization', `Bearer ${subWhAdminToken1}`)
      .send({ warehouseId: warehouseId2 });

    expect(assignRes.status).toBe(403);

    // 7. Super Admin CAN call assign-warehouse
    const superAssignRes = await request(app)
      .post(`/v1/admin/orders/${orderWh1}/assign-warehouse`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ warehouseId: warehouseId2, reason: 'Rebalance capacity' });

    expect(superAssignRes.status).toBe(200);
    expect(superAssignRes.body.warehouseId).toBe(warehouseId2);
  });

  it('Order packing & dispatch lifecycle moves CONFIRMED -> PACKED -> READY_FOR_PICKUP with audit & history (BR-35)', async () => {
    if (!ready) return;

    const { orderId } = await seedOrder({
      warehouseId: warehouseId1,
      status: 'CONFIRMED',
      fulfillmentType: 'PICKUP',
      otpPlaintext: '4321',
    });

    // 1. Pack order
    const packRes = await request(app)
      .post(`/v1/admin/orders/${orderId}/pack`)
      .set('Authorization', `Bearer ${subWhAdminToken1}`)
      .send({});

    expect(packRes.status).toBe(200);
    expect(packRes.body.status).toBe('PACKED');

    // 2. Dispatch / Mark ready for pickup
    const dispatchRes = await request(app)
      .post(`/v1/admin/orders/${orderId}/dispatch`)
      .set('Authorization', `Bearer ${subWhAdminToken1}`)
      .send({});

    expect(dispatchRes.status).toBe(200);
    expect(dispatchRes.body.status).toBe('READY_FOR_PICKUP');

    // 3. Check order_status_history has sequential entries
    const historyRes = await pool.query<{ from_status: string; to_status: string }>(
      `SELECT from_status, to_status FROM order_status_history
        WHERE order_id = $1
        ORDER BY created_at ASC`,
      [orderId],
    );

    expect(historyRes.rows.length).toBeGreaterThanOrEqual(3);
    const statuses = historyRes.rows.map((r) => r.to_status);
    expect(statuses).toContain('CONFIRMED');
    expect(statuses).toContain('PACKED');
    expect(statuses).toContain('READY_FOR_PICKUP');
  });

  it('BR-20a: Wrong OTP returns 422 OTP_INVALID and leaves order status unchanged', async () => {
    if (!ready) return;

    const { orderId } = await seedOrder({
      warehouseId: warehouseId1,
      status: 'READY_FOR_PICKUP',
      fulfillmentType: 'PICKUP',
      otpPlaintext: '7788',
    });

    // Attempt wrong OTP '9999'
    const wrongRes = await request(app)
      .post(`/v1/admin/orders/${orderId}/verify-otp`)
      .set('Authorization', `Bearer ${subWhAdminToken1}`)
      .send({ otp: '9999' });

    expect(wrongRes.status).toBe(422);
    expect(wrongRes.body.code).toBe('OTP_INVALID');
    expect(wrongRes.body.meta.remainingAttempts).toBe(2);

    // Verify order status is still READY_FOR_PICKUP
    const orderRes = await pool.query<{ status: string; otp_attempts: number }>(
      `SELECT status, otp_attempts FROM orders WHERE id = $1`,
      [orderId],
    );
    expect(orderRes.rows[0]!.status).toBe('READY_FOR_PICKUP');
    expect(orderRes.rows[0]!.otp_attempts).toBe(1);
  });

  it('BR-20b: Correct OTP moves order to PICKED_UP; plaintext OTP is never returned in any response', async () => {
    if (!ready) return;

    const { orderId } = await seedOrder({
      warehouseId: warehouseId1,
      status: 'READY_FOR_PICKUP',
      fulfillmentType: 'PICKUP',
      otpPlaintext: '8899',
    });

    // Verify with correct OTP '8899'
    const verifyRes = await request(app)
      .post(`/v1/admin/orders/${orderId}/verify-otp`)
      .set('Authorization', `Bearer ${subWhAdminToken1}`)
      .send({ otp: '8899' });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.status).toBe('PICKED_UP');

    // Assert that '8899' does NOT appear in the JSON response payload
    const responseString = JSON.stringify(verifyRes.body);
    expect(responseString).not.toContain('8899');

    // Verify in database: otp_verified_at is set, status is PICKED_UP
    const dbOrder = await pool.query<{ status: string; otp_verified_at: Date | null }>(
      `SELECT status, otp_verified_at FROM orders WHERE id = $1`,
      [orderId],
    );
    expect(dbOrder.rows[0]!.status).toBe('PICKED_UP');
    expect(dbOrder.rows[0]!.otp_verified_at).not.toBeNull();
  });

  it('OTP lockout: Exceeding max attempts locks OTP with 429 OTP_LOCKED', async () => {
    if (!ready) return;

    const { orderId } = await seedOrder({
      warehouseId: warehouseId1,
      status: 'READY_FOR_PICKUP',
      fulfillmentType: 'PICKUP',
      otpPlaintext: '1122',
      otpAttempts: 3, // Already hit 3 attempts
    });

    const lockRes = await request(app)
      .post(`/v1/admin/orders/${orderId}/verify-otp`)
      .set('Authorization', `Bearer ${subWhAdminToken1}`)
      .send({ otp: '1122' });

    expect(lockRes.status).toBe(429);
    expect(lockRes.body.code).toBe('OTP_LOCKED');
  });

  it('GET /v1/orders/:id/tracking returns timeline history and masks OTP', async () => {
    if (!ready) return;

    const { orderId } = await seedOrder({
      warehouseId: warehouseId1,
      status: 'PACKED',
      fulfillmentType: 'PICKUP',
      otpPlaintext: '3344',
    });

    const trackingRes = await request(app)
      .get(`/v1/orders/${orderId}/tracking`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(trackingRes.status).toBe(200);
    expect(trackingRes.body.orderId).toBe(orderId);
    expect(trackingRes.body.status).toBe('PACKED');
    expect(trackingRes.body.otpRequired).toBe(true);
    expect(trackingRes.body.events.length).toBeGreaterThanOrEqual(1);

    // Plaintext OTP '3344' must NOT appear anywhere in the tracking payload (BR-20b)
    expect(JSON.stringify(trackingRes.body)).not.toContain('3344');
  });

  it('BR-35: Database rejects direct UPDATE or DELETE on order_status_history (append-only trigger)', async () => {
    if (!ready) return;

    const { orderId } = await seedOrder({
      warehouseId: warehouseId1,
      status: 'CONFIRMED',
      fulfillmentType: 'PICKUP',
    });

    // Try updating order_status_history directly
    await expect(
      pool.query(`UPDATE order_status_history SET note = 'Tampered' WHERE order_id = $1`, [orderId]),
    ).rejects.toThrow();

    // Try deleting from order_status_history directly
    await expect(
      pool.query(`DELETE FROM order_status_history WHERE order_id = $1`, [orderId]),
    ).rejects.toThrow();
  });

  it('GET /v1/orders/:id/events sets up SSE stream and emits initial status', async () => {
    if (!ready) return;

    const { orderId } = await seedOrder({
      warehouseId: warehouseId1,
      status: 'CONFIRMED',
      fulfillmentType: 'PICKUP',
      otpPlaintext: '5566',
    });

    const res = await request(app)
      .get(`/v1/orders/${orderId}/events`)
      .set('Authorization', `Bearer ${customerToken}`)
      .set('Accept', 'text/event-stream')
      .buffer(true)
      .parse((res, cb) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk.toString();
          if (data.includes('event: order.status')) {
            (res as any).destroy?.();
            cb(null, data);
          }
        });
      });

    expect(res.headers['content-type']).toContain('text/event-stream');
    expect(res.body).toContain('event: order.status');
    expect(res.body).toContain('CONFIRMED');
  });
});
