import { config } from '../config.js';
import type { PaymentGateway } from './gateway.js';
import { mockPaymentGateway } from './mock.gateway.js';
import { razorpayPaymentGateway } from './razorpay.gateway.js';

export * from './gateway.js';
export * from './mock.gateway.js';
export * from './razorpay.gateway.js';

export function getPaymentGateway(): PaymentGateway {
  if (config.PAYMENT_PROVIDER === 'razorpay') {
    return razorpayPaymentGateway;
  }
  return mockPaymentGateway;
}

export const paymentGateway = getPaymentGateway();
