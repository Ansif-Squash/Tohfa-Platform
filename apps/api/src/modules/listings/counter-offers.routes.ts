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
import { pool, withTransaction } from '../../db/pool.js';
import { counterOffersService } from './counter-offers.service.js';
import { purchaseOrdersService } from '../purchase-orders/purchase-orders.service.js';
import { AppError } from '../../http/problem.js';
import {
  adminApproveListingBody,
  adminRejectListingBody,
  counterOfferCreateBody,
  counterOfferParams,
  counterOfferRejectBody,
  listAdminQueueQuery,
  listingIdParams,
} from './counter-offers.schema.js';
import { counterOffersRepo } from './counter-offers.repo.js';

export const adminListingsRouter: Router = Router();
export const farmerCounterOffersRouter: Router = Router();

// ---- admin surface ---------------------------------------------------------

/**
 * GET /v1/admin/listings — the admin approval queue.
 * Returns listings paged by (created_at, id) with the active counter-offer
 * embedded. BR-29: Farmer Admin rows with routedAway=true are read-only.
 */
adminListingsRouter.get(
  '/',
  requireAuth,
  requirePermission('listing.queue.view_pending'),
  asyncHandler(async (req, res) => {
    const query = listAdminQueueQuery.parse(req.query);
    const result = await counterOffersRepo.listAdminQueue(pool, query);
    res.set('Cache-Control', 'no-store');
    res.json(result);
  }),
);

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
    try {
      const { id } = listingIdParams.parse(req.params);
      const body = adminApproveListingBody.parse(req.body);

      const result = await withTransaction(async (tx) => {
        const listing = await counterOffersRepo.findAdminListing(tx, id);
        if (listing === null) {
          throw new AppError('NOT_FOUND', { detail: 'Listing not found.' });
        }

        if (req.scope) {
          const isOwn = (scope: any, row: any) => {
            if (scope.level === 'own') {
              return row.ownerUserId === scope.userId;
            }
            return false;
          };
          if (isOwn(req.scope, listing)) {
            const denied = await (counterOffersService as any)['routeAwayFromOwner'](tx, req.scope, listing, 'approve');
            throw denied;
          }
        }

        let updatedListing = listing;
        const PENDABLE_STATUSES = ['PENDING_APPROVAL', 'COUNTER_OFFERED'];
        if (PENDABLE_STATUSES.includes(listing.status)) {
          const transitioned = await counterOffersRepo.transitionListingStatus(
            tx,
            id,
            'ACCEPTED',
            PENDABLE_STATUSES,
            listing.version,
            {
              finalPricePerKg: listing.askingPricePerKg,
              finalQuantityKg: listing.quantityKg,
              approvedBy: req.actor!.userId,
              approvedAt: new Date(),
            },
          );
          if (transitioned === null) {
            throw new AppError('CONFLICT', {
              detail: 'The listing was modified by another request. Please refresh and try again.',
            });
          }
          updatedListing = transitioned;

          const priorPending = await counterOffersRepo.findLatestPendingOffer(tx, id);
          if (priorPending !== null) {
            await counterOffersRepo.transitionOfferStatus(tx, priorPending.id, 'COUNTERED', req.actor!.userId);
          }

          const auditLogInput = {
            actorId: req.actor!.userId,
            actorRole: req.scope!.roleCode,
            actionCode: 'listing.approve',
            entityType: 'listing',
            entityId: id,
            before: { status: listing.status, version: listing.version },
            after: { status: transitioned.status, version: transitioned.version },
            changedFields: ['status', 'version', 'finalPricePerKg', 'finalQuantityKg', 'approvedBy', 'approvedAt'],
          };
          await tx.query(
            `INSERT INTO audit_log (
              actor_id, actor_role, action_code, entity_type, entity_id, outcome, before, after, changed_fields
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              auditLogInput.actorId,
              auditLogInput.actorRole,
              auditLogInput.actionCode,
              auditLogInput.entityType,
              auditLogInput.entityId,
              'ALLOWED',
              JSON.stringify(auditLogInput.before),
              JSON.stringify(auditLogInput.after),
              auditLogInput.changedFields,
            ],
          );
        } else if (listing.status !== 'ACCEPTED') {
          throw new AppError('LISTING_NOT_PENDING', {
            detail: `Only pending listings can be approved (current status: ${listing.status}).`,
          });
        }

        const po = await purchaseOrdersService.createForListing(
          tx,
          req.actor!,
          req.scope!,
          {
            id: updatedListing.id,
            farmerId: updatedListing.farmerId,
            cropId: updatedListing.cropId,
            grade: updatedListing.grade as any,
            quantityKg: updatedListing.quantityKg,
            askingPricePerKg: updatedListing.askingPricePerKg,
            finalPricePerKg: updatedListing.finalPricePerKg,
            finalQuantityKg: updatedListing.finalQuantityKg,
          },
          {
            warehouseId: body.warehouseId,
            expectedDeliveryDate: body.expectedDeliveryDate ?? null,
            ...(body.note ? { note: body.note } : {}),
          },
        );

        return {
          purchaseOrderId: po.id,
          listing: {
            id: updatedListing.id,
            farmerId: updatedListing.farmerId,
            cropId: updatedListing.cropId,
            grade: updatedListing.grade,
            quantityKg: updatedListing.quantityKg,
            askingPricePerKg: updatedListing.askingPricePerKg,
            finalPricePerKg: updatedListing.finalPricePerKg,
            finalQuantityKg: updatedListing.finalQuantityKg,
            status: updatedListing.status,
            version: updatedListing.version,
            createdAt: updatedListing.createdAt,
            updatedAt: updatedListing.updatedAt,
          },
          purchaseOrder: po,
        };
      });

      res.json(result);
    } catch (err) {
      console.error('--- APPROVE ROUTE ERROR:', err);
      throw err;
    }
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