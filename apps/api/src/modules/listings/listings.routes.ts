import { Router } from 'express';
import { requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission, requireScope } from '../../rbac/requirePermission.js';
import { listingsService } from './listings.service.ts';
import {
  createListingBody,
  listingIdParams,
  listListingsQuery,
  updateListingBody,
  withdrawListingBody,
} from './listings.schema.ts';

export const listingsRouter: Router = Router();

listingsRouter.post(
  '/',
  requireAuth,
  requirePermission('listing.create_own'),
  validate({ body: createListingBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const body = getValidated(req, 'body', createListingBody);
    const result = await listingsService.create(scope, body);
    res.status(201).json(result);
  }),
);

listingsRouter.get(
  '/',
  requireAuth,
  requirePermission('listing.view_own'),
  validate({ query: listListingsQuery }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const filters = getValidated(req, 'query', listListingsQuery);
    const result = await listingsService.list(scope, filters);
    res.json(result);
  }),
);

listingsRouter.patch(
  '/:id',
  requireAuth,
  requirePermission('listing.update_own'),
  validate({ params: listingIdParams, body: updateListingBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', listingIdParams);
    const body = getValidated(req, 'body', updateListingBody);
    const result = await listingsService.update(scope, id, body);
    res.json(result);
  }),
);

listingsRouter.post(
  '/:id/withdraw',
  requireAuth,
  requirePermission('listing.withdraw_own'),
  validate({ params: listingIdParams, body: withdrawListingBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', listingIdParams);
    const body = getValidated(req, 'body', withdrawListingBody);
    const result = await listingsService.withdraw(scope, id, body);
    res.json(result);
  }),
);
