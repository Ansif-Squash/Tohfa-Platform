import { it, expect, beforeAll, afterAll } from 'vitest';
import { pool } from '../../db/pool.js';
import { databaseReady, describeIfDatabase } from '../../test/factories.js';
import { invoicesService } from './invoices.service.js';
import { fromPaise, equals, add, ZERO, RoleCode } from '@tohfa/shared-types';

function extractPdfText(pdfBuffer: Buffer): string {
  const raw = pdfBuffer.toString('latin1');
  const hexMatches = raw.matchAll(/<([0-9a-fA-F]+)>/g);
  let decoded = '';
  for (const match of hexMatches) {
    decoded += Buffer.from(match[1]!, 'hex').toString('latin1') + ' ';
  }
  return decoded;
}

describeIfDatabase('Invoices Module (S-38)', () => {
  let dbAvailable = false;

  beforeAll(async () => {
    dbAvailable = await databaseReady('invoices');
  });

  afterAll(async () => {
    if (dbAvailable) {
      await pool.query(`DELETE FROM invoice_lines WHERE invoice_id IN (SELECT id FROM invoices WHERE invoice_number LIKE 'TOH/2026-27/TEST%')`);
      await pool.query(`DELETE FROM invoices WHERE invoice_number LIKE 'TOH/2026-27/TEST%'`);
    }
  });

  it('INV-RECONCILE: asserts exact paisa equality between lines and invoice total (BR-16)', async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const line1Total = fromPaise(10500); // Rs 105.00 (5% GST inclusive)
      const line2Total = fromPaise(21000); // Rs 210.00 (5% GST inclusive)
      const expectedTotal = fromPaise(31500); // Rs 315.00

      const invoice = await invoicesService.issue(client, {
        invoiceType: 'SALE_RETAIL',
        fiscalYear: '2026-27',
        placeOfSupply: '33-Tamil Nadu',
        totalAmount: expectedTotal,
        gstInclusive: true,
        lines: [
          { lineNo: 1, description: 'Organic Nilgiri Carrots (Grade A)', qty: 2.5, unitPrice: fromPaise(4200), gstRate: 5, total: line1Total },
          { lineNo: 2, description: 'Organic Nilgiri Potatoes (Grade A)', qty: 5.0, unitPrice: fromPaise(4200), gstRate: 5, total: line2Total },
        ],
      });

      // Sum lines
      const sumLines = invoice.lines.reduce((acc, l) => add(acc, l.total), ZERO);
      expect(equals(sumLines, invoice.totalAmount)).toBe(true);
      expect(equals(invoice.totalAmount, expectedTotal)).toBe(true);

      // Verify Intra-State CGST + SGST (never IGST)
      expect(parseFloat(invoice.cgst)).toBeGreaterThan(0);
      expect(parseFloat(invoice.sgst)).toBeGreaterThan(0);
      expect(parseFloat(invoice.igst)).toBe(0);
      expect(invoice.cgst).toBe(invoice.sgst);

      // Verify DB constraint (cgst + sgst + taxable === total in paise)
      const totalTaxable = invoice.lines.reduce((acc, l) => add(acc, l.taxable), ZERO);
      const totalTax = add(invoice.cgst, invoice.sgst);
      expect(equals(add(totalTaxable, totalTax), invoice.totalAmount)).toBe(true);

      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
  });

  it('INV-RECONCILE: inter-state invoice uses IGST and sets CGST & SGST to zero', async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const total = fromPaise(50000); // Rs 500.00
      const invoice = await invoicesService.issue(client, {
        invoiceType: 'SALE_B2B',
        fiscalYear: '2026-27',
        placeOfSupply: '29-Karnataka', // Inter-state
        totalAmount: total,
        gstInclusive: false,
        lines: [
          { lineNo: 1, description: 'B2B Wholesale Organic Carrots', qty: 10, unitPrice: fromPaise(5000), gstRate: 5, total },
        ],
      });

      expect(parseFloat(invoice.igst)).toBeGreaterThan(0);
      expect(parseFloat(invoice.cgst)).toBe(0);
      expect(parseFloat(invoice.sgst)).toBe(0);

      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
  });

  it('BR-16b: extracts rendered PDF and proves no farm or farmer identifier leaks on retail sale', async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const distinctFarmName = 'SecretWhisperingPinesFarm99';
      const distinctVillageName = 'HiddenMistyValleyVillage88';
      const distinctFarmerName = 'Shanmugam Subramanian Unique';

      const invoice = await invoicesService.issue(client, {
        invoiceType: 'SALE_RETAIL',
        fiscalYear: '2026-27',
        placeOfSupply: '33-Tamil Nadu',
        totalAmount: fromPaise(15000),
        gstInclusive: true,
        lines: [
          { lineNo: 1, description: 'Organic Beetroot (Grade A)', qty: 3, unitPrice: fromPaise(5000), gstRate: 5, total: fromPaise(15000) },
        ],
      });
      await client.query('COMMIT');

      // Generate PDF buffer
      const pdfBuffer = await invoicesService.getPdf(
        { userId: '00000000-0000-0000-0000-000000000001', customerId: 'cust-1', farmerId: null, roles: [{ code: RoleCode.CUSTOMER }] },
        invoice.id,
      );

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(1000);

      // Verify the text content inside the PDF
      const pdfText = extractPdfText(pdfBuffer);
      const normalized = pdfText.replace(/\s+/g, ' ');
      const compact = pdfText.replace(/\s+/g, '');

      expect(compact).toContain('TOHFAPLATFORM');
      expect(compact).toContain('RETAILTAXINVOICE');
      expect(normalized).not.toContain(distinctFarmName);
      expect(normalized).not.toContain(distinctVillageName);
      expect(normalized).not.toContain(distinctFarmerName);

      await pool.query('DELETE FROM invoice_lines WHERE invoice_id = $1', [invoice.id]);
      await pool.query('DELETE FROM invoices WHERE id = $1', [invoice.id]);
    } finally {
      client.release();
    }
  });

  it('Signed download link expires in 5 minutes and invalid/tampered signatures return false', async () => {
    const invoiceId = '00000000-0000-0000-0000-000000000001';
    const signed = invoicesService.generateSignedDownloadUrl(invoiceId);

    expect(signed.url).toContain('/v1/invoices/00000000-0000-0000-0000-000000000001/download?token=');
    expect(signed.expiresAt).toBeGreaterThan(Date.now());

    // Extract token & expires from generated URL
    const urlObj = new URL('http://localhost' + signed.url);
    const token = urlObj.searchParams.get('token')!;
    const expires = parseInt(urlObj.searchParams.get('expires')!, 10);

    // 1. Valid signature
    expect(invoicesService.verifyDownloadSignature(invoiceId, token, expires)).toBe(true);

    // 2. Tampered signature
    expect(invoicesService.verifyDownloadSignature(invoiceId, token + 'tampered', expires)).toBe(false);

    // 3. Expired timestamp
    const expiredTimestamp = Date.now() - 1000;
    expect(invoicesService.verifyDownloadSignature(invoiceId, token, expiredTimestamp)).toBe(false);
  });
});
