import { Router } from 'express';
import { z } from 'zod';
import { requireActor, requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission } from '../../rbac/requirePermission.js';
import {
  adminOrdersQuerySchema,
  assignWarehouseSchema,
  packOrderSchema,
  dispatchOrderSchema,
  verifyOtpSchema,
} from './fulfilment.schema.js';
import { fulfilmentService } from './fulfilment.service.js';

const idParamSchema = z.object({
  id: z.string().uuid(),
});

export const adminFulfilmentRouter: Router = Router();

adminFulfilmentRouter.get(
  '/',
  requireAuth,
  requirePermission('order.list.view_all'),
  validate({ query: adminOrdersQuerySchema }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const query = getValidated(req, 'query', adminOrdersQuerySchema);
    const result = await fulfilmentService.listAdminOrders(
      actor,
      req.scope!,
      query,
    );
    res.status(200).json(result);
  }),
);

adminFulfilmentRouter.post(
  '/:id/assign-warehouse',
  requireAuth,
  requirePermission('order.warehouse.assign'),
  validate({ params: idParamSchema, body: assignWarehouseSchema }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const params = getValidated(req, 'params', idParamSchema);
    const body = getValidated(req, 'body', assignWarehouseSchema);
    const result = await fulfilmentService.assignWarehouse(
      actor,
      req.scope!,
      params.id,
      body,
    );
    res.status(200).json(result);
  }),
);

adminFulfilmentRouter.post(
  '/:id/pack',
  requireAuth,
  requirePermission('order.mark_packed'),
  validate({ params: idParamSchema, body: packOrderSchema }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const params = getValidated(req, 'params', idParamSchema);
    const body = getValidated(req, 'body', packOrderSchema);
    const result = await fulfilmentService.packOrder(
      actor,
      req.scope!,
      params.id,
      body,
    );
    res.status(200).json(result);
  }),
);

adminFulfilmentRouter.post(
  '/:id/dispatch',
  requireAuth,
  requirePermission('order.dispatch'),
  validate({ params: idParamSchema, body: dispatchOrderSchema }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const params = getValidated(req, 'params', idParamSchema);
    const body = getValidated(req, 'body', dispatchOrderSchema);
    const result = await fulfilmentService.dispatchOrder(
      actor,
      req.scope!,
      params.id,
      body,
    );
    res.status(200).json(result);
  }),
);

adminFulfilmentRouter.post(
  '/:id/verify-otp',
  requireAuth,
  requirePermission('order.pickup_otp.verify'),
  validate({ params: idParamSchema, body: verifyOtpSchema }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const params = getValidated(req, 'params', idParamSchema);
    const body = getValidated(req, 'body', verifyOtpSchema);
    const result = await fulfilmentService.verifyOtp(
      actor,
      req.scope!,
      params.id,
      body,
    );
    res.status(200).json(result);
  }),
);

export const orderTrackingRouter: Router = Router();

orderTrackingRouter.get(
  '/:id/tracking',
  requireAuth,
  requirePermission('order.view_own'),
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const params = getValidated(req, 'params', idParamSchema);
    const result = await fulfilmentService.getOrderTracking(
      actor,
      req.scope!,
      params.id,
    );
    res.status(200).json(result);
  }),
);

orderTrackingRouter.get(
  '/:id/events',
  requireAuth,
  requirePermission('order.view_own'),
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const params = getValidated(req, 'params', idParamSchema);
    await fulfilmentService.streamOrderEvents(
      actor,
      req.scope!,
      params.id,
      req,
      res,
    );
  }),
);
