import { api } from './client';

export type WalletTransactionType =
  | 'TOPUP_CASH'
  | 'TOPUP_DIGITAL'
  | 'ORDER_DEBIT'
  | 'ORDER_REFUND'
  | 'PAYOUT_DEBIT'
  | 'SALE_CREDIT'
  | 'SUBSCRIPTION_DEBIT'
  | 'ADJUSTMENT';

export interface Wallet {
  id: string;
  ownerType: 'FARMER' | 'CUSTOMER';
  balance: string;
  currency: string;
  status: 'ACTIVE' | 'FROZEN';
  updatedAt: string;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  type: WalletTransactionType;
  amount: string;
  balanceAfter: string;
  referenceType?: string | null;
  referenceId?: string | null;
  description?: string | null;
  createdAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceType: 'SALE_RETAIL' | 'SALE_B2B' | 'PURCHASE_FARMER' | 'PAYOUT' | 'SUBSCRIPTION';
  totalAmount: string;
  status: 'ISSUED' | 'PAID' | 'VOID';
  issuedAt: string;
  pdfUrl?: string | null;
}

export interface PageMeta {
  nextCursor: string | null;
  hasMore: boolean;
}

export interface WalletQueryParams {
  type?: WalletTransactionType | undefined;
  cursor?: string | undefined;
  limit?: number | undefined;
}


/**
 * BR-36: Build own-data wallet query URL with explicit filter parameters.
 * No foreign farmerId parameters are allowed.
 */
export function buildWalletQueryUrl(params?: WalletQueryParams): string {
  const parts: string[] = [];
  if (params?.type) parts.push(`type=${encodeURIComponent(params.type)}`);
  if (params?.cursor) parts.push(`cursor=${encodeURIComponent(params.cursor)}`);
  if (params?.limit) parts.push(`limit=${params.limit}`);

  if (parts.length === 0) return '/wallets/me/transactions';
  return `/wallets/me/transactions?${parts.join('&')}`;
}

/**
 * Format string money representation without float conversion.
 * Avoids 0.1 + 0.2 float inaccuracies (CLAUDE.md §2.2).
 */
export function formatMoneyAmount(amount: string | number): string {
  const str = String(amount);
  const parts = str.split('.');
  const whole = parts[0] ?? '0';
  const fraction = parts[1] ?? '00';
  const paddedFraction = fraction.padEnd(2, '0').slice(0, 2);


  // Format integer portion with Indian numbering or standard commas
  const cleanWhole = whole.replace(/[^0-9-]/g, '') || '0';
  const isNegative = cleanWhole.startsWith('-');
  const absWhole = isNegative ? cleanWhole.slice(1) : cleanWhole;

  let lastThree = absWhole.slice(-3);
  const otherNumbers = absWhole.slice(0, -3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formattedWhole =
    otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;

  return `${isNegative ? '-' : ''}₹${formattedWhole}.${paddedFraction}`;
}

/**
 * Fetch own wallet balance.
 * x-permission: wallet.own.view (BR-36)
 */
export async function getMyWallet(): Promise<Wallet> {
  return api.get<Wallet>('/wallets/me');
}

/**
 * Fetch paged ledger transactions with query parameter filtering.
 * Tabs re-query with ?type= instead of filtering client side.
 */
export async function getMyWalletTransactions(
  params?: WalletQueryParams,
): Promise<{ items: WalletTransaction[]; page: PageMeta }> {
  const url = buildWalletQueryUrl(params);
  return api.get<{ items: WalletTransaction[]; page: PageMeta }>(url);
}

/**
 * List own invoices.
 */
export async function getMyInvoices(): Promise<{ items: Invoice[]; page: PageMeta }> {
  return api.get<{ items: Invoice[]; page: PageMeta }>('/invoices');
}

/**
 * Request download link for invoice PDF.
 */
export async function downloadInvoice(id: string): Promise<{ downloadUrl: string }> {
  return api.get<{ downloadUrl: string }>(`/invoices/${id}/download`);
}
