import { z } from 'zod';
import type { InvoiceType, InvoiceStatus, Money } from '@tohfa/shared-types';

export const listInvoicesQuery = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: z.enum(['SALE_RETAIL', 'SALE_B2B', 'PURCHASE_FARMER', 'PAYOUT', 'SUBSCRIPTION']).optional(),
  fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD').optional(),
  toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD').optional(),
});
export type ListInvoicesQuery = z.infer<typeof listInvoicesQuery>;

export const invoiceIdParams = z.object({
  id: z.string().uuid(),
});
export type InvoiceIdParams = z.infer<typeof invoiceIdParams>;

export const downloadInvoiceQuery = z.object({
  redirect: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .transform((val) => val === true || val === 'true')
    .default(false),
  token: z.string().optional(),
  expires: z.coerce.number().int().optional(),
});
export type DownloadInvoiceQuery = z.infer<typeof downloadInvoiceQuery>;

export interface InvoiceLineItem {
  id?: string;
  lineNo: number;
  description: string;
  hsnCode: string | null;
  qty: number;
  unitPrice: Money;
  gstRate: number;
  taxable: Money;
  tax: Money;
  total: Money;
}

export interface InvoiceSummaryResponse {
  id: string;
  invoiceNumber: string;
  invoiceType: InvoiceType;
  orderId: string | null;
  purchaseOrderId: string | null;
  payoutId?: string | null;
  issueDate: string;
  taxableAmount: Money;
  totalAmount: Money;
  gstApplicable: boolean;
  status: InvoiceStatus;
  pdfUrl: string | null;
}

export interface InvoiceDetailResponse extends InvoiceSummaryResponse {
  placeOfSupply: string | null;
  cgst: Money;
  sgst: Money;
  igst: Money;
  gstInclusive: boolean;
  lines: InvoiceLineItem[];
}
