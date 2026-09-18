/**
 * Middleware order is FIXED: requireAuth -> requirePermission -> validate ->
 * asyncHandler(handler). See CLAUDE.md / apps/api/CLAUDE.md.
 *
 * No new permission codes: farmer.rating.view and farmer.rating.edit already
 * exist in docs/rbac.json with exactly the grants this module needs.
 */
import { Router } from 'express';
import { requireActor, requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission, requireScope } from '../../rbac/requirePermission.js';
import { farmerIdParams, setFarmRatingBody } from './farm-ratings.schema.js';
import { farmRatingsService } from './farm-ratings.service.js';

/** Mounted at /v1/admin/farmers */
export const adminFarmRatingsRouter: Router = Router();

// GET /v1/admin/farmers/:id/rating — 10-category breakdown + overall rating/tier
adminFarmRatingsRouter.get(
  '/:id/rating',
  requireAuth,
  requirePermission('farmer.rating.view'),
  validate({ params: farmerIdParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', farmerIdParams);
    const result = await farmRatingsService.getAdminRating(scope, id);
    res.json(result);
  }),
);

// PUT /v1/admin/farmers/:id/rating — submit 1-10 category scores; the cycle
// completes once all 10 active categories have been scored (see the service)
adminFarmRatingsRouter.put(
  '/:id/rating',
  requireAuth,
  requirePermission('farmer.rating.edit'),
  validate({ params: farmerIdParams, body: setFarmRatingBody }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', farmerIdParams);
    const body = getValidated(req, 'body', setFarmRatingBody);
    const result = await farmRatingsService.setRating(actor, scope, id, body);
    res.json(result);
  }),
);

/** Mounted at /v1/farmers/me/rating */
export const farmRatingsFarmerRouter: Router = Router();

// GET /v1/farmers/me/rating — the caller's own 10-category breakdown
farmRatingsFarmerRouter.get(
  '/',
  requireAuth,
  requirePermission('farmer.rating.view'),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const result = await farmRatingsService.getMyRating(scope);
    res.json(result);
  }),
);
