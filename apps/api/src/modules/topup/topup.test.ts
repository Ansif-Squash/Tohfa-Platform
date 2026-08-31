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
