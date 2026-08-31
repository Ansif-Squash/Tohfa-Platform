import { Router } from 'express';
import { requireActor, requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission } from '../../rbac/requirePermission.js';
import { walletService } from './wallet.service.js';
import { listMyTransactionsQuery } from './wallet.schema.js';

export const walletsRouter: Router = Router();

walletsRouter.get(
  '/me',
  requireAuth,
  requirePermission('wallet.own.view'),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    res.json(await walletService.getWalletForActor(actor));
  }),
);

walletsRouter.get(
  '/me/transactions',
  requireAuth,
  requirePermission('wallet.own.view'),
  validate({ query: listMyTransactionsQuery }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const filters = getValidated(req, 'query', listMyTransactionsQuery);
    res.json(await walletService.listTransactionsForActor(actor, filters));
  }),
);
