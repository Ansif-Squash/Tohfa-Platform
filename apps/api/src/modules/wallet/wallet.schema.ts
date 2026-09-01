import { z } from 'zod';

export const walletOwnerTypes = ['CUSTOMER', 'FARMER'] as const;
export type WalletOwnerType = (typeof walletOwnerTypes)[number];

export const walletStatuses = ['ACTIVE', 'FROZEN'] as const;
export type WalletStatus = (typeof walletStatuses)[number];

export const walletTxnTypes = [
  'TOPUP_CASH',
  'TOPUP_DIGITAL',
  'ORDER_DEBIT',
  'ORDER_REFUND',
  'PAYOUT_DEBIT',
  'SALE_CREDIT',
  'SUBSCRIPTION_DEBIT',
  'ADJUSTMENT',
] as const;
export type WalletTxnType = (typeof walletTxnTypes)[number];

/** Matches Money string format in OpenAPI. */
const moneySchema = z.string().regex(/^-?[0-9]{1,10}(\.[0-9]{1,2})?$/);

/** Response representation of a Wallet. Keep aligned with docs/openapi.yaml. */
export const walletResponse = z
  .object({
    id: z.string().uuid(),
    ownerType: z.enum(walletOwnerTypes),
    balance: moneySchema,
    currency: z.literal('INR'),
    status: z.enum(walletStatuses),
    updatedAt: z.string().nullable().optional(),
  })
  .strict();
export type WalletResponse = z.infer<typeof walletResponse>;

/** Response representation of a single transaction entry. */
export const walletTransactionResponse = z
  .object({
    id: z.string().uuid(),
    walletId: z.string().uuid(),
    txnType: z.enum(walletTxnTypes),
    amount: moneySchema, // Signed: negative for DEBIT
    balanceAfter: moneySchema,
    refType: z.string().nullable(),
    refId: z.string().uuid().nullable(),
    fiscalCashTag: z.string().nullable(),
    warehouseId: z.string().uuid().nullable(),
    performedBy: z.string().uuid().nullable(),
    performedAt: z.string(),
    remarks: z.string().nullable(),
  })
  .strict();
export type WalletTransactionResponse = z.infer<typeof walletTransactionResponse>;

/** GET /v1/wallets/me/transactions query parameters */
export const listMyTransactionsQuery = z
  .object({
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    type: z.enum(walletTxnTypes).optional(),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
    tab: z.enum(['all', 'credits', 'debits', 'refunds']).default('all'),
  })
  .strict();
export type ListMyTransactionsQuery = z.infer<typeof listMyTransactionsQuery>;

export const listTransactionsResponse = z
  .object({
    items: z.array(walletTransactionResponse),
    page: z.object({
      nextCursor: z.string().nullable(),
      hasMore: z.boolean(),
    }),
  })
  .strict();
export type ListTransactionsResponse = z.infer<typeof listTransactionsResponse>;
