import { z } from 'zod';
import type { Money } from '@tohfa/shared-types';
import {
  orderStatuses,
  salesChannels,
  type OrderStatus,
  type SalesChannel,
  type FulfillmentType,
  type DeliverySlot,
  type ProduceGrade,
} from './orders.schema.js';

export const adminOrdersQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(orderStatuses).optional(),
  warehouseId: z.string().uuid().optional(),
  channel: z.enum(salesChannels).optional(),
  deliveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});
export type AdminOrdersQuery = z.infer<typeof adminOrdersQuerySchema>;

export const assignWarehouseSchema = z.object({
  warehouseId: z.string().uuid(),
  reason: z.string().max(300).optional(),
});
export type AssignWarehouseRequest = z.infer<typeof assignWarehouseSchema>;

export const packOrderSchema = z.object({
  packedLines: z
    .array(
      z.object({
        orderItemId: z.string().uuid(),
        fulfilledQtyKg: z.string().regex(/^[0-9]{1,9}(\.[0-9]{1,3})?$/),
      }),
    )
    .optional(),
});
export type PackOrderRequest = z.infer<typeof packOrderSchema>;

export const dispatchOrderSchema = z.object({
  vehicleNumber: z.string().max(20).optional(),
  deliveryPartnerId: z.string().uuid().optional(),
  expectedArrival: z.string().datetime().optional(),
});
export type DispatchOrderRequest = z.infer<typeof dispatchOrderSchema>;

export const verifyOtpSchema = z.object({
  otp: z.string().regex(/^[0-9]{4}$/, 'OTP must be 4 digits'),
  podPhotoUrl: z.string().url().optional(),
});
export type VerifyOtpRequest = z.infer<typeof verifyOtpSchema>;

export const orderTrackingEventSchema = z.object({
  id: z.string().optional(),
  status: z.enum(orderStatuses),
  at: z.string(),
  note: z.string().nullable().optional(),
});
export type OrderTrackingEvent = z.infer<typeof orderTrackingEventSchema>;

export const orderTrackingSchema = z.object({
  orderId: z.string().uuid(),
  status: z.enum(orderStatuses),
  otpRequired: z.boolean(),
  estimatedArrival: z.string().nullable().optional(),
  events: z.array(orderTrackingEventSchema),
});
export type OrderTracking = z.infer<typeof orderTrackingSchema>;

export interface AdminOrderSummary {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  channel: SalesChannel;
  fulfillmentType: FulfillmentType;
  warehouseId: string;
  itemCount: number;
  totalAmount: Money;
  paymentStatus: string;
  deliveryDate: string | null;
  placedAt: string;
}

export interface AdminOrderDetail extends AdminOrderSummary {
  subtotal: Money;
  deliveryFee: Money;
  discount: Money;
  gstAmount: Money;
  deliverySlot: DeliverySlot | null;
  deliveryAddressId: string | null;
  otpRequired: boolean;
  cancellationReason: string | null;
  deliveredAt: string | null;
  items: Array<{
    id: string;
    productId: string;
    name: string;
    grade: ProduceGrade;
    qtyKg: string;
    fulfilledQtyKg?: string;
    unitPrice: Money;
    gstRate?: number;
    gstAmount?: Money;
    lineTotal: Money;
  }>;
}
