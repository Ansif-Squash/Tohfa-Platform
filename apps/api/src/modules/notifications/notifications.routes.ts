import { Router } from 'express';
import { requireActor, requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission } from '../../rbac/requirePermission.js';
import { listNotificationsQuery, notificationIdParam } from './notifications.schema.js';
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
