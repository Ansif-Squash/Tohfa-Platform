import { Router } from 'express';
import { requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission, requireScope } from '../../rbac/requirePermission.js';
import { batchIdParams, listBatchesQuery, listStockLedgerQuery } from './inventory.schema.js';
import { inventoryService } from './inventory.service.js';

export const adminBatchesRouter: Router = Router();
export const adminStockLedgerRouter: Router = Router();

adminBatchesRouter.get(
  '/',
  requireAuth,
  requirePermission('inventory.batch.view'),
  validate({ query: listBatchesQuery }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const filters = getValidated(req, 'query', listBatchesQuery);
    res.json(await inventoryService.listBatches(scope, filters));
  }),
);

adminBatchesRouter.get(
  '/:id',
  requireAuth,
  requirePermission('inventory.batch.view'),
  validate({ params: batchIdParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', batchIdParams);
    res.json(await inventoryService.getBatch(scope, id));
  }),
);

adminStockLedgerRouter.get(
  '/',
  requireAuth,
  requirePermission('inventory.stock_ledger.view_own'),
  validate({ query: listStockLedgerQuery }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const filters = getValidated(req, 'query', listStockLedgerQuery);
    res.json(await inventoryService.listStockLedger(scope, filters));
  }),
);
