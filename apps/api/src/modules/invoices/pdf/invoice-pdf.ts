import PDFDocument from 'pdfkit';
import { tokens } from '@tohfa/design-tokens';
import type { InvoiceDetailResponse } from '../invoices.schema.js';

export interface RenderPdfOptions {
  invoice: InvoiceDetailResponse;
  customerName?: string | null;
  customerPhone?: string | null;
  farmerName?: string | null;
}

export function renderInvoicePdf(options: RenderPdfOptions): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    try {
      const { invoice, customerName, customerPhone, farmerName } = options;
      const doc = new PDFDocument({ margin: 40, size: 'A4', compress: false });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err: Error) => reject(err));

      const primaryColor = tokens.color.tohfaTeal.hex;
      const deepTeal = tokens.color.deepTeal.hex;
      const creamBg = tokens.color.backgroundCream.hex;
      const greyBorder = tokens.neutral.grey100.hex;
      const greyText = '#4A5568';
      const blackText = '#1A202C';

      // 1. Header Banner
      doc.rect(40, 40, 515, 65).fill(creamBg);
      doc.rect(40, 40, 515, 65).stroke(greyBorder);

      doc.fillColor(primaryColor).fontSize(20).font('Helvetica-Bold')
         .text('TOHFA PLATFORM', 55, 52);
      doc.fillColor(greyText).fontSize(9).font('Helvetica')
         .text('Tohfa Organics Pvt. Ltd. • The Nilgiris, Tamil Nadu', 55, 76)
         .text('GSTIN: 33AAAAA0000A1Z5 • Support: support@tohfa.in', 55, 88);

      const isRetailSale = invoice.invoiceType === 'SALE_RETAIL';
      const isB2B = invoice.invoiceType === 'SALE_B2B';
      const isPayout = invoice.invoiceType === 'PAYOUT';
      const isPurchase = invoice.invoiceType === 'PURCHASE_FARMER';

      const title = isRetailSale
        ? 'RETAIL TAX INVOICE'
        : isB2B
          ? 'B2B TAX INVOICE'
          : isPayout
            ? 'FARMER PAYOUT SETTLEMENT'
            : isPurchase
              ? 'FARMER PURCHASE INVOICE'
              : 'INVOICE';

      doc.fillColor(deepTeal).fontSize(12).font('Helvetica-Bold')
         .text(title, 350, 55, { width: 190, align: 'right' });
      doc.fillColor(greyText).fontSize(8).font('Helvetica')
         .text(`Invoice #: ${invoice.invoiceNumber}`, 350, 72, { width: 190, align: 'right' })
         .text(`Date: ${invoice.issueDate}`, 350, 84, { width: 190, align: 'right' });

      // 2. Bill To / Bill From Details
      const partyY = 120;
      doc.rect(40, partyY, 250, 85).stroke(greyBorder);
      doc.rect(305, partyY, 250, 85).stroke(greyBorder);

      // Seller Block
      doc.fillColor(primaryColor).fontSize(9).font('Helvetica-Bold')
         .text('SELLER / ISSUER:', 50, partyY + 10);
      doc.fillColor(blackText).fontSize(9).font('Helvetica')
         .text('Tohfa Organics Pvt. Ltd.', 50, partyY + 24)
         .text('Ooty Main Warehouse, Hub 1', 50, partyY + 36)
         .text('The Nilgiris, Tamil Nadu - 643001', 50, partyY + 48)
         .text('State Code: 33 (Tamil Nadu)', 50, partyY + 60);

      // Buyer / Recipient Block
      doc.fillColor(primaryColor).fontSize(9).font('Helvetica-Bold')
         .text(isPayout || isPurchase ? 'BENEFICIARY / FARMER:' : 'BILLED TO (CUSTOMER):', 315, partyY + 10);
      
      const recipientName = isPayout || isPurchase
        ? (farmerName ?? 'Registered Farmer')
        : (customerName ?? 'Valued Customer');
      const recipientContact = customerPhone ?? '';

      doc.fillColor(blackText).fontSize(9).font('Helvetica')
         .text(recipientName, 315, partyY + 24)
         .text(recipientContact ? `Mobile: ${recipientContact}` : 'Registered Platform User', 315, partyY + 36)
         .text(`Place of Supply: ${invoice.placeOfSupply ?? '33-Tamil Nadu'}`, 315, partyY + 48)
         .text(invoice.gstInclusive ? 'Tax Policy: GST-Inclusive' : 'Tax Policy: GST-Exclusive', 315, partyY + 60);

      // 3. Line Items Table
      const tableTop = 220;
      doc.rect(40, tableTop, 515, 22).fill(deepTeal);

      doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
      doc.text('#', 45, tableTop + 6, { width: 20 });
      doc.text('Item Description', 70, tableTop + 6, { width: 170 });
      doc.text('HSN', 245, tableTop + 6, { width: 45 });
      doc.text('Qty (kg)', 295, tableTop + 6, { width: 45, align: 'right' });
      doc.text('Rate', 345, tableTop + 6, { width: 45, align: 'right' });
      doc.text('Taxable', 395, tableTop + 6, { width: 50, align: 'right' });
      doc.text('Tax', 450, tableTop + 6, { width: 45, align: 'right' });
      doc.text('Total (INR)', 500, tableTop + 6, { width: 50, align: 'right' });

      let currentY = tableTop + 22;
      let idx = 1;

      for (const line of invoice.lines) {
        const rowBg = idx % 2 === 0 ? creamBg : '#FFFFFF';
        doc.rect(40, currentY, 515, 20).fill(rowBg);
        doc.rect(40, currentY, 515, 20).stroke(greyBorder);

        doc.fillColor(blackText).fontSize(8).font('Helvetica');
        doc.text(String(line.lineNo || idx), 45, currentY + 5, { width: 20 });
        doc.text(line.description, 70, currentY + 5, { width: 170 });
        doc.text(line.hsnCode ?? '0709', 245, currentY + 5, { width: 45 });
        doc.text(line.qty.toFixed(2), 295, currentY + 5, { width: 45, align: 'right' });
        doc.text(line.unitPrice, 345, currentY + 5, { width: 45, align: 'right' });
        doc.text(line.taxable, 395, currentY + 5, { width: 50, align: 'right' });
        doc.text(line.tax, 450, currentY + 5, { width: 45, align: 'right' });
        doc.text(line.total, 500, currentY + 5, { width: 50, align: 'right' });

        currentY += 20;
        idx++;
      }

      // 4. Totals Summary Box
      currentY += 15;
      const summaryLeft = 320;
      doc.rect(summaryLeft, currentY, 235, 100).stroke(greyBorder);

      const addSummaryRow = (label: string, val: string, yPos: number, isBold = false) => {
        doc.fillColor(blackText).fontSize(8).font(isBold ? 'Helvetica-Bold' : 'Helvetica')
           .text(label, summaryLeft + 10, yPos);
        doc.text(`₹ ${val}`, summaryLeft + 130, yPos, { width: 95, align: 'right' });
      };

      addSummaryRow('Taxable Subtotal:', invoice.taxableAmount, currentY + 10);
      if (parseFloat(invoice.igst) > 0) {
        addSummaryRow('IGST (Inter-state):', invoice.igst, currentY + 26);
      } else {
        addSummaryRow('CGST (Central Tax):', invoice.cgst, currentY + 26);
        addSummaryRow('SGST (State Tax):', invoice.sgst, currentY + 42);
      }

      doc.rect(summaryLeft, currentY + 62, 235, 1).stroke(greyBorder);
      doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold')
         .text('Total Amount (INR):', summaryLeft + 10, currentY + 75);
      doc.text(`₹ ${invoice.totalAmount}`, summaryLeft + 130, currentY + 75, { width: 95, align: 'right' });

      // 5. Footer Notes
      const footerY = 680;
      doc.rect(40, footerY, 515, 60).stroke(greyBorder);
      doc.fillColor(greyText).fontSize(8).font('Helvetica')
         .text('Important Notice & Declarations:', 50, footerY + 8)
         .text('1. Farm Anonymity Guarantee (BR-16): Produce sourced exclusively through certified Nilgiris regional aggregates.', 50, footerY + 20)
         .text('2. All organic produce meets NPOP / PGS-India certified standards.', 50, footerY + 32)
         .text('3. This is a computer generated invoice and does not require a physical signature.', 50, footerY + 44);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
