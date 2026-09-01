import { z } from 'zod';
import type { Money } from '@tohfa/shared-types';

const moneySchema = z.string().regex(/^-?[0-9]{1,10}(\.[0-9]{1,2})?$/);
const quantitySchema = z.string().regex(/^[0-9]{1,9}(\.[0-9]{1,3})?$/);

export const produceGrades = ['GRADE_1', 'GRADE_2', 'GRADE_3', 'REJECT'] as const;
export type ProduceGrade = (typeof produceGrades)[number];
export const gradeSchema = z.enum(produceGrades);

export const fulfillmentTypes = [
  'PICKUP',
  'HOME_DELIVERY',
  'DELIVERY',
  'WAREHOUSE_PICKUP',
] as const;
export type FulfillmentType = (typeof fulfillmentTypes)[number];

export const deliverySlots = [
  'MORNING_8_12',
  'AFTERNOON_12_4',
  'EVENING_4_8',
] as const;
export type DeliverySlot = (typeof deliverySlots)[number];

export const orderStatuses = [
  'PENDING_PAYMENT',
  'CONFIRMED',
  'PACKED',
  'READY_FOR_PICKUP',
  'OUT_FOR_DELIVERY',
  'COMPLETED',
  'CANCELLED',
] as const;
export type OrderStatus = (typeof orderStatuses)[number];

export const paymentStatuses = [
  'PENDING',
  'PAID',
  'PARTIALLY_PAID',
  'REFUNDED',
  'FAILED',
] as const;
export type PaymentStatus = (typeof paymentStatuses)[number];

export const salesChannels = ['ONLINE', 'MARKET', 'HORECA', 'B2B'] as const;
export type SalesChannel = (typeof salesChannels)[number];

export const paymentMethods = [
  'WALLET',
  'CASH',
  'NETBANKING',
  'UPI',
  'CARD',
] as const;
export type PaymentMethod = (typeof paymentMethods)[number];

export const checkoutRequestSchema = z.object({
  fulfillmentType: z.enum(fulfillmentTypes).default('PICKUP'),
  warehouseId: z.string().uuid(),
  deliveryAddressId: z.string().uuid().nullable().optional(),
  deliveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  deliverySlot: z.enum(deliverySlots).optional(),
  paymentMethod: z.enum(paymentMethods).default('WALLET'),
  notes: z.string().max(300).optional(),
});
export type CheckoutRequest = {
  fulfillmentType: FulfillmentType;
  warehouseId: string;
  deliveryAddressId?: string | null | undefined;
  deliveryDate?: string | undefined;
  deliverySlot?: DeliverySlot | undefined;
  paymentMethod: PaymentMethod;
  notes?: string | undefined;
};

export const orderItemResponseSchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(),
  name: z.string(),
  grade: gradeSchema,
  qtyKg: quantitySchema,
  unitPrice: moneySchema,
  lineTotal: moneySchema,
});
export type OrderItemResponse = {
  id: string;
  productId: string;
  name: string;
  grade: ProduceGrade;
  qtyKg: string;
  unitPrice: Money;
  lineTotal: Money;
};

export const orderSummaryResponseSchema = z.object({
  id: z.string().uuid(),
  orderNumber: z.string(),
  status: z.enum(orderStatuses),
  channel: z.enum(salesChannels),
  fulfillmentType: z.enum(fulfillmentTypes),
  warehouseId: z.string().uuid(),
  itemCount: z.number().int(),
  totalAmount: moneySchema,
  paymentStatus: z.enum(paymentStatuses),
  deliveryDate: z.string().nullable().optional(),
  placedAt: z.string(),
});
export type OrderSummaryResponse = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  channel: SalesChannel;
  fulfillmentType: FulfillmentType;
  warehouseId: string;
  itemCount: number;
  totalAmount: Money;
  paymentStatus: PaymentStatus;
  deliveryDate?: string | null | undefined;
  placedAt: string;
};

export const orderResponseSchema = orderSummaryResponseSchema.extend({
  items: z.array(orderItemResponseSchema),
  subtotal: moneySchema,
  deliveryFee: moneySchema.optional(),
  discount: moneySchema.optional(),
  gstAmount: moneySchema.optional(),
  deliveryAddressId: z.string().uuid().nullable().optional(),
  deliverySlot: z.enum(deliverySlots).nullable().optional(),
});
export type OrderResponse = OrderSummaryResponse & {
  items: OrderItemResponse[];
  subtotal: Money;
  deliveryFee?: Money | undefined;
  discount?: Money | undefined;
  gstAmount?: Money | undefined;
  deliveryAddressId?: string | null | undefined;
  deliverySlot?: DeliverySlot | null | undefined;
};

export const listOrdersQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(orderStatuses).optional(),
});
export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;

export const orderIdParamSchema = z.object({
  id: z.string().uuid(),
});
export type OrderIdParam = z.infer<typeof orderIdParamSchema>;
