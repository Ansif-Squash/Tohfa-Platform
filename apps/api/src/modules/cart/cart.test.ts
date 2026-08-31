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
import { createCartService } from './cart.service.js';

describe('CartService Unit Tests', () => {
  it('rejects cart access for non-customer actor', async () => {
    const service = createCartService();
    const actor = {
      userId: newId(),
      roles: [{ code: 'SUPER_ADMIN' as const }],
      farmerId: null,
      customerId: null,
    };

    await expect(
      service.getCart(actor, aScope()),
    ).rejects.toMatchObject({
      code: 'FORBIDDEN',
      status: 403,
    });
  });

  it('rejects adding non-positive quantity with 422', async () => {
    const service = createCartService();
    const actor = {
      userId: newId(),
      roles: [{ code: 'CUSTOMER' as const }],
      farmerId: null,
      customerId: newId(),
    };

    await expect(
      service.addItem(actor, aScope(), {
        productId: newId(),
        grade: 'GRADE_1',
        qtyKg: '0.000',
      }),
    ).rejects.toMatchObject({
      code: 'VALIDATION_FAILED',
      status: 422,
    });
  });
});

describeIfDatabase('Cart Integration Tests (BR-22, BR-12)', () => {
  let ready = false;
  const app = createApp();

  let customerUserId1: string;
  let customerId1: string;
  let customerToken1: string;

  let customerUserId2: string;
  let customerId2: string;
  let customerToken2: string;

  let adminUserId: string;
  let adminToken: string;

  let warehouseId: string;
  let cropId: string;
  let batchId: string;
  let allocationOnlineId: string;
  let allocationReserveId: string;

  beforeAll(async () => {
    ready = await databaseReady('carts');
    if (!ready) return;

    customerUserId1 = newId();
    customerId1 = newId();
    customerUserId2 = newId();
    customerId2 = newId();
    adminUserId = newId();
    warehouseId = newId();
    const farmerUserId = newId();
    const farmerId = newId();

    const rand = Math.floor(100000 + Math.random() * 900000);
    const m1 = `+919844${rand}`;
    const m2 = `+919855${rand}`;
    const m3 = `+919866${rand}`;
    const m4 = `+919877${rand}`;

    // 1. Seed warehouse, users, customer, farmer
    await pool.query(`
      INSERT INTO warehouses (id, code, name, type, address, city, pincode)
      VALUES ('${warehouseId}', 'WH-CART-${rand}', 'Coonoor Cart WH', 'MAIN', '45 Nilgiri Way', 'Coonoor', '643101');

      INSERT INTO users (id, mobile, full_name, user_type, status)
      VALUES
        ('${customerUserId1}', '${m1}', 'Customer One', 'CUSTOMER', 'ACTIVE'),
        ('${customerUserId2}', '${m2}', 'Customer Two', 'CUSTOMER', 'ACTIVE'),
        ('${adminUserId}', '${m3}', 'Admin User', 'ADMIN', 'ACTIVE'),
        ('${farmerUserId}', '${m4}', 'Farmer User', 'FARMER', 'ACTIVE');

      INSERT INTO customers (id, user_id, customer_code)
      VALUES
        ('${customerId1}', '${customerUserId1}', 'CUST-1-${rand}'),
        ('${customerId2}', '${customerUserId2}', 'CUST-2-${rand}');

      INSERT INTO farmers (id, user_id, tohfa_farmer_id, application_status)
      VALUES ('${farmerId}', '${farmerUserId}', 'FARM-${rand}', 'APPROVED');
    `);

    // 2. Create isolated unique test crop
    const catRes = await pool.query<{ id: string }>(`SELECT id FROM categories LIMIT 1`);
    cropId = newId();
    await pool.query(
      `INSERT INTO crop_master (id, category_id, slug, name) VALUES ($1, $2, $3, $4)`,
      [cropId, catRes.rows[0]!.id, `crop-cart-${rand}`, `Cart Carrot ${rand}`],
    );

    // 3. Set retail price
    await pool.query(
      `INSERT INTO retail_prices (crop_id, grade, price, effective_from, set_by)
       VALUES ($1, 'GRADE_1', 60.00, CURRENT_DATE - interval '1 day', $2)
       ON CONFLICT (crop_id, grade, effective_from)
       DO UPDATE SET price = 60.00`,
      [cropId, adminUserId],
    );

    // 4. Create batch and allocations (Online: 50 kg, Reserve: 10 kg)
    batchId = newId();
    allocationOnlineId = newId();
    allocationReserveId = newId();

    await pool.query(
      `INSERT INTO inventory_batches (
         id, batch_code, warehouse_id, crop_id, grade, source_farmer_id, qty_received, qty_available, status
       )
       VALUES ($1, $2, $3, $4, 'GRADE_1', $5, 100.000, 100.000, 'ACTIVE')`,
      [batchId, `BATCH-CART-${rand}`, warehouseId, cropId, farmerId],
    );

    await pool.query(
      `INSERT INTO allocations (
         id, batch_id, warehouse_id, channel, allocated_qty, consumed_qty, reserved_qty
       )
       VALUES
         ($1, $2, $3, 'ONLINE', 50.000, 0, 0),
         ($4, $2, $3, 'RESERVE', 10.000, 0, 0)`,
      [allocationOnlineId, batchId, warehouseId, allocationReserveId],
    );

    customerToken1 = signAccessToken({
      sub: customerUserId1,
      roles: [{ code: 'CUSTOMER' }],
      farmerId: null,
      customerId: customerId1,
    });

    customerToken2 = signAccessToken({
      sub: customerUserId2,
      roles: [{ code: 'CUSTOMER' }],
      farmerId: null,
      customerId: customerId2,
    });

    adminToken = signAccessToken({
      sub: adminUserId,
      roles: [{ code: 'SUPER_ADMIN' }],
      farmerId: null,
      customerId: null,
    });
  });

  it('GET /v1/cart returns initial empty cart structure for authenticated customer', async () => {
    if (!ready) return;

    const res = await request(app)
      .get('/v1/cart')
      .set('Authorization', `Bearer ${customerToken1}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      status: 'ACTIVE',
      items: [],
      subtotal: '0.00',
    });
  });

  it('BR-22a: Adding 5 kg immediately reduces the ONLINE bucket available quantity by 5 kg', async () => {
    if (!ready) return;

    // Available before: 50.000
    const allocBefore = await pool.query<{ available_qty: string; reserved_qty: string }>(
      `SELECT available_qty::text, reserved_qty::text FROM allocations WHERE id = $1`,
      [allocationOnlineId],
    );
    expect(Number(allocBefore.rows[0]!.available_qty)).toBe(50);
    expect(Number(allocBefore.rows[0]!.reserved_qty)).toBe(0);

    const res = await request(app)
      .post('/v1/cart/items')
      .set('Authorization', `Bearer ${customerToken1}`)
      .send({
        productId: cropId,
        grade: 'GRADE_1',
        qtyKg: '5.000',
      });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      status: 'LOCKED',
      subtotal: '300.00', // 5 kg * 60.00
    });
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0]).toMatchObject({
      productId: cropId,
      grade: 'GRADE_1',
      qtyKg: '5.000',
      unitPrice: '60.00',
      lineTotal: '300.00',
    });
    expect(res.body.lockedAt).not.toBeNull();
    expect(res.body.lockExpiresAt).not.toBeNull();

    // Verify allocation reserved_qty is 5.000 and available_qty is 45.000
    const allocAfter = await pool.query<{ available_qty: string; reserved_qty: string }>(
      `SELECT available_qty::text, reserved_qty::text FROM allocations WHERE id = $1`,
      [allocationOnlineId],
    );
    expect(Number(allocAfter.rows[0]!.available_qty)).toBe(45);
    expect(Number(allocAfter.rows[0]!.reserved_qty)).toBe(5);
  });

  it('Repeat add of same crop+grade increments the existing line and increases reservation', async () => {
    if (!ready) return;

    const res = await request(app)
      .post('/v1/cart/items')
      .set('Authorization', `Bearer ${customerToken1}`)
      .send({
        productId: cropId,
        grade: 'GRADE_1',
        qtyKg: '3.000',
      });

    expect(res.status).toBe(201);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0]).toMatchObject({
      qtyKg: '8.000', // 5 + 3
      lineTotal: '480.00', // 8 * 60.00
    });
    expect(res.body.subtotal).toBe('480.00');

    // Allocation reserved_qty is now 8.000
    const allocRes = await pool.query<{ reserved_qty: string }>(
      `SELECT reserved_qty::text FROM allocations WHERE id = $1`,
      [allocationOnlineId],
    );
    expect(Number(allocRes.rows[0]!.reserved_qty)).toBe(8);
  });

  it('BR-12c: Requesting more than ONLINE available bucket returns 409 INSUFFICIENT_ALLOCATION and never draws from RESERVE', async () => {
    if (!ready) return;

    // Remaining ONLINE available: 42 kg (50 - 8).
    // Try to request 45 kg from customer 2
    const res = await request(app)
      .post('/v1/cart/items')
      .set('Authorization', `Bearer ${customerToken2}`)
      .send({
        productId: cropId,
        grade: 'GRADE_1',
        qtyKg: '45.000',
      });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('INSUFFICIENT_ALLOCATION');

    // Verify RESERVE bucket remains completely untouched (reserved_qty = 0)
    const reserveAlloc = await pool.query<{ reserved_qty: string; available_qty: string }>(
      `SELECT reserved_qty::text, available_qty::text FROM allocations WHERE id = $1`,
      [allocationReserveId],
    );
    expect(Number(reserveAlloc.rows[0]!.reserved_qty)).toBe(0);
    expect(Number(reserveAlloc.rows[0]!.available_qty)).toBe(10);
  });

  it('Concurrency Race: Multiple parallel requests competing for the last stock allow only winners up to available qty', async () => {
    if (!ready) return;

    // Remaining ONLINE available is 42.000 kg.
    // Create 5 concurrent requests each trying to reserve 15.000 kg (Total 75 kg > 42 kg).
    // Exactly 2 requests (30 kg) will succeed, the other 3 must fail with 409.
    const promises = Array.from({ length: 5 }).map(async (_, idx) => {
      const uId = newId();
      const cId = newId();
      const mobile = `+919877${Math.floor(100000 + Math.random() * 900000)}`;

      await pool.query(`
        INSERT INTO users (id, mobile, full_name, user_type, status)
        VALUES ('${uId}', '${mobile}', 'Race Customer ${idx}', 'CUSTOMER', 'ACTIVE');
        INSERT INTO customers (id, user_id, customer_code)
        VALUES ('${cId}', '${uId}', 'CUST-RACE-${idx}-${newId().slice(0, 6)}');
      `);

      const token = signAccessToken({
        sub: uId,
        roles: [{ code: 'CUSTOMER' }],
        farmerId: null,
        customerId: cId,
      });

      return request(app)
        .post('/v1/cart/items')
        .set('Authorization', `Bearer ${token}`)
        .send({
          productId: cropId,
          grade: 'GRADE_1',
          qtyKg: '15.000',
        });
    });

    const results = await Promise.all(promises);
    const successes = results.filter((r) => r.status === 201);
    const conflicts = results.filter((r) => r.status === 409);

    expect(successes).toHaveLength(2); // 15 + 15 = 30 kg reserved
    expect(conflicts).toHaveLength(3); // 3 conflicts

    // Reserved is now 8 + 30 = 38 kg, available is 12 kg (<= 50 kg allocated)
    const allocRes = await pool.query<{ reserved_qty: string; available_qty: string }>(
      `SELECT reserved_qty::text, available_qty::text FROM allocations WHERE id = $1`,
      [allocationOnlineId],
    );
    expect(Number(allocRes.rows[0]!.reserved_qty)).toBe(38);
    expect(Number(allocRes.rows[0]!.available_qty)).toBe(12);
  });

  it('BR-22b: cart-lock-reaper sweeps expired carts, returns reserved quantity to the ONLINE bucket, and is idempotent', async () => {
    if (!ready) return;

    // Expire customer1's cart by setting locked_until and locked_at in the past
    await pool.query(
      `UPDATE carts
          SET locked_at = now() - interval '25 hours',
              locked_until = now() - interval '1 hour'
        WHERE customer_id = $1`,
      [customerId1],
    );

    const { cartLockReaper } = await import('../../jobs/worker.js');

    // Run 1: reaper sweeps expired cart and returns its 8 kg
    await cartLockReaper({ batchSize: 500 }, {} as any);

    // Verify cart and items are EXPIRED
    const cartRes = await pool.query<{ status: string }>(
      `SELECT status FROM carts WHERE customer_id = $1`,
      [customerId1],
    );
    expect(cartRes.rows[0]!.status).toBe('EXPIRED');

    // Reserved quantity in ONLINE allocation decreased by 8 kg (38 - 8 = 30 kg)
    const allocRes1 = await pool.query<{ reserved_qty: string; available_qty: string }>(
      `SELECT reserved_qty::text, available_qty::text FROM allocations WHERE id = $1`,
      [allocationOnlineId],
    );
    expect(Number(allocRes1.rows[0]!.reserved_qty)).toBe(30);
    expect(Number(allocRes1.rows[0]!.available_qty)).toBe(20);

    // Run 2: repeat execution must be idempotent and not decrement again
    await cartLockReaper({ batchSize: 500 }, {} as any);

    const allocRes2 = await pool.query<{ reserved_qty: string; available_qty: string }>(
      `SELECT reserved_qty::text, available_qty::text FROM allocations WHERE id = $1`,
      [allocationOnlineId],
    );
    expect(Number(allocRes2.rows[0]!.reserved_qty)).toBe(30);
    expect(Number(allocRes2.rows[0]!.available_qty)).toBe(20);
  });

  it('DELETE /v1/cart empties the cart and immediately releases reservations', async () => {
    if (!ready) return;

    // Customer 2 adds 10 kg
    await request(app)
      .post('/v1/cart/items')
      .set('Authorization', `Bearer ${customerToken2}`)
      .send({
        productId: cropId,
        grade: 'GRADE_1',
        qtyKg: '10.000',
      });

    const allocBefore = await pool.query<{ reserved_qty: string }>(
      `SELECT reserved_qty::text FROM allocations WHERE id = $1`,
      [allocationOnlineId],
    );
    expect(Number(allocBefore.rows[0]!.reserved_qty)).toBe(40); // 30 + 10

    // Clear cart
    const delRes = await request(app)
      .delete('/v1/cart')
      .set('Authorization', `Bearer ${customerToken2}`);

    expect(delRes.status).toBe(204);

    // Allocation reserved_qty is back to 30.000
    const allocAfter = await pool.query<{ reserved_qty: string }>(
      `SELECT reserved_qty::text FROM allocations WHERE id = $1`,
      [allocationOnlineId],
    );
    expect(Number(allocAfter.rows[0]!.reserved_qty)).toBe(30);

    // GET /v1/cart returns empty
    const getRes = await request(app)
      .get('/v1/cart')
      .set('Authorization', `Bearer ${customerToken2}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.items).toHaveLength(0);
    expect(getRes.body.subtotal).toBe('0.00');
  });

  it('SUPER_ADMIN is forbidden from cart endpoints (403)', async () => {
    if (!ready) return;

    const res = await request(app)
      .get('/v1/cart')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });
});
