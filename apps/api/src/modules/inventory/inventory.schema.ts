import { z } from 'zod';

export const produceGrades = ['GRADE_1', 'GRADE_2', 'GRADE_3', 'REJECT'] as const;
export type ProduceGrade = (typeof produceGrades)[number];

export const batchStatuses = ['ACTIVE', 'DEPLETED', 'EXPIRED', 'WRITTEN_OFF'] as const;
export type BatchStatus = (typeof batchStatuses)[number];

export const stockMovementTypes = [
  'RECEIPT',
  'SALE',
  'TRANSFER_OUT',
  'TRANSFER_IN',
  'ADJUSTMENT',
  'WASTAGE',
  'RETURN_IN',
  'RESERVATION',
  'RELEASE',
] as const;
export type StockMovementType = (typeof stockMovementTypes)[number];

export const batchIdParams = z
  .object({
    id: z.string().uuid('Batch id must be a UUID'),
  })
  .strict();
export type BatchIdParams = z.infer<typeof batchIdParams>;

export const listBatchesQuery = z
  .object({
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    warehouseId: z.string().uuid().optional(),
    cropId: z.string().uuid().optional(),
    grade: z.enum(produceGrades).optional(),
    status: z.enum(batchStatuses).optional(),
  })
  .strict();
export type ListBatchesQuery = z.infer<typeof listBatchesQuery>;

export const listStockLedgerQuery = z
  .object({
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    batchId: z.string().uuid().optional(),
    warehouseId: z.string().uuid().optional(),
    txnType: z.enum(stockMovementTypes).optional(),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
  })
  .strict();
export type ListStockLedgerQuery = z.infer<typeof listStockLedgerQuery>;

export const batchSchema = z.object({
  id: z.string().uuid(),
  batchCode: z.string(),
  warehouseId: z.string().uuid(),
  cropId: z.string().uuid(),
  cropName: z.string().optional(),
  grade: z.enum(produceGrades),
  goodsReceiptId: z.string().uuid().nullable(),
  sourceFarmerId: z.string().uuid().nullable(),
  qtyReceivedKg: z.string(),
  qtyAvailableKg: z.string(),
  qtyReservedKg: z.string().optional(),
  costPerKg: z.string().nullable().optional(),
  storageLocation: z.string().nullable(),
  receivedOn: z.string(),
  expiryOn: z.string().nullable(),
  status: z.enum(batchStatuses),
});
export type BatchView = z.infer<typeof batchSchema>;

export const stockLedgerEntrySchema = z.object({
  id: z.string().uuid(),
  batchId: z.string().uuid(),
  warehouseId: z.string().uuid(),
  txnType: z.enum(stockMovementTypes),
  qtyDeltaKg: z.string(),
  balanceAfterKg: z.string(),
  refType: z.string().nullable(),
  refId: z.string().uuid().nullable(),
  performedBy: z.string().uuid().nullable(),
  performedAt: z.string(),
  remarks: z.string().nullable(),
});
export type StockLedgerEntryView = z.infer<typeof stockLedgerEntrySchema>;

export interface CreateBatchInput {
  batchCode: string;
  warehouseId: string;
  cropId: string;
  grade: ProduceGrade;
  sourceFarmerId: string;
  goodsReceiptId?: string | null;
  qtyReceivedKg: string;
  costPerKg?: string | null;
  storageLocation?: string | null;
  receivedOn?: string;
  expiryOn?: string | null;
}

export interface RecordMovementInput {
  batchId: string;
  warehouseId?: string;
  movementType: StockMovementType;
  qtyDeltaKg: string;
  refType?: string | null;
  refId?: string | null;
  remarks?: string | null;
  performedBy?: string | null;
}

export interface PageMeta {
  nextCursor: string | null;
  hasMore: boolean;
}
