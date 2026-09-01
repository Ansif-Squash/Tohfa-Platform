import { Router } from 'express';
import { z } from 'zod';
import { requireActor, requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission } from '../../rbac/requirePermission.js';
import {
  payoutDuesQuerySchema,
  createPayoutSchema,
  approvePayoutSchema,
} from './payouts.schema.js';
import { payoutsService } from './payouts.service.js';

const idParamSchema = z.object({
  id: z.string().uuid(),
});

export const payoutDuesRouter: Router = Router();
export const payoutsRouter: Router = Router();

// ---------------------------------------------------------------------------
// GET /admin/payout-dues
// ---------------------------------------------------------------------------

payoutDuesRouter.get(
  '/',
  requireAuth,
  requirePermission('payout.dues.view'),
  validate({ query: payoutDuesQuerySchema }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const query = getValidated(req, 'query', payoutDuesQuerySchema);
    const result = await payoutsService.listPayoutDues(actor, req.scope!, query);
    res.status(200).json(result);
  }),
);

// ---------------------------------------------------------------------------
// POST /admin/payouts
// ---------------------------------------------------------------------------

payoutsRouter.post(
  '/',
  requireAuth,
  requirePermission('payout.farmer.initiate'),
  validate({ body: createPayoutSchema }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const body = getValidated(req, 'body', createPayoutSchema);
    const idempotencyKey = req.header('idempotency-key');

    const result = await payoutsService.createPayout(
      actor,
      req.scope!,
      body,
      idempotencyKey,
    );
    res.status(201).json(result);
  }),
);

// ---------------------------------------------------------------------------
// POST /admin/payouts/{id}/approve
// ---------------------------------------------------------------------------

payoutsRouter.post(
  '/:id/approve',
  requireAuth,
  requirePermission('payout.approve_above_10k'),
  validate({ params: idParamSchema, body: approvePayoutSchema }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const params = getValidated(req, 'params', idParamSchema);
    const body = getValidated(req, 'body', approvePayoutSchema);
    const idempotencyKey = req.header('idempotency-key');

    const result = await payoutsService.approvePayout(
      actor,
      req.scope!,
      params.id,
      body,
      idempotencyKey,
    );
    res.status(200).json(result);
  }),
);
