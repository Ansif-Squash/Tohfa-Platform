import { describe, expect, it } from 'vitest';
import { createHmac } from 'node:crypto';
import { MockPaymentGateway } from './mock.gateway.js';
import { RazorpayPaymentGateway } from './razorpay.gateway.js';

describe('PaymentGateway Unit Tests', () => {
  const mockGateway = new MockPaymentGateway();
  const razorpayGateway = new RazorpayPaymentGateway('rzp_key_test', 'rzp_sec_test');

  it('mock gateway creates deterministic synthetic order IDs', async () => {
    const order1 = await mockGateway.createOrder({
      amountPaise: 50000,
      currency: 'INR',
      receipt: 'rcpt_1',
    });

    expect(order1.gatewayOrderId).toMatch(/^order_mock_/);
    expect(order1.amountPaise).toBe(50000);
    expect(order1.currency).toBe('INR');
    expect(order1.status).toBe('created');
  });

  it('mock gateway verifies valid HMAC-SHA256 signatures with timingSafeEqual', () => {
    const secret = 'super_secret_webhook_key';
    const rawBody = Buffer.from(JSON.stringify({ event: 'payment.captured', id: 'pay_123' }), 'utf-8');
    const signature = createHmac('sha256', secret).update(rawBody).digest('hex');

    expect(mockGateway.verifyWebhookSignature(rawBody, signature, secret)).toBe(true);
    expect(mockGateway.verifyWebhookSignature(rawBody, 'invalid_signature_hex', secret)).toBe(false);
    expect(mockGateway.verifyWebhookSignature(rawBody, '', secret)).toBe(false);
  });

  it('razorpay gateway verifies valid HMAC-SHA256 signatures with timingSafeEqual', () => {
    const secret = 'rzp_webhook_secret_key';
    const rawBody = Buffer.from(JSON.stringify({ event: 'payment.captured', id: 'pay_456' }), 'utf-8');
    const signature = createHmac('sha256', secret).update(rawBody).digest('hex');

    expect(razorpayGateway.verifyWebhookSignature(rawBody, signature, secret)).toBe(true);
    expect(razorpayGateway.verifyWebhookSignature(rawBody, 'forged_signature_hex', secret)).toBe(false);
    expect(razorpayGateway.verifyWebhookSignature(rawBody, signature, 'wrong_secret')).toBe(false);
  });

  it('parses webhook payload into normalized WebhookEvent structure', () => {
    const payload = {
      event: 'payment.captured',
      created_at: 1700000000,
      payload: {
        payment: {
          entity: {
            id: 'pay_ABC123',
            order_id: 'order_XYZ987',
            amount: 100000,
            currency: 'INR',
            status: 'captured',
            method: 'upi',
          },
        },
      },
    };
    const rawBody = Buffer.from(JSON.stringify(payload));
    const event = mockGateway.parseEvent(rawBody);

    expect(event.event).toBe('payment.captured');
    expect(event.createdAt).toBe(1700000000);
    expect(event.payment).toEqual({
      paymentId: 'pay_ABC123',
      orderId: 'order_XYZ987',
      amountPaise: 100000,
      currency: 'INR',
      status: 'captured',
      method: 'upi',
      email: null,
      contact: null,
    });
  });
});
