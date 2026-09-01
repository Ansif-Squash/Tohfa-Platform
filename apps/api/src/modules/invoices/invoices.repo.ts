import type { Executor } from "../../db/pool.js";
import type { InvoiceType, InvoiceStatus, Money } from "@tohfa/shared-types";
import type { InvoiceDetailResponse, InvoiceSummaryResponse, ListInvoicesQuery } from "./invoices.schema.js";

export interface InvoiceDbRow {
  id: string;
  invoice_number: string;
  invoice_type: InvoiceType;
  customer_id: string | null;
  farmer_id: string | null;
  order_id: string | null;
  purchase_order_id: string | null;
  payout_id: string | null;
  issue_date: string;
  fiscal_year: string;
  taxable_amount: string;
  cgst: string;
  sgst: string;
  igst: string;
  total_amount: string;
  gst_inclusive: boolean;
  place_of_supply: string | null;
  pdf_key: string | null;
  status: InvoiceStatus;
  issued_by: string | null;
  created_at: Date;
  updated_at: Date | null;
}

export interface InvoiceLineDbRow {
  id: string;
  invoice_id: string;
  line_no: number;
  description: string;
  hsn_code: string | null;
  qty: string;
  unit_price: string;
  gst_rate: string;
  taxable: string;
  tax: string;
  total: string;
  created_at: Date;
  updated_at: Date | null;
}

export interface CreateInvoiceInput {
  invoiceType: InvoiceType;
  customerId?: string | null | undefined;
  farmerId?: string | null | undefined;
  orderId?: string | null | undefined;
  purchaseOrderId?: string | null | undefined;
  payoutId?: string | null | undefined;
  issueDate?: string | undefined;
  fiscalYear: string;
  taxableAmount: Money;
  cgst: Money;
  sgst: Money;
  igst: Money;
  totalAmount: Money;
  gstInclusive: boolean;
  placeOfSupply?: string | null | undefined;
  status?: InvoiceStatus | undefined;
  issuedBy?: string | null | undefined;
  lines: Array<{
    lineNo: number;
    description: string;
    hsnCode?: string | null;
    qty: number;
    unitPrice: Money;
    gstRate: number;
    taxable: Money;
    tax: Money;
    total: Money;
  }>;
}

export interface InvoicesRepo {
  generateInvoiceNumber(db: Executor, fiscalYear: string, type: InvoiceType): Promise<string>;
  createInvoice(db: Executor, input: CreateInvoiceInput): Promise<InvoiceDetailResponse>;
  findById(db: Executor, id: string): Promise<InvoiceDetailResponse | null>;
  listInvoices(
    db: Executor,
    scope: { customerId?: string | null; farmerId?: string | null; all?: boolean },
    query: ListInvoicesQuery,
  ): Promise<{ items: InvoiceSummaryResponse[]; page: { nextCursor: string | null; hasMore: boolean } }>;
}

export const invoicesRepo: InvoicesRepo = {
  async generateInvoiceNumber(db: Executor, fiscalYear: string, type: InvoiceType): Promise<string> {
    const typePrefix =
      type === "SALE_RETAIL"
        ? "R"
        : type === "SALE_B2B"
          ? "B"
          : type === "PURCHASE_FARMER"
            ? "PF"
            : type === "PAYOUT"
              ? "PO"
              : "SUB";

    const countRes = await db.query<{ count: string }>(
      "SELECT count(*)::text AS count FROM invoices WHERE fiscal_year = $1",
      [fiscalYear],
    );
    const seq = (parseInt(countRes.rows[0]?.count ?? "0", 10) + 1).toString().padStart(6, "0");
    return "TOH/" + fiscalYear + "/" + typePrefix + "/" + seq;
  },

  async createInvoice(db: Executor, input: CreateInvoiceInput): Promise<InvoiceDetailResponse> {
    const invoiceNumber = await invoicesRepo.generateInvoiceNumber(db, input.fiscalYear, input.invoiceType);
    const issueDate = input.issueDate ?? new Date().toISOString().slice(0, 10);
    const status = input.status ?? "ISSUED";

    const invRes = await db.query<InvoiceDbRow>(
      "INSERT INTO invoices (" +
        "invoice_number, invoice_type, customer_id, farmer_id, order_id, " +
        "purchase_order_id, payout_id, issue_date, fiscal_year, taxable_amount, " +
        "cgst, sgst, igst, total_amount, gst_inclusive, place_of_supply, " +
        "status, issued_by" +
      ") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) RETURNING *",
      [
        invoiceNumber,
        input.invoiceType,
        input.customerId ?? null,
        input.farmerId ?? null,
        input.orderId ?? null,
        input.purchaseOrderId ?? null,
        input.payoutId ?? null,
        issueDate,
        input.fiscalYear,
        input.taxableAmount,
        input.cgst,
        input.sgst,
        input.igst,
        input.totalAmount,
        input.gstInclusive,
        input.placeOfSupply ?? null,
        status,
        input.issuedBy ?? null,
      ],
    );

    const invoice = invRes.rows[0]!;

    const insertedLines: InvoiceDetailResponse["lines"] = [];
    for (const line of input.lines) {
      const lineRes = await db.query<InvoiceLineDbRow>(
        "INSERT INTO invoice_lines (" +
          "invoice_id, line_no, description, hsn_code, qty, unit_price, " +
          "gst_rate, taxable, tax, total" +
        ") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *",
        [
          invoice.id,
          line.lineNo,
          line.description,
          line.hsnCode ?? null,
          line.qty,
          line.unitPrice,
          line.gstRate,
          line.taxable,
          line.tax,
          line.total,
        ],
      );
      const row = lineRes.rows[0]!;
      insertedLines.push({
        id: row.id,
        lineNo: row.line_no,
        description: row.description,
        hsnCode: row.hsn_code,
        qty: parseFloat(row.qty),
        unitPrice: row.unit_price as Money,
        gstRate: parseFloat(row.gst_rate),
        taxable: row.taxable as Money,
        tax: row.tax as Money,
        total: row.total as Money,
      });
    }

    const isGstApplicable = input.invoiceType === "SALE_B2B" || parseFloat(invoice.taxable_amount) > 0;

    return {
      id: invoice.id,
      invoiceNumber: invoice.invoice_number,
      invoiceType: invoice.invoice_type,
      orderId: invoice.order_id,
      purchaseOrderId: invoice.purchase_order_id,
      payoutId: invoice.payout_id,
      issueDate: invoice.issue_date,
      taxableAmount: invoice.taxable_amount as Money,
      totalAmount: invoice.total_amount as Money,
      gstApplicable: isGstApplicable,
      status: invoice.status,
      pdfUrl: "/v1/invoices/" + invoice.id + "/download",
      placeOfSupply: invoice.place_of_supply,
      cgst: invoice.cgst as Money,
      sgst: invoice.sgst as Money,
      igst: invoice.igst as Money,
      gstInclusive: invoice.gst_inclusive,
      lines: insertedLines,
    };
  },

  async findById(db: Executor, id: string): Promise<InvoiceDetailResponse | null> {
    const invRes = await db.query<InvoiceDbRow>(
      "SELECT * FROM invoices WHERE id = $1",
      [id],
    );
    const invoice = invRes.rows[0];
    if (!invoice) return null;

    const linesRes = await db.query<InvoiceLineDbRow>(
      "SELECT * FROM invoice_lines WHERE invoice_id = $1 ORDER BY line_no ASC",
      [id],
    );

    const lines: InvoiceDetailResponse["lines"] = linesRes.rows.map((row) => ({
      id: row.id,
      lineNo: row.line_no,
      description: row.description,
      hsnCode: row.hsn_code,
      qty: parseFloat(row.qty),
      unitPrice: row.unit_price as Money,
      gstRate: parseFloat(row.gst_rate),
      taxable: row.taxable as Money,
      tax: row.tax as Money,
      total: row.total as Money,
    }));

    const isGstApplicable = invoice.invoice_type === "SALE_B2B" || parseFloat(invoice.taxable_amount) > 0;

    return {
      id: invoice.id,
      invoiceNumber: invoice.invoice_number,
      invoiceType: invoice.invoice_type,
      orderId: invoice.order_id,
      purchaseOrderId: invoice.purchase_order_id,
      payoutId: invoice.payout_id,
      issueDate: invoice.issue_date,
      taxableAmount: invoice.taxable_amount as Money,
      totalAmount: invoice.total_amount as Money,
      gstApplicable: isGstApplicable,
      status: invoice.status,
      pdfUrl: "/v1/invoices/" + invoice.id + "/download",
      placeOfSupply: invoice.place_of_supply,
      cgst: invoice.cgst as Money,
      sgst: invoice.sgst as Money,
      igst: invoice.igst as Money,
      gstInclusive: invoice.gst_inclusive,
      lines,
    };
  },

  async listInvoices(
    db: Executor,
    scope: { customerId?: string | null; farmerId?: string | null; all?: boolean },
    query: ListInvoicesQuery,
  ): Promise<{ items: InvoiceSummaryResponse[]; page: { nextCursor: string | null; hasMore: boolean } }> {
    const conditions: string[] = [];
    const values: unknown[] = [];

    if (!scope.all) {
      if (scope.customerId) {
        values.push(scope.customerId);
        conditions.push("customer_id = $" + values.length);
      } else if (scope.farmerId) {
        values.push(scope.farmerId);
        conditions.push("farmer_id = $" + values.length);
      } else {
        return { items: [], page: { nextCursor: null, hasMore: false } };
      }
    }

    if (query.type) {
      values.push(query.type);
      conditions.push("invoice_type = $" + values.length);
    }

    if (query.fromDate) {
      values.push(query.fromDate);
      conditions.push("issue_date >= $" + values.length);
    }

    if (query.toDate) {
      values.push(query.toDate);
      conditions.push("issue_date <= $" + values.length);
    }

    if (query.cursor) {
      values.push(query.cursor);
      conditions.push("created_at < $" + values.length);
    }

    const whereClause = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";
    const limitPlusOne = query.limit + 1;
    values.push(limitPlusOne);

    const result = await db.query<InvoiceDbRow>(
      "SELECT * FROM invoices " +
      whereClause +
      " ORDER BY created_at DESC LIMIT $" + values.length,
      values,
    );

    const hasMore = result.rows.length > query.limit;
    const rows = hasMore ? result.rows.slice(0, query.limit) : result.rows;
    const nextCursor = hasMore && rows.length > 0 ? rows[rows.length - 1]!.created_at.toISOString() : null;

    const items: InvoiceSummaryResponse[] = rows.map((r) => ({
      id: r.id,
      invoiceNumber: r.invoice_number,
      invoiceType: r.invoice_type,
      orderId: r.order_id,
      purchaseOrderId: r.purchase_order_id,
      payoutId: r.payout_id,
      issueDate: r.issue_date,
      taxableAmount: r.taxable_amount as Money,
      totalAmount: r.total_amount as Money,
      gstApplicable: r.invoice_type === "SALE_B2B" || parseFloat(r.taxable_amount) > 0,
      status: r.status,
      pdfUrl: "/v1/invoices/" + r.id + "/download",
    }));

    return {
      items,
      page: {
        nextCursor,
        hasMore,
      },
    };
  },
};
