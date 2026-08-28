import { Router } from 'express';
import { requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { requirePermission } from '../../rbac/requirePermission.js';
import {
  createListingBody,
  listListingsQuery,
  listingIdParam,
  updateListingBody,
} from './listings.schema.js';
import { listingsService } from './listings.service.js';

export const listingsRouter: Router = Router();

// 1. Create produce listing
listingsRouter.post(
  '/',
  requireAuth,
  requirePermission('listing.create_own'),
  asyncHandler(async (req, res) => {
    const body = createListingBody.parse(req.body);
    const idempotencyKey = req.header('idempotency-key');
    const result = await listingsService.createListing(
      req.actor!,
      req.scope!,
      body,
      idempotencyKey,
    );
    res.status(201).json(result);
  }),
);

// 2. List caller's own listings
listingsRouter.get(
  '/',
  requireAuth,
  requirePermission('listing.view_own'),
  asyncHandler(async (req, res) => {
    const query = listListingsQuery.parse(req.query);
    const result = await listingsService.listMyListings(req.actor!, req.scope!, query);
    res.json(result);
  }),
);

// 3. Edit pending listing
listingsRouter.patch(
  '/:id',
  requireAuth,
  requirePermission('listing.update_own'),
  asyncHandler(async (req, res) => {
    const { id } = listingIdParam.parse(req.params);
    const body = updateListingBody.parse(req.body);
    const result = await listingsService.updateListing(req.actor!, req.scope!, id, body);
    res.json(result);
  }),
);

// 4. Withdraw pending listing
listingsRouter.post(
  '/:id/withdraw',
  requireAuth,
  requirePermission('listing.withdraw_own'),
  asyncHandler(async (req, res) => {
    const { id } = listingIdParam.parse(req.params);
    const version = req.body?.version ? Number(req.body.version) : undefined;
    const result = await listingsService.withdrawListing(req.actor!, req.scope!, id, version);
    res.json(result);
  }),
);
