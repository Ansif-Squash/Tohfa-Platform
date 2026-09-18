/**
 * Generated from the _example reference module. See CLAUDE.md.
 *
 * <name>.routes.ts is thin on purpose: wiring only.
 * Middleware order is FIXED and must not be shuffled:
 *
 *   requireAuth  ->  requirePermission  ->  validate  ->  asyncHandler(handler)
 *
 *   1. requireAuth        401 for anonymous callers; sets req.actor
 *   2. requirePermission  403 for actors without the grant; sets req.scope
 *   3. validate           422 problem+json for malformed input
 *   4. handler            calls the service with (scope) and does nothing else
 *
 * There is no `validate` step here because the operation takes no input at
 * all — see the note in weather.schema.ts about why a `?lat=&lng=` would be a
 * bug rather than a convenience.
 *
 * Permission codes MUST exist in docs/rbac.json. requirePermission throws at
 * import time on a typo, so a bad code fails the build, not a request.
 */
import { Router } from 'express';
import { requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { requirePermission, requireScope } from '../../rbac/requirePermission.js';
import { weatherService } from './weather.service.js';

export const weatherFarmerRouter: Router = Router();

// Mounted at /v1/farmers/me/weather
weatherFarmerRouter.get(
  '/',
  requireAuth,
  requirePermission('farmer.weather.view_own'),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    res.json(await weatherService.getMyFarmWeather(scope));
  }),
);
