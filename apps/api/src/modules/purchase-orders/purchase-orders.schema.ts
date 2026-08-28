import { z } from 'zod';

export const poStatuses = [
  'ISSUED',
  'PARTIALLY_RECEIVED',
  'FULLY_RECEIVED',
  'CANCELLED',
  'CLOSED',
] as const;
export type PoStatus = (typeof poStatuses)[number];

export const produceGrades = ['GRADE_1', 'GRADE_2', 'GRADE_3', 'REJECT'] as const;
export type ProduceGrade = (typeof produceGrades)[number];

export const purchaseOrderIdParams = z
  .object({
    id: z.string().uuid('Purchase Order id must be a valid UUID'),
  })
  .strict();
export type PurchaseOrderIdParams = z.infer<typeof purchaseOrderIdParams>;

export const listPurchaseOrdersQuery = z
  .object({
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: z.enum(poStatuses).optional(),
    warehouseId: z.string().uuid().optional(),
  })
  .strict();
export type ListPurchaseOrdersQuery = z.infer<typeof listPurchaseOrdersQuery>;

export const purchaseOrderResponse = z.object({
  id: z.string().uuid(),
  poNumber: z.string(),
  farmerId: z.string().uuid(),
  listingId: z.string().uuid(),
  warehouseId: z.string().uuid(),
  cropId: z.string().uuid(),
  grade: z.enum(produceGrades),
  quantityKg: z.string(),
  pricePerKg: z.string(),
  totalAmount: z.string(),
  status: z.enum(poStatuses),
  expectedDeliveryDate: z.string().nullable().optional(),
  issuedAt: z.string(),
});
export type PurchaseOrderResponse = z.infer<typeof purchaseOrderResponse>;

export const goodsReceiptSummary = z.object({
  id: z.string().uuid(),
  grnNumber: z.string(),
  purchaseOrderId: z.string().uuid(),
  warehouseId: z.string().uuid(),
  grossQtyKg: z.string(),
  acceptedQtyKg: z.string().optional(),
  rejectedQtyKg: z.string().optional(),
  status: z.string(),
  receivedAt: z.string(),
});
export type GoodsReceiptSummary = z.infer<typeof goodsReceiptSummary>;

export const purchaseOrderDetailResponse = purchaseOrderResponse.extend({
  farmerName: z.string().optional(),
  tohfaFarmerId: z.string().optional(),
  receivedQtyKg: z.string().optional(),
  goodsReceipts: z.array(goodsReceiptSummary).default([]),
});
export type PurchaseOrderDetailResponse = z.infer<typeof purchaseOrderDetailResponse>;

export const listPurchaseOrdersResponse = z.object({
  items: z.array(purchaseOrderResponse),
  page: z.object({
    nextCursor: z.string().nullable(),
    hasMore: z.boolean(),
  }),
});
export type ListPurchaseOrdersResponse = z.infer<typeof listPurchaseOrdersResponse>;
