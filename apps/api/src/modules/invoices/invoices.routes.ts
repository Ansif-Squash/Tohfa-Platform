import { Router } from 'express';
import { optionalAuth, requireActor, requireAuth } from '../../auth/requireAuth.js';
import { requirePermission } from '../../rbac/requirePermission.js';
import { getValidated, validate } from '../../http/validate.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import {
  listInvoicesQuery,
  invoiceIdParams,
  downloadInvoiceQuery,
} from './invoices.schema.js';
import { invoicesService } from './invoices.service.js';

export const invoicesRouter: Router = Router();

// GET /v1/invoices - List own or all invoices based on role
invoicesRouter.get(
  '/',
  requireAuth,
  requirePermission('invoice.view_own'),
  validate({ query: listInvoicesQuery }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const query = getValidated(req, 'query', listInvoicesQuery);
    const result = await invoicesService.listInvoices(actor, query);
    res.json(result);
  }),
);

// GET /v1/invoices/:id/download - Download PDF inline or 302 redirect to signed link
invoicesRouter.get(
  '/:id/download',
  optionalAuth,
  validate({ params: invoiceIdParams, query: downloadInvoiceQuery }),
  asyncHandler(async (req, res) => {
    const { id } = getValidated(req, 'params', invoiceIdParams);
    const query = getValidated(req, 'query', downloadInvoiceQuery);

    if (query.redirect) {
      // Must be authenticated to generate a signed download link
      const _actor = requireActor(req.actor);
      const signed = invoicesService.generateSignedDownloadUrl(id);
      return res.redirect(302, signed.url);
    }

    const pdfBuffer = await invoicesService.getPdf(req.actor, id, query);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="invoice-${id}.pdf"`);
    res.send(pdfBuffer);
  }),
);

// GET /v1/invoices/:id - Invoice detail
invoicesRouter.get(
  '/:id',
  requireAuth,
  requirePermission('invoice.view_own'),
  validate({ params: invoiceIdParams }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const { id } = getValidated(req, 'params', invoiceIdParams);
    const result = await invoicesService.getInvoice(actor, id);
    res.json(result);
  }),
);
