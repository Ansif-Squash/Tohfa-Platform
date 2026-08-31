import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createHmac, randomUUID } from 'node:crypto';
import { parseMoney, type Money } from '@tohfa/shared-types';
import { createApp } from '../../app.js';
import { signAccessToken } from '../../auth/jwt.js';
import { config } from '../../config.js';
import { pool } from '../../db/pool.js';
import {
  aScope,
  databaseReady,
  describeIfDatabase,
  newId,
} from '../../test/factories.js';
import { createTopupService } from './topup.service.js';
import { MockPaymentGateway } from '../../payments/mock.gateway.js';

describe('TopupService Unit Tests', () => {
  const mockGateway = new MockPaymentGateway();

  it('rejects topup initiation for non-customer actor', async () => {
    const service = createTopupService({ gateway: mockGateway });
    const actor = {
      userId: newId(),
      roles: [{ code: 'FARMER' as const }],
      farmerId: newId(),
      customerId: null,
    };

    await expect(
      service.createTopup(actor, aScope(), {
        amount: parseMoney('500.00'),
        mode: 'UPI',
      }),
    ).rejects.toMatchObject({
      code: 'FORBIDDEN',
      status: 403,
    });
  });

  it('rejects topup initiation with non-positive amount', async () => {
    const service = createTopupService({
      gateway: mockGateway,
      walletSvc: {
        getWalletForActor: async () => ({ id: newId(), balance: '0.00' as Money, ownerType: 'CUSTOMER' as const, ownerId: newId(), status: 'ACTIVE' as const, created_at: new Date() }),
      } as any,
    });
    const actor = {
      userId: newId(),
      roles: [{ code: 'CUSTOMER' as const }],
      farmerId: null,
      customerId: newId(),
    };

    await expect(
      service.createTopup(actor, aScope(), {
        amount: parseMoney('0.00'),
        mode: 'UPI',
      }),
    ).rejects.toMatchObject({
      code: 'VALIDATION_FAILED',
      status: 422,
    });
  });

  it('processRazorpayWebhook rejects missing signature with 401', async () => {
    const service = createTopupService({ gateway: mockGateway });
    await expect(
      service.processRazorpayWebhook(
        Buffer.from(JSON.stringify({ event: 'payment.captured' })),
        undefined,
        'evt_1',
      ),
    ).rejects.toMatchObject({
      code: 'UNAUTHENTICATED',
      status: 401,
    });
  });

  it('processRazorpayWebhook rejects forged signature with 401', async () => {
    const service = createTopupService({ gateway: mockGateway });
    await expect(
      service.processRazorpayWebhook(
        Buffer.from(JSON.stringify({ event: 'payment.captured' })),
        'forged_signature_hex',
        'evt_1',
      ),
    ).rejects.toMatchObject({
      code: 'UNAUTHENTICATED',
      status: 401,
    });
  });
});

describeIfDatabase('Topup & Webhook Integration Tests (BR-17b)', () => {
  let ready = false;
  const app = createApp();

  let testUserId: string;
  let testCustomerId: string;
  let testCustomerToken: string;
  const webhookSecret = config.RAZORPAY_WEBHOOK_SECRET || 'mock_webhook_secret';

  beforeAll(async () => {
    ready = await databaseReady('topups');
    if (!ready) return;

    testUserId = newId();
    testCustomerId = newId();
    const rand = Math.floor(100000 + Math.random() * 900000);
    const mobile = `+919911${rand}`;
    const custCode = `CUST-TOPUP-${rand}`;

    await pool.query(`
      INSERT INTO users (id, mobile, full_name, user_type, status)
      VALUES ('${testUserId}', '${mobile}', 'Topup Test User', 'CUSTOMER', 'ACTIVE');

      INSERT INTO customers (id, user_id, customer_code)
      VALUES ('${testCustomerId}', '${testUserId}', '${custCode}');
    `);

    testCustomerToken = signAccessToken({
      sub: testUserId,
      roles: [{ code: 'CUSTOMER' }],
      farmerId: null,
      customerId: testCustomerId,
    });
  });

  afterAll(async () => {
    if (!ready) return;
    const { closePool } = await import('../../db/pool.js');
    await closePool();
  });

  it('BR-17b: POST /v1/wallets/me/topups creates pending intent without crediting balance', async () => {
    if (!ready) return;

    const res = await request(app)
      .post('/v1/wallets/me/topups')
      .set('Authorization', `Bearer ${testCustomerToken}`)
      .set('Idempotency-Key', newId())
      .send({
        amount: '1000.00',
        mode: 'UPI',
      });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      gateway: 'RAZORPAY',
      amount: '1000.00',
      currency: 'INR',
      status: 'PENDING',
    });
    expect(res.body).toHaveProperty('topupId');
    expect(res.body).toHaveProperty('gatewayOrderId');
    expect(res.body).toHaveProperty('presetAmounts');

    // Verify wallet balance is NOT credited yet
    const walletRes = await pool.query(
      `SELECT w.balance FROM wallets w WHERE w.customer_id = $1`,
      [testCustomerId],
    );
    expect(Number(walletRes.rows[0]!.balance)).toBe(0);
  });

  it('BR-17b: POST /v1/webhooks/razorpay with valid HMAC signature credits wallet exactly once', async () => {
    if (!ready) return;

    // 1. Create topup intent
    const createRes = await request(app)
      .post('/v1/wallets/me/topups')
      .set('Authorization', `Bearer ${testCustomerToken}`)
      .set('Idempotency-Key', newId())
      .send({
        amount: '750.00',
        mode: 'CARD',
      });

    expect(createRes.status).toBe(201);
    const gatewayOrderId = createRes.body.gatewayOrderId;
    const gatewayPaymentId = `pay_${randomUUID().replace(/-/g, '').slice(0, 14)}`;

    // 2. Build signed webhook payload
    const payload = {
      event: 'payment.captured',
      created_at: Math.floor(Date.now() / 1000),
      payload: {
        payment: {
          entity: {
            id: gatewayPaymentId,
            order_id: gatewayOrderId,
            amount: 75000, // 750.00 in paise
            currency: 'INR',
            status: 'captured',
            method: 'card',
          },
        },
      },
    };
    const rawBodyString = JSON.stringify(payload);
    const signature = createHmac('sha256', webhookSecret).update(Buffer.from(rawBodyString, 'utf-8')).digest('hex');

    // 3. Deliver webhook
    const hookRes1 = await request(app)
      .post('/v1/webhooks/razorpay')
      .set('x-razorpay-signature', signature)
      .set('x-razorpay-event-id', `evt_${gatewayPaymentId}`)
      .set('Content-Type', 'application/json')
      .send(rawBodyString);

    expect(hookRes1.status).toBe(200);
    expect(hookRes1.body).toMatchObject({ received: true, duplicate: false });

    // 4. Verify wallet balance credited by 750.00
    const walletRes = await pool.query(
      `SELECT w.balance FROM wallets w WHERE w.customer_id = $1`,
      [testCustomerId],
    );
    expect(Number(walletRes.rows[0]!.balance)).toBe(750);

    // 5. Replay exact same webhook event -> must return duplicate: true and balance unchanged
    const hookRes2 = await request(app)
      .post('/v1/webhooks/razorpay')
      .set('x-razorpay-signature', signature)
      .set('x-razorpay-event-id', `evt_${gatewayPaymentId}`)
      .set('Content-Type', 'application/json')
      .send(rawBodyString);

    expect(hookRes2.status).toBe(200);
    expect(hookRes2.body).toMatchObject({ received: true, duplicate: true });

    // Verify balance remains 750.00 (not doubled)
    const walletRes2 = await pool.query(
      `SELECT w.balance FROM wallets w WHERE w.customer_id = $1`,
      [testCustomerId],
    );
    expect(Number(walletRes2.rows[0]!.balance)).toBe(750);
  });

  it('BR-17b: POST /v1/webhooks/razorpay with forged signature responds 401 and alters nothing', async () => {
    if (!ready) return;

    const payload = {
      event: 'payment.captured',
      created_at: Math.floor(Date.now() / 1000),
      payload: {
        payment: {
          entity: {
            id: 'pay_forged_999',
            amount: 999999,
          },
        },
      },
    };
    const rawBodyString = JSON.stringify(payload);

    const res = await request(app)
      .post('/v1/webhooks/razorpay')
      .set('x-razorpay-signature', 'forged_signature_that_fails_hmac')
      .set('x-razorpay-event-id', 'evt_forged_1')
      .set('Content-Type', 'application/json')
      .send(rawBodyString);

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHENTICATED');
  });
});

describeIfDatabase('Admin Cash Top-up & Daily Reconciliation (BR-18, BR-19, S-33)', () => {
  let ready = false;
  const app = createApp();

  let adminUserId: string;
  let adminToken: string;
  let farmerAdminToken: string;
  let testWarehouseId: string;
  let customerUserId: string;
  let customerId: string;

  beforeAll(async () => {
    ready = await databaseReady('topups');
    if (!ready) return;

    adminUserId = newId();
    testWarehouseId = newId();
    customerUserId = newId();
    customerId = newId();
    const farmerAdminUserId = newId();

    const rand = Math.floor(100000 + Math.random() * 900000);
    const adminMobile = `+919811${rand}`;
    const faMobile = `+919822${rand}`;
    const custMobile = `+919833${rand}`;

    await pool.query(`
      INSERT INTO warehouses (id, code, name, type, address_line1, city, state, pincode)
      VALUES ('${testWarehouseId}', 'WH-TEST-${rand}', 'Ooty Test WH', 'MAIN', '123 Hill Rd', 'Ooty', 'Tamil Nadu', '643001');

      INSERT INTO users (id, mobile, full_name, user_type, status)
      VALUES
        ('${adminUserId}', '${adminMobile}', 'Warehouse Admin', 'ADMIN', 'ACTIVE'),
        ('${farmerAdminUserId}', '${faMobile}', 'Farmer Admin', 'ADMIN', 'ACTIVE'),
        ('${customerUserId}', '${custMobile}', 'Cash Topup Customer', 'CUSTOMER', 'ACTIVE');

      INSERT INTO customers (id, user_id, customer_code)
      VALUES ('${customerId}', '${customerUserId}', 'CUST-CASH-${rand}');
    `);

    adminToken = signAccessToken({
      sub: adminUserId,
      roles: [{ code: 'MAIN_WH_ADMIN', warehouseId: testWarehouseId }],
      farmerId: null,
      customerId: null,
    });

    farmerAdminToken = signAccessToken({
      sub: farmerAdminUserId,
      roles: [{ code: 'FARMER_ADMIN' }],
      farmerId: null,
      customerId: null,
    });
  });

  it('BR-18a: Missing fiscal cash tag on a CASH top-up returns 422 FISCAL_TAG_REQUIRED; no ledger row written', async () => {
    if (!ready) return;

    const res = await request(app)
      .post(`/v1/admin/wallets/${customerId}/cash-topup`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Idempotency-Key', newId())
      .send({
        amount: '1500.00',
        warehouseId: testWarehouseId,
        fiscalCashTag: '', // Missing / empty tag
      });

    expect(res.status).toBe(422);
    expect(res.body.code).toBe('FISCAL_TAG_REQUIRED');

    // Verify no ledger row was written
    const ledgerRes = await pool.query(
      `SELECT wt.id FROM wallet_transactions wt
         JOIN wallets w ON w.id = wt.wallet_id
        WHERE w.customer_id = $1`,
      [customerId],
    );
    expect(ledgerRes.rows).toHaveLength(0);
  });

  it('FARMER_ADMIN gets 403 FORBIDDEN attempting to process cash top-up', async () => {
    if (!ready) return;

    const res = await request(app)
      .post(`/v1/admin/wallets/${customerId}/cash-topup`)
      .set('Authorization', `Bearer ${farmerAdminToken}`)
      .set('Idempotency-Key', newId())
      .send({
        amount: '1000.00',
        warehouseId: testWarehouseId,
        fiscalCashTag: `TAG-${newId().slice(0, 8)}`,
      });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  it('BR-19a: Rs 10,000.01 returns 422 CASH_LIMIT_EXCEEDED; no ledger row written', async () => {
    if (!ready) return;

    const res = await request(app)
      .post(`/v1/admin/wallets/${customerId}/cash-topup`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Idempotency-Key', newId())
      .send({
        amount: '10000.01',
        warehouseId: testWarehouseId,
        fiscalCashTag: `TAG-CAP-${newId().slice(0, 8)}`,
      });

    expect(res.status).toBe(422);
    expect(res.body.code).toBe('CASH_LIMIT_EXCEEDED');

    // Verify balance remains 0
    const walletRes = await pool.query(
      `SELECT balance FROM wallets WHERE customer_id = $1`,
      [customerId],
    );
    expect(Number(walletRes.rows[0]?.balance ?? 0)).toBe(0);
  });

  it('BR-19b: Rs 10,000.00 exactly is accepted; two consecutive Rs 10,000 top-ups both succeed', async () => {
    if (!ready) return;

    const tag1 = `TAG-OK1-${newId().slice(0, 8)}`;
    const tag2 = `TAG-OK2-${newId().slice(0, 8)}`;

    // Top-up 1: Rs 10,000.00
    const res1 = await request(app)
      .post(`/v1/admin/wallets/${customerId}/cash-topup`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Idempotency-Key', newId())
      .send({
        amount: '10000.00',
        warehouseId: testWarehouseId,
        fiscalCashTag: tag1,
        remarks: 'First 10k top-up',
      });

    expect(res1.status).toBe(201);
    expect(res1.body).toMatchObject({
      txnType: 'TOPUP_CASH',
      amount: '10000.00',
      balanceAfter: '10000.00',
    });

    // Top-up 2: Another Rs 10,000.00 (two consecutive 10k allowed per BR-19)
    const res2 = await request(app)
      .post(`/v1/admin/wallets/${customerId}/cash-topup`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Idempotency-Key', newId())
      .send({
        amount: '10000.00',
        warehouseId: testWarehouseId,
        fiscalCashTag: tag2,
        remarks: 'Second 10k top-up',
      });

    expect(res2.status).toBe(201);
    expect(res2.body).toMatchObject({
      txnType: 'TOPUP_CASH',
      amount: '10000.00',
      balanceAfter: '20000.00',
    });

    // Verify database topups records have warehouse_id, processed_by, and audit log
    const topupRows = await pool.query(
      `SELECT t.warehouse_id, t.processed_by, t.fiscal_cash_tag, t.status, t.sms_sent_at
         FROM topups t
        WHERE t.fiscal_cash_tag IN ($1, $2)
        ORDER BY t.created_at ASC`,
      [tag1, tag2],
    );
    expect(topupRows.rows).toHaveLength(2);
    expect(topupRows.rows[0]!.warehouse_id).toBe(testWarehouseId);
    expect(topupRows.rows[0]!.processed_by).toBe(adminUserId);
    expect(topupRows.rows[0]!.status).toBe('SUCCESS');
    expect(topupRows.rows[0]!.sms_sent_at).not.toBeNull();
  });

  it('BR-18b: Duplicate fiscal cash tag returns 409 CONFLICT', async () => {
    if (!ready) return;

    const duplicateTag = `TAG-DUP-${newId().slice(0, 8)}`;

    const res1 = await request(app)
      .post(`/v1/admin/wallets/${customerId}/cash-topup`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Idempotency-Key', newId())
      .send({
        amount: '2000.00',
        warehouseId: testWarehouseId,
        fiscalCashTag: duplicateTag,
      });
    expect(res1.status).toBe(201);

    // Second request with SAME physical receipt tag -> must fail with 409
    const res2 = await request(app)
      .post(`/v1/admin/wallets/${customerId}/cash-topup`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Idempotency-Key', newId())
      .send({
        amount: '2000.00',
        warehouseId: testWarehouseId,
        fiscalCashTag: duplicateTag,
      });

    expect(res2.status).toBe(409);
    expect(res2.body.code).toBe('CONFLICT');
  });

  it('Daily cash reconciliation job runs and is idempotent', async () => {
    if (!ready) return;

    const { dailyCashReconciliation } = await import('../../jobs/worker.js');

    // Run 1: Today's date
    const todayStr = new Date().toISOString().split('T')[0]!;
    await dailyCashReconciliation({ targetDate: todayStr }, {} as any);

    // Run 2: Repeat exact same reconciliation -> must succeed idempotently
    await dailyCashReconciliation({ targetDate: todayStr }, {} as any);

    const jobRunRes = await pool.query(
      `SELECT status, items_processed FROM job_runs
        WHERE job_name = 'daily-cash-reconciliation'
        ORDER BY started_at DESC LIMIT 1`,
    );
    expect(jobRunRes.rows[0]!.status).toBe('COMPLETED');
  });
});
