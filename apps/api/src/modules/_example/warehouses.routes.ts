/**
 * REFERENCE PATTERN — copy this structure for every new module. See CLAUDE.md.
 *
 * <name>.routes.ts is thin on purpose: wiring only.
 * Middleware order is FIXED and must not be shuffled:
 *
 *   requireAuth  ->  requirePermission  ->  validate  ->  asyncHandler(handler)
 *
 *   1. requireAuth        401 for anonymous callers; sets req.actor
 *   2. requirePermission  403 for actors without the grant; sets req.scope
 *   3. validate           422 problem+json for malformed input
 *   4. handler            calls the service with (scope, validatedInput) and
 *                         does nothing else — no SQL, no role checks, no
 *                         business rules
 *
 * Permission codes MUST exist in docs/rbac.json. requirePermission throws at
 * import time on a typo, so a bad code fails the build, not a request.
 */
import { Router } from 'express';
import { requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission, requireScope } from '../../rbac/requirePermission.js';
import { warehousesService } from './warehouses.service.js';
import { listWarehousesQuery, warehouseIdParams } from './warehouses.schema.js';

export const warehousesRouter: Router = Router();

warehousesRouter.get(
  '/',
  requireAuth,
  requirePermission('warehouse.all.view'),
  validate({ query: listWarehousesQuery }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const filters = getValidated(req, 'query', listWarehousesQuery);
    res.json(await warehousesService.list(scope, filters));
  }),
);

warehousesRouter.get(
  '/:id',
  requireAuth,
  requirePermission('warehouse.all.view'),
  validate({ params: warehouseIdParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', warehouseIdParams);
    res.json(await warehousesService.getById(scope, id));
  }),
);
