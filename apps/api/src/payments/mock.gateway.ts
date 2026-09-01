import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import type {
  CreateOrderParams,
  GatewayOrderResult,
  PaymentCapturedPayload,
  PaymentGateway,
  WebhookEvent,
} from './gateway.js';

export class MockPaymentGateway implements PaymentGateway {
  readonly provider = 'mock' as const;

  async createOrder(params: CreateOrderParams): Promise<GatewayOrderResult> {
    const syntheticId = `order_mock_${randomUUID().replace(/-/g, '').slice(0, 14)}`;
    return {
      gatewayOrderId: syntheticId,
      amountPaise: Number(params.amountPaise),
      currency: params.currency ?? 'INR',
      status: 'created',
    };
  }

  verifyWebhookSignature(rawBody: Buffer | string, signature: string, secret: string): boolean {
    if (!signature || !secret) return false;
    const bodyBuffer = typeof rawBody === 'string' ? Buffer.from(rawBody, 'utf-8') : rawBody;
    const expected = createHmac('sha256', secret).update(bodyBuffer).digest('hex');

    const sigBuf = Buffer.from(signature, 'utf-8');
    const expBuf = Buffer.from(expected, 'utf-8');

    if (sigBuf.length !== expBuf.length) {
      return false;
    }
    return timingSafeEqual(sigBuf, expBuf);
  }

  parseEvent(rawBody: Buffer | string): WebhookEvent {
    const text = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf-8');
    const parsed = JSON.parse(text) as {
      event: string;
      created_at?: number;
      payload?: {
        payment?: {
          entity?: {
            id: string;
            order_id?: string | null;
            amount: number;
            currency: string;
            method?: string | null;
            status: string;
            email?: string | null;
            contact?: string | null;
          };
        };
      };
    };

    const paymentEntity = parsed.payload?.payment?.entity;
    const payment: PaymentCapturedPayload | undefined = paymentEntity
      ? {
          paymentId: paymentEntity.id,
          orderId: paymentEntity.order_id ?? null,
          amountPaise: Number(paymentEntity.amount),
          currency: paymentEntity.currency,
          method: paymentEntity.method ?? null,
          status: paymentEntity.status,
          email: paymentEntity.email ?? null,
          contact: paymentEntity.contact ?? null,
        }
      : undefined;

    return {
      event: parsed.event,
      createdAt: parsed.created_at ?? Math.floor(Date.now() / 1000),
      payment,
      rawPayload: parsed as Record<string, unknown>,
    };
  }

  async fetchPayment(gatewayPaymentId: string): Promise<PaymentCapturedPayload | null> {
    return {
      paymentId: gatewayPaymentId,
      orderId: `order_mock_${gatewayPaymentId}`,
      amountPaise: 100000,
      currency: 'INR',
      status: 'captured',
    };
  }
}

export const mockPaymentGateway = new MockPaymentGateway();
