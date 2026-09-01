import { Router } from 'express';
import { parseMoney } from '@tohfa/shared-types';
import { requireActor, requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission } from '../../rbac/requirePermission.js';
import { createTopupSchema } from './topup.schema.js';
import { topupService } from './topup.service.js';

export const topupRouter: Router = Router();
export const webhookRouter: Router = Router();

topupRouter.post(
  '/me/topups',
  requireAuth,
  requirePermission('wallet.topup.digital'),
  validate({ body: createTopupSchema }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const body = getValidated(req, 'body', createTopupSchema);
    const idempotencyKey = req.header('idempotency-key');

    const result = await topupService.createTopup(
      actor,
      req.scope!,
      {
        amount: parseMoney(body.amount),
        mode: body.mode,
      },
      idempotencyKey,
    );
    res.status(201).json(result);
  }),
);

webhookRouter.post(
  '/razorpay',
  asyncHandler(async (req, res) => {
    const signature = req.header('x-razorpay-signature');
    const eventId = req.header('x-razorpay-event-id');

    // req.body is raw Buffer when raw parser is mounted
    const rawBody: Buffer | string = req.body;

    const result = await topupService.processRazorpayWebhook(
      rawBody,
      signature,
      eventId,
    );
    res.status(200).json(result);
  }),
);
