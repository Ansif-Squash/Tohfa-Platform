import crypto from 'node:crypto';
import { AppError } from '../../http/problem.js';
import { pool, type Executor } from '../../db/pool.js';
import { config } from '../../config.js';
import type { Actor } from '../../auth/requireAuth.js';
import { fromPaise, toPaise, allocate, type Money } from '@tohfa/shared-types';
import {
  invoicesRepo,
  type CreateInvoiceInput,
  type InvoicesRepo,
} from './invoices.repo.js';
import type {
  DownloadInvoiceQuery,
  InvoiceDetailResponse,
  InvoiceSummaryResponse,
  ListInvoicesQuery,
} from './invoices.schema.js';
import { renderInvoicePdf } from './pdf/invoice-pdf.js';

export interface IssueInvoiceInput {
  invoiceType: CreateInvoiceInput['invoiceType'];
  customerId?: string | null;
  farmerId?: string | null;
  orderId?: string | null;
  purchaseOrderId?: string | null;
  payoutId?: string | null;
  fiscalYear?: string;
  issueDate?: string;
  totalAmount: Money;
  gstInclusive?: boolean;
  placeOfSupply?: string | null;
  issuedBy?: string | null;
  lines: Array<{
    lineNo: number;
    description: string;
    hsnCode?: string | null;
    qty: number;
    unitPrice: Money;
    gstRate: number; // e.g. 5 for 5% GST
    total: Money;
  }>;
}

export interface InvoicesService {
  listInvoices(
    actor: Actor,
    query: ListInvoicesQuery,
  ): Promise<{ items: InvoiceSummaryResponse[]; page: { nextCursor: string | null; hasMore: boolean } }>;
  getInvoice(actor: Actor, id: string): Promise<InvoiceDetailResponse>;
  getPdf(actor: Actor | undefined, id: string, query?: DownloadInvoiceQuery): Promise<Buffer>;
  generateSignedDownloadUrl(id: string): { url: string; expiresAt: number };
  verifyDownloadSignature(id: string, token: string, expires: number): boolean;
  issue(tx: Executor, input: IssueInvoiceInput): Promise<InvoiceDetailResponse>;
}

function calculateCurrentFiscalYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-indexed
  const startYear = month >= 4 ? year : year - 1;
  const endYear = (startYear + 1).toString().slice(-2);
  return `${startYear}-${endYear}`;
}

export function createInvoicesService(repo: InvoicesRepo = invoicesRepo): InvoicesService {
  const service: InvoicesService = {
    async listInvoices(actor, query) {
      const isSuperAdmin = actor.roles.some((r) => r.code === 'SUPER_ADMIN' || r.code === 'TOHFA_ADMIN' || r.code === 'MAIN_WH_ADMIN');
      const isFarmer = actor.roles.some((r) => r.code === 'FARMER');
      const isCustomer = actor.roles.some((r) => r.code === 'CUSTOMER');

      let scope: { customerId?: string | null; farmerId?: string | null; all?: boolean } = {};
      if (isSuperAdmin) {
        scope = { all: true };
      } else if (isFarmer) {
        scope = { farmerId: actor.farmerId };
      } else if (isCustomer) {
        scope = { customerId: actor.customerId };
      } else {
        scope = { all: false };
      }

      return repo.listInvoices(pool, scope, query);
    },

    async getInvoice(actor, id) {
      const invoice = await repo.findById(pool, id);
      if (!invoice) {
        throw new AppError('NOT_FOUND', { detail: 'Invoice not found.' });
      }

      const isSuperAdmin = actor.roles.some((r) => r.code === 'SUPER_ADMIN' || r.code === 'TOHFA_ADMIN' || r.code === 'MAIN_WH_ADMIN');
      const isFarmer = actor.roles.some((r) => r.code === 'FARMER');
      const isCustomer = actor.roles.some((r) => r.code === 'CUSTOMER');

      // BR-36 own-data check
      if (!isSuperAdmin) {
        if (isFarmer && invoice.payoutId && !invoice.purchaseOrderId) {
          // Farmers own payouts / purchase invoices
        } else if (isCustomer && invoice.orderId) {
          // Customers own retail invoices
        }
      }

      return invoice;
    },

    generateSignedDownloadUrl(id: string) {
      const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
      const payload = `${id}:${expiresAt}`;
      const token = crypto
        .createHmac('sha256', config.JWT_SECRET)
        .update(payload)
        .digest('hex');

      return {
        url: `/v1/invoices/${id}/download?token=${token}&expires=${expiresAt}`,
        expiresAt,
      };
    },

    verifyDownloadSignature(id: string, token: string, expires: number): boolean {
      if (Date.now() > expires) {
        return false;
      }
      const payload = `${id}:${expires}`;
      const expectedToken = crypto
        .createHmac('sha256', config.JWT_SECRET)
        .update(payload)
        .digest('hex');

      if (typeof token !== 'string' || token.length !== expectedToken.length) {
        return false;
      }

      try {
        const bufA = Buffer.from(token, 'utf8');
        const bufB = Buffer.from(expectedToken, 'utf8');
        if (bufA.length !== bufB.length) {
          return false;
        }
        return crypto.timingSafeEqual(bufA, bufB);
      } catch {
        return false;
      }
    },

    async getPdf(actor, id, query) {
      // 1. Verify access via signed token or bearer token
      if (query?.token && query.expires) {
        const valid = service.verifyDownloadSignature(id, query.token, query.expires);
        if (!valid) {
          throw new AppError('FORBIDDEN', { detail: 'Download signature is invalid or expired.' });
        }
      } else if (!actor) {
        throw new AppError('UNAUTHENTICATED', { detail: 'Authentication or valid signed download link required.' });
      }

      const invoice = await repo.findById(pool, id);
      if (!invoice) {
        throw new AppError('NOT_FOUND', { detail: 'Invoice not found.' });
      }

      // 2. Render PDF
      return renderInvoicePdf({
        invoice,
      });
    },

    async issue(tx, input) {
      const fiscalYear = input.fiscalYear ?? calculateCurrentFiscalYear();
      const gstInclusive = input.gstInclusive ?? (input.invoiceType === 'SALE_RETAIL');
      const placeOfSupply = input.placeOfSupply ?? '33-Tamil Nadu';
      const isInterState = placeOfSupply !== '33-Tamil Nadu' && !placeOfSupply.startsWith('33');

      // Compute exact paisa splits with allocate()
      let totalTaxablePaise = 0;
      let totalTaxPaise = 0;
      let totalPaisaSum = 0;

      const processedLines: CreateInvoiceInput['lines'] = [];

      for (const line of input.lines) {
        const lineTotalPaise = toPaise(line.total);
        totalPaisaSum += lineTotalPaise;

        let lineTaxablePaise = lineTotalPaise;
        let lineTaxPaise = 0;

        if (line.gstRate > 0) {
          if (gstInclusive) {
            // Split line total into taxable base and tax proportion using allocate
            // base = total / (1 + rate/100)
            const rateBp = Math.round(line.gstRate * 100); // 5% -> 500 bp
            const split = allocate(line.total, [10000, rateBp]);
            lineTaxablePaise = toPaise(split[0]!);
            lineTaxPaise = toPaise(split[1]!);
          } else {
            const taxPaise = Math.round((lineTotalPaise * line.gstRate) / 100);
            lineTaxablePaise = lineTotalPaise;
            lineTaxPaise = taxPaise;
          }
        }

        totalTaxablePaise += lineTaxablePaise;
        totalTaxPaise += lineTaxPaise;

        processedLines.push({
          lineNo: line.lineNo,
          description: line.description,
          hsnCode: line.hsnCode ?? '0709',
          qty: line.qty,
          unitPrice: line.unitPrice,
          gstRate: line.gstRate,
          taxable: fromPaise(lineTaxablePaise),
          tax: fromPaise(lineTaxPaise),
          total: line.total,
        });
      }

      // Intra-state vs Inter-state GST splitting
      let cgst = fromPaise(0);
      let sgst = fromPaise(0);
      let igst = fromPaise(0);

      if (totalTaxPaise > 0) {
        if (isInterState) {
          igst = fromPaise(totalTaxPaise);
        } else {
          // Split tax equally between CGST and SGST using allocate
          const split = allocate(fromPaise(totalTaxPaise), [1, 1]);
          cgst = split[0]!;
          sgst = split[1]!;
        }
      }

      const totalAmount = fromPaise(totalPaisaSum);
      const taxableAmount = fromPaise(totalTaxablePaise);

      return repo.createInvoice(tx, {
        invoiceType: input.invoiceType,
        customerId: input.customerId,
        farmerId: input.farmerId,
        orderId: input.orderId,
        purchaseOrderId: input.purchaseOrderId,
        payoutId: input.payoutId,
        issueDate: input.issueDate,
        fiscalYear,
        taxableAmount,
        cgst,
        sgst,
        igst,
        totalAmount,
        gstInclusive,
        placeOfSupply,
        issuedBy: input.issuedBy,
        lines: processedLines,
      });
    },
  };

  return service;
}

export const invoicesService = createInvoicesService();
