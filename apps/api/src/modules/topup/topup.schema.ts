import { z } from 'zod';
import { type Money } from '@tohfa/shared-types';

const moneySchema = z.string().regex(/^-?[0-9]{1,10}(\.[0-9]{1,2})?$/);

export const topupModes = ['UPI', 'CARD', 'NETBANKING'] as const;
export type TopupMode = (typeof topupModes)[number];

export const createTopupSchema = z.object({
  amount: moneySchema,
  mode: z.enum(topupModes),
});
export type CreateTopupInput = {
  amount: Money;
  mode: TopupMode;
};

export const topupIntentResponseSchema = z.object({
  topupId: z.string().uuid(),
  gateway: z.literal('RAZORPAY'),
  gatewayOrderId: z.string(),
  amount: moneySchema,
  currency: z.literal('INR'),
  status: z.enum(['PENDING', 'SUCCESS', 'FAILED']),
  razorpayKeyId: z.string(),
  presetAmounts: z.array(moneySchema).optional(),
});
export type TopupIntentResponse = {
  topupId: string;
  gateway: 'RAZORPAY';
  gatewayOrderId: string;
  amount: Money;
  currency: 'INR';
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  razorpayKeyId: string;
  presetAmounts?: Money[];
};

export const razorpayWebhookBodySchema = z.object({
  event: z.string(),
  created_at: z.number().int().optional(),
  payload: z.record(z.unknown()).optional(),
});
export type RazorpayWebhookBody = z.infer<typeof razorpayWebhookBodySchema>;

export const webhookResponseSchema = z.object({
  received: z.boolean(),
  duplicate: z.boolean().optional(),
});
export type WebhookResponse = z.infer<typeof webhookResponseSchema>;
