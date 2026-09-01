import { z } from 'zod';

// ---------------------------------------------------------------------------
// Shared
// ---------------------------------------------------------------------------

export const payoutModes = ['UPI', 'IMPS', 'NEFT'] as const;
export type PayoutMode = (typeof payoutModes)[number];

export const payoutStatuses = [
  'REQUESTED',
  'PENDING_APPROVAL',
  'APPROVED',
  'PROCESSING',
  'PAID',
  'FAILED',
  'REVERSED',
] as const;
export type PayoutStatus = (typeof payoutStatuses)[number];

export const ageBuckets = ['D0_7', 'D8_15', 'D16_30', 'D30_PLUS'] as const;
export type AgeBucket = (typeof ageBuckets)[number];

// ---------------------------------------------------------------------------
// GET /admin/payout-dues
// ---------------------------------------------------------------------------

export const payoutDuesQuerySchema = z.object({
  farmerId: z.string().uuid().optional(),
  ageBucket: z.enum(ageBuckets).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  cursor: z.string().optional(),
});
export type PayoutDuesQuery = z.infer<typeof payoutDuesQuerySchema>;

export interface PayoutDue {
  id: string;
  farmerId: string;
  tohfaFarmerId: string | null;
  farmerName: string;
  purchaseOrderId: string;
  goodsReceiptId: string | null;
  amountDue: string;
  dueSince: string;
  ageDays: number;
  ageBucket: AgeBucket;
}

export interface PayoutDuesTotals {
  totalDue: string;
  farmerCount: number;
}

// ---------------------------------------------------------------------------
// POST /admin/payouts
// ---------------------------------------------------------------------------

export const createPayoutSchema = z.object({
  farmerId: z.string().uuid(),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a decimal string e.g. "500.00"'),
  mode: z.enum(payoutModes),
  bankAccountId: z.string().uuid().optional(),
  dueIds: z.array(z.string().uuid()).optional(),
  remarks: z.string().max(300).optional(),
});
export type CreatePayoutInput = z.infer<typeof createPayoutSchema>;

// ---------------------------------------------------------------------------
// POST /admin/payouts/{id}/approve
// ---------------------------------------------------------------------------

export const approvePayoutSchema = z.object({
  note: z.string().max(500).optional(),
});
export type ApprovePayoutInput = z.infer<typeof approvePayoutSchema>;

// ---------------------------------------------------------------------------
// Response shape
// ---------------------------------------------------------------------------

export interface PayoutResponse {
  id: string;
  payoutNumber: string;
  farmerId: string;
  farmerName: string;
  amount: string;
  mode: PayoutMode;
  status: PayoutStatus;
  requiresDualApproval: boolean;
  initiatedBy: string;
  approvedBy: string[];
  approvedAt: string | null;
  gatewayPayoutId: string | null;
  failureReason: string | null;
  paidAt: string | null;
  remarks: string | null;
  createdAt: string;
  updatedAt: string | null;
}
