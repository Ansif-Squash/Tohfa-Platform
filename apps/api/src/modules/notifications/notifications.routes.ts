import { Router } from 'express';
import { requireActor, requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission } from '../../rbac/requirePermission.js';
import {
  listNotificationsQuery,
  notificationIdParam,
  registerDeviceTokenBody,
  revokeDeviceTokenParam,
} from './notifications.schema.js';
import { notificationsService } from './notifications.service.js';

export const notificationsRouter: Router = Router();

notificationsRouter.get(
  '/',
  requireAuth,
  requirePermission('notification.own.view'),
  validate({ query: listNotificationsQuery }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const query = getValidated(req, 'query', listNotificationsQuery);
    const result = await notificationsService.listMyNotifications(actor, query);
    res.json(result);
  }),
);

notificationsRouter.post(
  '/:id/read',
  requireAuth,
  requirePermission('notification.own.mark_read'),
  validate({ params: notificationIdParam }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const { id } = getValidated(req, 'params', notificationIdParam);
    const result = await notificationsService.markAsRead(actor, id);
    res.json(result);
  }),
);

notificationsRouter.post(
  '/device-tokens',
  requireAuth,
  requirePermission('notification.own.view'),
  validate({ body: registerDeviceTokenBody }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const body = getValidated(req, 'body', registerDeviceTokenBody);
    const result = await notificationsService.registerDeviceToken(actor, body);
    res.status(201).json(result);
  }),
);

notificationsRouter.delete(
  '/device-tokens/:token',
  requireAuth,
  requirePermission('notification.own.view'),
  validate({ params: revokeDeviceTokenParam }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const { token } = getValidated(req, 'params', revokeDeviceTokenParam);
    const result = await notificationsService.revokeDeviceToken(actor, token);
    res.json(result);
  }),
);

