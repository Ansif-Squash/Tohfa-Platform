import type { Paise } from '@tohfa/shared-types';

export interface CreateOrderParams {
  amountPaise: Paise | number;
  currency?: 'INR';
  receipt: string;
  notes?: Record<string, string>;
}

export interface GatewayOrderResult {
  gatewayOrderId: string;
  amountPaise: number;
  currency: string;
  status: string;
}

export interface PaymentCapturedPayload {
  paymentId: string;
  orderId?: string | null;
  amountPaise: number;
  currency: string;
  method?: string | null;
  status: string;
  email?: string | null;
  contact?: string | null;
}

export interface WebhookEvent {
  event: string;
  createdAt: number;
  payment?: PaymentCapturedPayload | undefined;
  rawPayload: Record<string, unknown>;
}

export interface PaymentGateway {
  readonly provider: 'mock' | 'razorpay';
  createOrder(params: CreateOrderParams): Promise<GatewayOrderResult>;
  verifyWebhookSignature(rawBody: Buffer | string, signature: string, secret: string): boolean;
  parseEvent(rawBody: Buffer | string): WebhookEvent;
  fetchPayment?(gatewayPaymentId: string): Promise<PaymentCapturedPayload | null>;
}
