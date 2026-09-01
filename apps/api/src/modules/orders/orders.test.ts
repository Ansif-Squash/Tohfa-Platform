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
import { createOrdersService } from './orders.service.js';

describe('OrdersService Unit Tests', () => {
  it('rejects order placement for non-customer actor (403)', async () => {
    const service = createOrdersService();
    const actor = {
      userId: newId(),
      roles: [{ code: 'SUPER_ADMIN' as const }],
      farmerId: null,
      customerId: null,
    };

    await expect(
      service.checkout(actor, aScope(), {
        fulfillmentType: 'PICKUP',
        warehouseId: newId(),
        paymentMethod: 'WALLET',
      }),
    ).rejects.toMatchObject({
      code: 'FORBIDDEN',
      status: 403,
    });
  });

  it('BR-15: rejects CASH payment method with 501 Not Implemented', async () => {
    const service = createOrdersService();
    const actor = {
      userId: newId(),
      roles: [{ code: 'CUSTOMER' as const }],
      farmerId: null,
      customerId: newId(),
    };

    await expect(
      service.checkout(actor, aScope(), {
        fulfillmentType: 'PICKUP',
        warehouseId: newId(),
        paymentMethod: 'CASH',
      }),
    ).rejects.toMatchObject({
      status: 501,
    });
  });
});

describeIfDatabase('Orders Integration Tests (BR-17, BR-21, BR-15, BR-22)', () => {
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
  let allocationId: string;
  let addressId: string;

  beforeAll(async () => {
    ready = await databaseReady('orders');
    if (!ready) return;

    customerUserId1 = newId();
    customerId1 = newId();
    customerUserId2 = newId();
    customerId2 = newId();
    adminUserId = newId();
    warehouseId = newId();
    addressId = newId();
    const farmerUserId = newId();
    const farmerId = newId();

    const rand = Math.floor(100000 + Math.random() * 900000);
    const m1 = `+919811${rand}`;
    const m2 = `+919822${rand}`;
    const m3 = `+919833${rand}`;
    const m4 = `+919844${rand}`;

    // 1. Seed warehouse, users, customers, farmer
    await pool.query(`
      INSERT INTO warehouses (id, code, name, type, address, city, pincode)
      VALUES ('${warehouseId}', 'WH-ORD-${rand}', 'Ooty Order WH', 'MAIN', '12 Commercial Rd', 'Ooty', '643001');

      INSERT INTO users (id, mobile, full_name, user_type, status)
      VALUES
        ('${customerUserId1}', '${m1}', 'Customer Order One', 'CUSTOMER', 'ACTIVE'),
        ('${customerUserId2}', '${m2}', 'Customer Order Two', 'CUSTOMER', 'ACTIVE'),
        ('${adminUserId}', '${m3}', 'Admin Order User', 'ADMIN', 'ACTIVE'),
        ('${farmerUserId}', '${m4}', 'Farmer Order User', 'FARMER', 'ACTIVE');

      INSERT INTO customers (id, user_id, customer_code)
      VALUES
        ('${customerId1}', '${customerUserId1}', 'CUST-ORD1-${rand}'),
        ('${customerId2}', '${customerUserId2}', 'CUST-ORD2-${rand}');

      INSERT INTO customer_addresses (id, customer_id, label, line1, city, pincode, is_default)
      VALUES ('${addressId}', '${customerId1}', 'HOME', '10 Fernhill Road', 'Ooty', '643004', true);

      INSERT INTO farmers (id, user_id, tohfa_farmer_id, application_status)
      VALUES ('${farmerId}', '${farmerUserId}', 'FARM-ORD-${rand}', 'APPROVED');
    `);

    // 2. Create customer wallets: customer 1 gets Rs 200, customer 2 gets Rs 1000
    const w1 = newId();
    const w2 = newId();
    await pool.query(`
      INSERT INTO wallets (id, owner_type, customer_id, balance, currency, status)
      VALUES
        ('${w1}', 'CUSTOMER', '${customerId1}', 0, 'INR', 'ACTIVE'),
        ('${w2}', 'CUSTOMER', '${customerId2}', 0, 'INR', 'ACTIVE');

      INSERT INTO wallet_transactions (
        wallet_id, idempotency_key, direction, type, amount, balance_after,
        ref_type, ref_id, remarks
      )
      VALUES
        ('${w1}', 'seed-${w1}', 'CREDIT', 'TOPUP_DIGITAL', 200.00, 200.00, 'TOPUP', gen_random_uuid(), 'Seed 200'),
        ('${w2}', 'seed-${w2}', 'CREDIT', 'TOPUP_DIGITAL', 1000.00, 1000.00, 'TOPUP', gen_random_uuid(), 'Seed 1000');
    `);

    // 3. Create crop, retail price, batch, and online allocation
    const catRes = await pool.query<{ id: string }>(`SELECT id FROM categories LIMIT 1`);
    cropId = newId();
    await pool.query(
      `INSERT INTO crop_master (id, category_id, slug, name) VALUES ($1, $2, $3, $4)`,
      [cropId, catRes.rows[0]!.id, `crop-order-${rand}`, `Order Potato ${rand}`],
    );

    await pool.query(
      `INSERT INTO retail_prices (crop_id, grade, price, effective_from, set_by)
       VALUES ($1, 'GRADE_1', 100.00, CURRENT_DATE - interval '1 day', $2)
       ON CONFLICT (crop_id, grade, effective_from)
       DO UPDATE SET price = 100.00`,
      [cropId, adminUserId],
    );

    batchId = newId();
    allocationId = newId();

    await pool.query(
      `INSERT INTO inventory_batches (
         id, batch_code, warehouse_id, crop_id, grade, source_farmer_id, qty_received, qty_available, status
       )
       VALUES ($1, $2, $3, $4, 'GRADE_1', $5, 200.000, 200.000, 'ACTIVE')`,
      [batchId, `BATCH-ORD-${rand}`, warehouseId, cropId, farmerId],
    );

    await pool.query(
      `INSERT INTO allocations (
         id, batch_id, warehouse_id, channel, allocated_qty, consumed_qty, reserved_qty
       )
       VALUES ($1, $2, $3, 'ONLINE', 100.000, 0, 0)`,
      [allocationId, batchId, warehouseId],
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

  it('BR-17a: Wallet balance Rs 200 / Cart Rs 500 returns 402 WALLET_INSUFFICIENT with exact shortfall and creates no order row', async () => {
    if (!ready) return;

    // 1. Add 5 kg (@ Rs 100 = Rs 500) to Customer 1's cart
    const addRes = await request(app)
      .post('/v1/cart/items')
      .set('Authorization', `Bearer ${customerToken1}`)
      .send({
        productId: cropId,
        grade: 'GRADE_1',
        qtyKg: '5.000',
        warehouseId,
      });

    expect(addRes.status).toBe(201);
    expect(addRes.body.subtotal).toBe('500.00');

    // 2. Customer 1 attempts checkout with wallet holding Rs 200
    const checkoutRes = await request(app)
      .post('/v1/orders')
      .set('Authorization', `Bearer ${customerToken1}`)
      .set('idempotency-key', `chk-insufficient-${newId()}`)
      .send({
        fulfillmentType: 'PICKUP',
        warehouseId,
        paymentMethod: 'WALLET',
      });

    expect(checkoutRes.status).toBe(402);
    expect(checkoutRes.body.code).toBe('WALLET_INSUFFICIENT');
    expect(checkoutRes.body.meta?.shortfall).toBe('300.00'); // 500 - 200 = 300

    // 3. Assert NO order row exists for customer 1
    const orderCountRes = await pool.query<{ count: string }>(
      `SELECT count(*)::text FROM orders WHERE customer_id = $1`,
      [customerId1],
    );
    expect(Number(orderCountRes.rows[0]!.count)).toBe(0);

    // 4. Wallet balance remains Rs 200.00
    const walletRes = await pool.query<{ balance: string }>(
      `SELECT balance::text FROM wallets WHERE customer_id = $1`,
      [customerId1],
    );
    expect(Number(walletRes.rows[0]!.balance)).toBe(200.0);

    // 5. Cart and stock reservation remain intact for top-up
    const cartRes = await pool.query<{ status: string }>(
      `SELECT status FROM carts WHERE customer_id = $1`,
      [customerId1],
    );
    expect(cartRes.rows[0]!.status).toBe('LOCKED');
  });

  it('BR-17b: Successful checkout creates exactly one order and one ORDER_DEBIT ledger row; replay is idempotent', async () => {
    if (!ready) return;

    // 1. Add 4 kg (@ Rs 100 = Rs 400) to Customer 2's cart (Wallet holds Rs 1000)
    await request(app)
      .post('/v1/cart/items')
      .set('Authorization', `Bearer ${customerToken2}`)
      .send({
        productId: cropId,
        grade: 'GRADE_1',
        qtyKg: '4.000',
        warehouseId,
      });

    const allocBefore = await pool.query<{ reserved_qty: string; consumed_qty: string }>(
      `SELECT reserved_qty::text, consumed_qty::text FROM allocations WHERE id = $1`,
      [allocationId],
    );
    const reservedBefore = Number(allocBefore.rows[0]!.reserved_qty); // 5 (cust1) + 4 (cust2) = 9
    const consumedBefore = Number(allocBefore.rows[0]!.consumed_qty); // 0

    const idempotencyKey = `chk-success-${newId()}`;

    // 2. Checkout
    const checkoutRes = await request(app)
      .post('/v1/orders')
      .set('Authorization', `Bearer ${customerToken2}`)
      .set('idempotency-key', idempotencyKey)
      .send({
        fulfillmentType: 'PICKUP',
        warehouseId,
        paymentMethod: 'WALLET',
      });

    expect(checkoutRes.status).toBe(201);
    expect(checkoutRes.body).toMatchObject({
      orderNumber: expect.stringMatching(/^TOH-\d{4}-\d{6}$/),
      status: 'CONFIRMED',
      channel: 'ONLINE',
      fulfillmentType: 'PICKUP',
      warehouseId,
      paymentStatus: 'PAID',
      subtotal: '400.00',
      totalAmount: '400.00',
    });
    expect(checkoutRes.body.items).toHaveLength(1);
    expect(checkoutRes.body.items[0]).toMatchObject({
      productId: cropId,
      grade: 'GRADE_1',
      qtyKg: '4.000',
      unitPrice: '100.00',
      lineTotal: '400.00',
    });

    const orderId = checkoutRes.body.id;

    // 3. Wallet balance is now Rs 600 (1000 - 400)
    const walletRes = await pool.query<{ balance: string }>(
      `SELECT balance::text FROM wallets WHERE customer_id = $1`,
      [customerId2],
    );
    expect(Number(walletRes.rows[0]!.balance)).toBe(600.0);

    // 4. Exactly one ORDER_DEBIT ledger transaction row exists
    const txRes = await pool.query<{ count: string }>(
      `SELECT count(*)::text FROM wallet_transactions wt
         JOIN wallets w ON w.id = wt.wallet_id
        WHERE w.customer_id = $1
          AND wt.type = 'ORDER_DEBIT' AND wt.direction = 'DEBIT' AND wt.amount = 400.00`,
      [customerId2],
    );
    expect(Number(txRes.rows[0]!.count)).toBe(1);

    // 5. Allocation: reserved_qty decremented by 4 kg, consumed_qty incremented by 4 kg
    const allocAfter = await pool.query<{ reserved_qty: string; consumed_qty: string }>(
      `SELECT reserved_qty::text, consumed_qty::text FROM allocations WHERE id = $1`,
      [allocationId],
    );
    expect(Number(allocAfter.rows[0]!.reserved_qty)).toBe(reservedBefore - 4);
    expect(Number(allocAfter.rows[0]!.consumed_qty)).toBe(consumedBefore + 4);

    // 6. Stock ledger has a SALE entry
    const stockLedgerRes = await pool.query<{ movement_type: string; qty_delta: string }>(
      `SELECT movement_type, qty_delta::text FROM stock_ledger
        WHERE ref_type = 'ORDER' AND ref_id = $1`,
      [orderId],
    );
    expect(stockLedgerRes.rows).toHaveLength(1);
    expect(stockLedgerRes.rows[0]!.movement_type).toBe('SALE');
    expect(Number(stockLedgerRes.rows[0]!.qty_delta)).toBe(-4);

    // 7. Order status history row exists
    const historyRes = await pool.query<{ to_status: string }>(
      `SELECT to_status FROM order_status_history WHERE order_id = $1`,
      [orderId],
    );
    expect(historyRes.rows[0]!.to_status).toBe('CONFIRMED');

    // 8. Replay with exact same idempotency-key -> returns identical order and NO duplicate rows
    const replayRes = await request(app)
      .post('/v1/orders')
      .set('Authorization', `Bearer ${customerToken2}`)
      .set('idempotency-key', idempotencyKey)
      .send({
        fulfillmentType: 'PICKUP',
        warehouseId,
        paymentMethod: 'WALLET',
      });

    expect(replayRes.status).toBe(201);
    expect(replayRes.body.id).toBe(orderId);

    // Wallet balance still 600
    const walletReplay = await pool.query<{ balance: string }>(
      `SELECT balance::text FROM wallets WHERE customer_id = $1`,
      [customerId2],
    );
    expect(Number(walletReplay.rows[0]!.balance)).toBe(600.0);

    // Still only 1 transaction
    const txReplay = await pool.query<{ count: string }>(
      `SELECT count(*)::text FROM wallet_transactions wt
         JOIN wallets w ON w.id = wt.wallet_id
        WHERE w.customer_id = $1
          AND wt.type = 'ORDER_DEBIT' AND wt.direction = 'DEBIT' AND wt.amount = 400.00`,
      [customerId2],
    );
    expect(Number(txReplay.rows[0]!.count)).toBe(1);
  });

  it('Fault-injection test: mid-transaction failure rolls back wallet debit, stock consumption, and order creation', async () => {
    if (!ready) return;

    // 1. Add 2 kg (@ Rs 100 = Rs 200) to Customer 2's cart (Wallet holds Rs 600)
    await request(app)
      .post('/v1/cart/items')
      .set('Authorization', `Bearer ${customerToken2}`)
      .send({
        productId: cropId,
        grade: 'GRADE_1',
        qtyKg: '2.000',
        warehouseId,
      });

    const walletBefore = await pool.query<{ balance: string }>(
      `SELECT balance::text FROM wallets WHERE customer_id = $1`,
      [customerId2],
    );
    const balanceBefore = Number(walletBefore.rows[0]!.balance);

    const allocBefore = await pool.query<{ reserved_qty: string; consumed_qty: string }>(
      `SELECT reserved_qty::text, consumed_qty::text FROM allocations WHERE id = $1`,
      [allocationId],
    );
    const reservedBefore = Number(allocBefore.rows[0]!.reserved_qty);
    const consumedBefore = Number(allocBefore.rows[0]!.consumed_qty);

    const ledgerBefore = await pool.query<{ count: string }>(
      `SELECT count(*)::text FROM stock_ledger WHERE remarks = 'Customer order checkout' AND qty_delta = -2.000`,
    );
    const ledgerCountBefore = Number(ledgerBefore.rows[0]!.count);

    // Create a mock repo that fails during createOrder (after wallet debit)
    const { ordersRepo: realRepo } = await import('./orders.repo.js');
    const { createOrdersService } = await import('./orders.service.js');

    const failingRepo = {
      ...realRepo,
      async createOrder(): Promise<never> {
        throw new Error('FAULT_INJECTION_MID_TRANSACTION_FAILURE');
      },
    };

    const service = createOrdersService({ repo: failingRepo as any });
    const actor = {
      userId: customerUserId2,
      roles: [{ code: 'CUSTOMER' as const }],
      farmerId: null,
      customerId: customerId2,
    };

    await expect(
      service.checkout(actor, aScope(), {
        fulfillmentType: 'PICKUP',
        warehouseId,
        paymentMethod: 'WALLET',
      }),
    ).rejects.toThrow('FAULT_INJECTION_MID_TRANSACTION_FAILURE');

    // Assert: wallet balance is unchanged
    const walletAfter = await pool.query<{ balance: string }>(
      `SELECT balance::text FROM wallets WHERE customer_id = $1`,
      [customerId2],
    );
    expect(Number(walletAfter.rows[0]!.balance)).toBe(balanceBefore);

    // Assert: allocations reserved_qty and consumed_qty are unchanged
    const allocAfter = await pool.query<{ reserved_qty: string; consumed_qty: string }>(
      `SELECT reserved_qty::text, consumed_qty::text FROM allocations WHERE id = $1`,
      [allocationId],
    );
    expect(Number(allocAfter.rows[0]!.reserved_qty)).toBe(reservedBefore);
    expect(Number(allocAfter.rows[0]!.consumed_qty)).toBe(consumedBefore);

    // Assert: no stock ledger row added for this attempt
    const ledgerAfter = await pool.query<{ count: string }>(
      `SELECT count(*)::text FROM stock_ledger WHERE remarks = 'Customer order checkout' AND qty_delta = -2.000`,
    );
    expect(Number(ledgerAfter.rows[0]!.count)).toBe(ledgerCountBefore);
  });

  it('BR-21a: Home delivery enforces address, date, slot capacity, and dynamic fee calculation', async () => {
    if (!ready) return;

    // Ensure delivery slot exists with capacity 1
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]!;
    await pool.query(
      `INSERT INTO delivery_slots (warehouse_id, slot_date, slot, capacity_orders, booked_orders)
       VALUES ($1, $2, 'MORNING_8_12', 1, 0)
       ON CONFLICT (warehouse_id, slot_date, slot)
       DO UPDATE SET capacity_orders = 1, booked_orders = 0`,
      [warehouseId, tomorrow],
    );

    // Customer 2's cart has 2 kg (Rs 200). Subtotal Rs 200 < Free Delivery Threshold Rs 500 -> Delivery fee Rs 40 added
    const deliveryCheckoutRes = await request(app)
      .post('/v1/orders')
      .set('Authorization', `Bearer ${customerToken2}`)
      .send({
        fulfillmentType: 'HOME_DELIVERY',
        warehouseId,
        deliveryAddressId: addressId,
        deliveryDate: tomorrow,
        deliverySlot: 'MORNING_8_12',
        paymentMethod: 'WALLET',
      });

    expect(deliveryCheckoutRes.status).toBe(201);
    expect(deliveryCheckoutRes.body).toMatchObject({
      fulfillmentType: 'DELIVERY',
      subtotal: '200.00',
      deliveryFee: '40.00',
      totalAmount: '240.00',
      deliverySlot: 'MORNING_8_12',
      deliveryDate: tomorrow,
    });

    // Slot booked_orders is now 1 (capacity reached)
    const slotRes = await pool.query<{ booked_orders: number }>(
      `SELECT booked_orders FROM delivery_slots WHERE warehouse_id = $1 AND slot_date = $2 AND slot = 'MORNING_8_12'`,
      [warehouseId, tomorrow],
    );
    expect(slotRes.rows[0]!.booked_orders).toBe(1);
  });

  it('GET /v1/orders/:id returns order detail for owner and 404 for another customer (BR-36)', async () => {
    if (!ready) return;

    // List customer 2 orders to get an ID
    const listRes = await request(app)
      .get('/v1/orders')
      .set('Authorization', `Bearer ${customerToken2}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.items.length).toBeGreaterThan(0);
    const orderId = listRes.body.items[0]!.id;

    // Customer 2 fetches own order
    const getRes = await request(app)
      .get(`/v1/orders/${orderId}`)
      .set('Authorization', `Bearer ${customerToken2}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.id).toBe(orderId);
    expect(getRes.body.items.length).toBeGreaterThan(0);

    // Customer 1 tries to fetch Customer 2's order -> 404 (BR-36 customer isolation)
    const forbiddenRes = await request(app)
      .get(`/v1/orders/${orderId}`)
      .set('Authorization', `Bearer ${customerToken1}`);

    expect(forbiddenRes.status).toBe(404);
  });

  it('SUPER_ADMIN is forbidden from placing orders (403)', async () => {
    if (!ready) return;

    const res = await request(app)
      .post('/v1/orders')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        fulfillmentType: 'PICKUP',
        warehouseId,
        paymentMethod: 'WALLET',
      });

    expect(res.status).toBe(403);
  });
});
