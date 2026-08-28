import { Router } from 'express';
import { requireActor, requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission, requireScope } from '../../rbac/requirePermission.js';
import {
  listPurchaseOrdersQuery,
  purchaseOrderIdParams,
} from './purchase-orders.schema.js';
import { purchaseOrdersService } from './purchase-orders.service.js';

export const purchaseOrdersRouter: Router = Router();

// GET /v1/admin/purchase-orders — list purchase orders with warehouse scoping (BR-30)
purchaseOrdersRouter.get(
  '/',
  requireAuth,
  requirePermission('purchase.order.view'),
  validate({ query: listPurchaseOrdersQuery }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const scope = requireScope(req.scope);
    const query = getValidated(req, 'query', listPurchaseOrdersQuery);

    const result = await purchaseOrdersService.list(actor, scope, query);
    res.json(result);
  }),
);

// GET /v1/admin/purchase-orders/:id — get purchase order detail with goods receipts
purchaseOrdersRouter.get(
  '/:id',
  requireAuth,
  requirePermission('purchase.order.view'),
  validate({ params: purchaseOrderIdParams }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', purchaseOrderIdParams);

    const result = await purchaseOrdersService.getById(actor, scope, id);
    res.json(result);
  }),
);
