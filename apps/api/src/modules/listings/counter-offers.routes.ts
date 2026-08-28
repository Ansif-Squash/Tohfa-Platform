/**
 * counter-offers.routes — wiring only.
 *
 * Two routers mount one negotiation surface:
 *   adminCounterOffersRouter (`/v1/admin/listings`)  — admin sends / approve / reject
 *   counterOffersRouter        (`/v1/listings`)    — farmer accept / reject / counter
 *
 * Chain is always requireAuth -> requirePermission -> validate -> handler. No
 * business logic here. All three admin verbs resolve conditional `NOT_OWN_LISTING`
 * scope and the service evaluates that predicate after loading the row.
 */
import { Router } from 'express';
import { requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { requirePermission } from '../../rbac/requirePermission.js';
import { counterOffersService } from './counter-offers.service.js';
import {
  adminApproveListingBody,
  adminRejectListingBody,
  counterOfferCreateBody,
  counterOfferParams,
  counterOfferRejectBody,
  listingIdParams,
} from './counter-offers.schema.js';

export const adminListingsRouter: Router = Router();
export const farmerCounterOffersRouter: Router = Router();

// ---- admin surface ---------------------------------------------------------

adminListingsRouter.post(
  '/:id/counter-offers',
  requireAuth,
  requirePermission('listing.counter_offer.send'),
  asyncHandler(async (req, res) => {
    const { id } = listingIdParams.parse(req.params);
    const body = counterOfferCreateBody.parse(req.body);
    const result = await counterOffersService.sendCounterOffer(
      req.actor!,
      req.scope!,
      id,
      body,
    );
    res.status(201).json(result);
  }),
);

adminListingsRouter.post(
  '/:id/approve',
  requireAuth,
  requirePermission('listing.approve'),
  asyncHandler(async (req, res) => {
    const { id } = listingIdParams.parse(req.params);
    const body = adminApproveListingBody.parse(req.body);
    const result = await counterOffersService.approveListing(req.actor!, req.scope!, id, body);
    res.json(result);
  }),
);

adminListingsRouter.post(
  '/:id/reject',
  requireAuth,
  requirePermission('listing.reject'),
  asyncHandler(async (req, res) => {
    const { id } = listingIdParams.parse(req.params);
    const body = adminRejectListingBody.parse(req.body);
    const result = await counterOffersService.rejectListing(req.actor!, req.scope!, id, body);
    res.json(result);
  }),
);

// ---- farmer surface -------------------------------------------------------

farmerCounterOffersRouter.post(
  '/:id/counter-offers/:offerId/accept',
  requireAuth,
  requirePermission('listing.counter_offer.respond'),
  asyncHandler(async (req, res) => {
    const { id, offerId } = counterOfferParams.parse(req.params);
    const result = await counterOffersService.respondAccept(req.actor!, req.scope!, id, offerId);
    res.json(result);
  }),
);

farmerCounterOffersRouter.post(
  '/:id/counter-offers/:offerId/reject',
  requireAuth,
  requirePermission('listing.counter_offer.respond'),
  asyncHandler(async (req, res) => {
    const { id, offerId } = counterOfferParams.parse(req.params);
    const { message } = counterOfferRejectBody.parse(req.body ?? {});
    const result = await counterOffersService.respondReject(
      req.actor!,
      req.scope!,
      id,
      offerId,
      message ?? null,
    );
    res.json(result);
  }),
);

farmerCounterOffersRouter.post(
  '/:id/counter-offers/:offerId/counter',
  requireAuth,
  requirePermission('listing.counter_offer.respond'),
  asyncHandler(async (req, res) => {
    const { id, offerId } = counterOfferParams.parse(req.params);
    const body = counterOfferCreateBody.parse(req.body);
    const result = await counterOffersService.respondCounter(req.actor!, req.scope!, id, offerId, body);
    res.status(201).json(result);
  }),
);