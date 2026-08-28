import { z } from 'zod';

export const allocationChannels = ['ONLINE', 'LIVE_MARKET', 'RESERVE', 'BUFFER'] as const;
export type AllocationChannel = (typeof allocationChannels)[number];

export const listAllocationsQuery = z
  .object({
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    warehouseId: z.string().uuid().optional(),
    allocationDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')
      .optional(),
    channel: z.enum(allocationChannels).optional(),
  })
  .strict();
export type ListAllocationsQuery = z.infer<typeof listAllocationsQuery>;

export const channelPercentageItem = z.object({
  channel: z.enum(allocationChannels),
  percentage: z.number().min(0).max(100),
});

export const updateAllocationConfigBody = z
  .object({
    effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
    cropId: z.string().uuid().optional().nullable(),
    channels: z.array(channelPercentageItem).length(4, 'Must provide percentages for all 4 channels'),
  })
  .strict();
export type UpdateAllocationConfigBody = z.infer<typeof updateAllocationConfigBody>;

export const allocationSchema = z.object({
  id: z.string().uuid(),
  batchId: z.string().uuid().optional(),
  warehouseId: z.string().uuid(),
  cropId: z.string().uuid(),
  cropName: z.string().optional(),
  grade: z.string().optional(),
  allocationDate: z.string(),
  channel: z.enum(allocationChannels),
  allocatedQtyKg: z.string(),
  consumedQtyKg: z.string(),
  reservedQtyKg: z.string().optional(),
  availableQtyKg: z.string().optional(),
  computedBy: z.enum(['AUTO', 'MANUAL']),
  overriddenBy: z.string().uuid().nullable().optional(),
});
export type AllocationView = z.infer<typeof allocationSchema>;

export const allocationConfigSchema = z.object({
  effectiveFrom: z.string(),
  cropId: z.string().uuid().nullable().optional(),
  channels: z.array(channelPercentageItem),
  setBy: z.string().uuid().nullable().optional(),
  setAt: z.string().optional(),
});
export type AllocationConfigView = z.infer<typeof allocationConfigSchema>;

export interface ChannelAllocationRow {
  id: string;
  batch_id: string;
  warehouse_id: string;
  crop_id: string;
  crop_name?: string | null;
  grade: string;
  channel: AllocationChannel;
  allocated_qty: string;
  consumed_qty: string;
  reserved_qty: string;
  available_qty: string;
  computed_by: 'AUTO' | 'MANUAL';
  overridden_by: string | null;
  created_at: Date;
}

export interface EffectivePercentage {
  channel: AllocationChannel;
  percentage: number;
}
