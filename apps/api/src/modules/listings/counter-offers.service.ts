/**
 * Counter-offer state machine (S-22) — BR-10, BR-11, BR-29.
 *
 * The negotiation in one paragraph: an admin opens with a counter (round 1);
 * the farmer answers within a server-computed window by accepting, rejecting
 * or countering back; every response opens the next round and supersedes the
 * pending offer; the window length and the farmer-counter budget come from
 * system_config, never a literal; a lapsed offer is nobody's response and
 * drops the listing back into the admin queue; a Farmer Admin touching their
 * own listing is denied AND the listing is routed to another admin.
 *
 * Concurrency posture: every transition is a guarded conditional update. The
 * listing's `version` column is the optimistic lock for status changes; the
 * offer's `status = 'PENDING'` guard serialises responses to one offer; and
 * UNIQUE(listing_id, round) is the backstop that makes a concurrent
 * double-submit impossible rather than merely unlikely (BR-11b) — the service
 * computes the round from MAX(round) and lets the constraint, not a SELECT,
 * decide the race.
 */
import { ScopeLevel } from '@tohfa/shared-types';
import type { Actor } from '../../auth/requireAuth.js';
import { pool, withTransaction, type Executor } from '../../db/pool.js';
import { eventBus } from '../../events/bus.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import {
  counterOffersRepo,
  type AdminListingView,
  type CounterActor,
  type CounterOfferRow,
  type CounterOfferStatus,
} from './counter-offers.repo.js';
import type {
  AdminApproveListingBody,
  AdminRejectListingBody,
  CounterOfferCreateBody,
} from './counter-offers.schema.js';

export type TransactionRunner = <T>(fn: (tx: Executor) => Promise<T>) => Promise<T>;

/** Statuses a listing must be in for the negotiation to act on it. */
const PENDABLE_STATUSES = ['PENDING_APPROVAL', 'COUNTER_OFFERED'] as const;

/** Upper bound on offers the sweep lapses per pass; the next tick takes the rest. */
const SWEEP_BATCH = 500;

/**
 * One negotiation round = one offer row. Rounds are contiguous from 1 and the
 * ceiling is 1 + max_counter_rounds (round 1 is the admin's opening counter),
 * which is exactly what the `counter_offers.round BETWEEN 1 AND 4` CHECK
 * encodes with the seeded max_counter_rounds of 3.
 */
function roundCeiling(roundLimit: number): number {
  return roundLimit + 1;
}

/**
 * Translate the UNIQUE(listing_id, round) violation into a conflict. This is
 * the BR-11b backstop path: two concurrent submissions computed the same
 * round, the constraint fired, the loser gets a 409 instead of a 500.
 */
function isUniqueRoundViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: string }).code === '23505'
  );
}

/**
 * Mirrors the NOT_OWN_LISTING branch of `assertPredicate` — but returns a
 * boolean instead of throwing, because BR-29b requires the listing_routing
 * row to COMMIT in the same transaction as the denial. Throwing mid-transaction
 * would roll that row straight back out of existence.
 */
function isOwnListing(scope: ResolvedScope, listing: AdminListingView): boolean {
  if (scope.level !== ScopeLevel.CONDITIONAL || scope.predicate !== 'NOT_OWN_LISTING') {
    return false;
  }
  return (
    listing.ownerUserId === scope.userId ||
    (scope.farmerId !== undefined && listing.farmerId === scope.farmerId)
  );
}

/** The openapi `CounterOffer` response shape (actor column is named offeredBy there). */
export interface CounterOfferView {
  id: string;
  listingId: string;
  round: number;
  offeredBy: CounterActor;
  offeredByUserId: string;
  pricePerKg: string;
  quantityKg: string;
  message: string | null;
  status: CounterOfferStatus;
  expiresAt: string;
  respondedAt: string | null;
}

export function toCounterOfferView(row: CounterOfferRow): CounterOfferView {
  return {
    id: row.id,
    listingId: row.listingId,
    round: row.round,
    offeredBy: row.actor,
    offeredByUserId: row.actorUserId,
    pricePerKg: row.pricePerKg,
    quantityKg: row.quantityKg,
    message: row.message,
    status: row.status,
    expiresAt: row.expiresAt.toISOString(),
    respondedAt: row.respondedAt === null ? null : row.respondedAt.toISOString(),
  };
}

/** The tx either produced a result or committed a BR-29 denial to re-throw. */
type TxOutcome<T> = { denied: AppError; result?: undefined } | { denied?: undefined; result: T };

export class CounterOffersService {
  constructor(
    private readonly repo = counterOffersRepo,
    private readonly runTx: TransactionRunner = withTransaction,
    private readonly dbPool: Executor = pool,
  ) {}

  // ------------------------------------------------------------------ config

  private async requireWindowHours(db: Executor): Promise<number> {
    const hours = await this.repo.getCounterOfferWindowHours(db);
    if (!Number.isFinite(hours) || hours <= 0) {
      throw new AppError('INTERNAL', {
        detail: 'system_config.counter_offer_window_hours is missing or invalid.',
      });
    }
    return hours;
  }

  private async requireRoundLimit(db: Executor): Promise<number> {
    const limit = await this.repo.getCounterOfferRoundLimit(db);
    if (!Number.isFinite(limit) || limit < 1) {
      throw new AppError('INTERNAL', {
        detail: 'system_config.max_counter_rounds is missing or invalid.',
      });
    }
    return limit;
  }

  // ------------------------------------------------------------ BR-29 helper

  /**
   * BR-29a/b: the owner was denied — route the listing away in the SAME
   * transaction and record the denial in the audit trail. The 403 is thrown
   * by the caller AFTER this transaction commits, otherwise the routing row
   * would be rolled back and BR-29b would fail ("rejecting without routing").
   */
  private async routeAwayFromOwner(
    tx: Executor,
    scope: ResolvedScope,
    listing: AdminListingView,
    attemptedAction: 'approve' | 'reject' | 'counter_offer',
  ): Promise<AppError> {
    const target = await this.repo.findRouteTarget(tx, scope.userId);
    await this.repo.insertListingRouting(tx, {
      listingId: listing.id,
      routedFromUserId: scope.userId,
      routedToUserId: target?.userId ?? null,
      routedReason: 'self_approval',
      attemptedAction,
    });
    await this.repo.recordAudit(tx, {
      actorId: scope.userId,
      actorRole: scope.roleCode,
      actionCode:
        attemptedAction === 'counter_offer'
          ? 'listing.counter_offer.send'
          : `listing.${attemptedAction}`,
      entityType: 'listing',
      entityId: listing.id,
      outcome: 'DENIED',
      before: { status: listing.status, version: listing.version },
      after: { routedReason: 'self_approval', routedToUserId: target?.userId ?? null },
    });
    return new AppError('SELF_APPROVAL_FORBIDDEN', {
      detail: 'This listing is your own; it has been routed to another admin.',
      meta: { predicate: 'NOT_OWN_LISTING', attemptedAction },
    });
  }

  // ---------------------------------------------------------- farmer helpers

  /** OWN scope narrowing: a foreign listing is indistinguishable from a missing one. */
  private async requireOwnListing(
    tx: Executor,
    scope: ResolvedScope,
    listingId: string,
  ): Promise<AdminListingView> {
    const listing = await this.repo.findAdminListing(tx, listingId);
    // Cross-scope reads return an empty result set, not a 403 — a 403 would
    // leak the existence of another farmer's listing.
    if (listing === null || scope.farmerId === undefined || listing.farmerId !== scope.farmerId) {
      throw new AppError('NOT_FOUND', { detail: 'Listing not found.' });
    }
    return listing;
  }

  /**
   * Load the offer a farmer wants to respond to and enforce BR-10 with the
   * SERVER clock: a response at expires_at + 1s is refused, one millisecond
   * before is allowed, and no client input can move either boundary.
   */
  private async requireRespondableOffer(
    tx: Executor,
    listingId: string,
    offerId: string,
  ): Promise<CounterOfferRow> {
    const offer = await this.repo.findOfferById(tx, listingId, offerId);
    if (offer === null) {
      throw new AppError('NOT_FOUND', { detail: 'Counter-offer not found.' });
    }
    if (offer.status === 'LAPSED') {
      throw new AppError('COUNTER_OFFER_EXPIRED', {
        detail: 'This counter-offer expired unanswered; the listing is back in the admin queue.',
      });
    }
    if (offer.status !== 'PENDING') {
      throw new AppError('CONFLICT', {
        detail: `This counter-offer has already been answered.`,
      });
    }
    if (offer.expiresAt.getTime() <= Date.now()) {
      // Deliberately no mutation here: lapsing the offer is the sweep's job.
      // The response is refused and reported as expired — never as accepted
      // and never as rejected (BR-10).
      throw new AppError('COUNTER_OFFER_EXPIRED', {
        detail: 'The response window for this counter-offer has closed.',
        meta: { expiredAt: offer.expiresAt.toISOString() },
      });
    }
    return offer;
  }

  // ----------------------------------------------------------- admin actions

  /**
   * POST /admin/listings/{id}/counter-offers — the admin's counter, opening
   * the negotiation (round 1) or answering a pending offer. The 24-hour
   * window is computed HERE from system_config, server-side (BR-10); a
   * Farmer Admin countering their own listing is denied and routed (BR-29).
   */
  async sendCounterOffer(
    _actor: Actor,
    scope: ResolvedScope,
    listingId: string,
    body: CounterOfferCreateBody,
  ): Promise<CounterOfferView> {
    const outcome = await this.runTx(
      async (tx): Promise<TxOutcome<CounterOfferView>> => {
        const listing = await this.repo.findAdminListing(tx, listingId);
        if (listing === null) {
          throw new AppError('NOT_FOUND', { detail: 'Listing not found.' });
        }

        if (isOwnListing(scope, listing)) {
          return { denied: await this.routeAwayFromOwner(tx, scope, listing, 'counter_offer') };
        }

        if (!PENDABLE_STATUSES.includes(listing.status as (typeof PENDABLE_STATUSES)[number])) {
          throw new AppError('LISTING_NOT_PENDING', {
            detail: `Counter-offers require a pending listing (current status: ${listing.status}).`,
          });
        }

        const [windowHours, roundLimit] = await Promise.all([
          this.requireWindowHours(tx),
          this.requireRoundLimit(tx),
        ]);
        const maxRound = await this.repo.getMaxRound(tx, listingId);
        const round = maxRound + 1;
        if (round > roundCeiling(roundLimit)) {
          throw new AppError('COUNTER_LIMIT_REACHED', {
            detail: 'This listing has no counter rounds left; approve or reject it.',
            meta: { maxRound, roundCeiling: roundCeiling(roundLimit) },
          });
        }

        // Capture the offer being answered BEFORE the insert, or the newest
        // PENDING row would be the one we are about to create.
        const priorPending = await this.repo.findLatestPendingOffer(tx, listingId);

        // Server clock only. No client-supplied timestamp exists on this path.
        const expiresAt = new Date(Date.now() + windowHours * 60 * 60 * 1000);
        const offer = await this.repo.insertCounterOffer(tx, {
          listingId,
          round,
          actor: 'ADMIN',
          actorUserId: scope.userId,
          pricePerKg: body.pricePerKg,
          quantityKg: body.quantityKg,
          message: body.message ?? null,
          expiresAt,
        });

        if (priorPending !== null) {
          // The new counter supersedes whatever was on the table.
          await this.repo.transitionOfferStatus(
            tx,
            priorPending.id,
            'COUNTERED',
            scope.userId,
          );
        }

        // The optimistic lock serialises this against a concurrent accept /
        // reject / approve on the same listing: the loser sees rowCount 0.
        const updated = await this.repo.transitionListingStatus(
          tx,
          listingId,
          'COUNTER_OFFERED',
          [...PENDABLE_STATUSES],
          listing.version,
        );
        if (updated === null) {
          throw new AppError('CONFLICT', {
            detail: 'The listing was modified by another request. Please refresh and try again.',
          });
        }

        await this.repo.recordAudit(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'listing.counter_offer.send',
          entityType: 'counter_offer',
          entityId: offer.id,
          before: { status: listing.status, version: listing.version },
          after: { status: updated.status, version: updated.version, round, expiresAt: expiresAt.toISOString() },
          changedFields: ['status', 'version'],
        });

        return {
          result: toCounterOfferView(offer),
        };
      },
    );

    if (outcome.denied !== undefined) throw outcome.denied;

    // After commit, not inside the tx — a slow or failing subscriber must
    // never roll back the business change (S-15 fault isolation).
    const listing = await this.repo.findAdminListing(this.dbPool, listingId);
    if (listing !== null) {
      await eventBus.publish('counter_offer.received', {
        userId: listing.ownerUserId,
        listingId,
        offerPrice: outcome.result.pricePerKg,
        originalPrice: listing.askingPricePerKg,
      });
    }
    return outcome.result;
  }

  /**
   * POST /admin/listings/{id}/approve — approval accepts the listing at its
   * asking price (BR-29 denial + auto-route for the owner). Any offer still
   * pending is superseded by the decision. The purchase order itself is
   * raised by the S-24 story; `body.warehouseId` is validated per the spec
   * and consumed there.
   */
  async approveListing(
    _actor: Actor,
    scope: ResolvedScope,
    listingId: string,
    _body: AdminApproveListingBody,
  ): Promise<AdminListingView> {
    const outcome = await this.runTx(
      async (tx): Promise<TxOutcome<AdminListingView>> => {
        const listing = await this.repo.findAdminListing(tx, listingId);
        if (listing === null) {
          throw new AppError('NOT_FOUND', { detail: 'Listing not found.' });
        }

        if (isOwnListing(scope, listing)) {
          return { denied: await this.routeAwayFromOwner(tx, scope, listing, 'approve') };
        }

        if (!PENDABLE_STATUSES.includes(listing.status as (typeof PENDABLE_STATUSES)[number])) {
          throw new AppError('LISTING_NOT_PENDING', {
            detail: `Only pending listings can be approved (current status: ${listing.status}).`,
          });
        }

        const updated = await this.repo.transitionListingStatus(
          tx,
          listingId,
          'ACCEPTED',
          [...PENDABLE_STATUSES],
          listing.version,
          {
            finalPricePerKg: listing.askingPricePerKg,
            finalQuantityKg: listing.quantityKg,
            approvedBy: scope.userId,
            approvedAt: new Date(),
          },
        );
        if (updated === null) {
          throw new AppError('CONFLICT', {
            detail: 'The listing was modified by another request. Please refresh and try again.',
          });
        }

        // A live negotiation dies with the decision: supersede the pending
        // offer so the "one PENDING offer per listing" invariant holds.
        const priorPending = await this.repo.findLatestPendingOffer(tx, listingId);
        if (priorPending !== null) {
          await this.repo.transitionOfferStatus(tx, priorPending.id, 'COUNTERED', scope.userId);
        }

        await this.repo.recordAudit(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'listing.approve',
          entityType: 'listing',
          entityId: listingId,
          before: { status: listing.status, version: listing.version },
          after: { status: updated.status, version: updated.version },
          changedFields: ['status', 'version', 'finalPricePerKg', 'finalQuantityKg', 'approvedBy', 'approvedAt'],
        });

        return { result: updated };
      },
    );

    if (outcome.denied !== undefined) throw outcome.denied;
    return outcome.result;
  }

  /**
   * POST /admin/listings/{id}/reject — the listing leaves the queue with the
   * reason the farmer sees; the same BR-29 denial + auto-route applies.
   */
  async rejectListing(
    _actor: Actor,
    scope: ResolvedScope,
    listingId: string,
    body: AdminRejectListingBody,
  ): Promise<AdminListingView> {
    const outcome = await this.runTx(
      async (tx): Promise<TxOutcome<AdminListingView>> => {
        const listing = await this.repo.findAdminListing(tx, listingId);
        if (listing === null) {
          throw new AppError('NOT_FOUND', { detail: 'Listing not found.' });
        }

        if (isOwnListing(scope, listing)) {
          return { denied: await this.routeAwayFromOwner(tx, scope, listing, 'reject') };
        }

        if (!PENDABLE_STATUSES.includes(listing.status as (typeof PENDABLE_STATUSES)[number])) {
          throw new AppError('LISTING_NOT_PENDING', {
            detail: `Only pending listings can be rejected (current status: ${listing.status}).`,
          });
        }

        const updated = await this.repo.transitionListingStatus(
          tx,
          listingId,
          'REJECTED',
          [...PENDABLE_STATUSES],
          listing.version,
          {
            rejectedBy: scope.userId,
            rejectedAt: new Date(),
            rejectionReason: body.reason,
          },
        );
        if (updated === null) {
          throw new AppError('CONFLICT', {
            detail: 'The listing was modified by another request. Please refresh and try again.',
          });
        }

        const priorPending = await this.repo.findLatestPendingOffer(tx, listingId);
        if (priorPending !== null) {
          // The decision kills the live offer; the audit row below carries the
          // reason code so this is never confused with the farmer's own reject.
          await this.repo.transitionOfferStatus(tx, priorPending.id, 'REJECTED', scope.userId);
        }

        await this.repo.recordAudit(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'listing.reject',
          entityType: 'listing',
          entityId: listingId,
          before: { status: listing.status, version: listing.version },
          after: { status: updated.status, version: updated.version, reasonCode: body.reasonCode },
          changedFields: ['status', 'version', 'rejectedBy', 'rejectedAt', 'rejectionReason'],
        });

        return { result: updated };
      },
    );

    if (outcome.denied !== undefined) throw outcome.denied;
    return outcome.result;
  }

  // --------------------------------------------------------- farmer responses

  /**
   * POST /listings/{id}/counter-offers/{offerId}/accept — accepting fixes the
   * final price and quantity at the offer's terms and moves the listing to
   * ACCEPTED. Refused with 409 COUNTER_OFFER_EXPIRED past the window (BR-10a).
   */
  async respondAccept(
    _actor: Actor,
    scope: ResolvedScope,
    listingId: string,
    offerId: string,
  ): Promise<AdminListingView> {
    return this.runTx(async (tx) => {
      const listing = await this.requireOwnListing(tx, scope, listingId);
      if (listing.status !== 'COUNTER_OFFERED') {
        throw new AppError('LISTING_NOT_PENDING', {
          detail: `This listing is not open for a response (current status: ${listing.status}).`,
        });
      }
      const offer = await this.requireRespondableOffer(tx, listingId, offerId);
      if (offer.actor !== 'ADMIN') {
        throw new AppError('CONFLICT', {
          detail: 'You cannot accept your own counter-offer.',
        });
      }

      const updated = await this.repo.transitionListingStatus(
        tx,
        listingId,
        'ACCEPTED',
        ['COUNTER_OFFERED'],
        listing.version,
        {
          finalPricePerKg: offer.pricePerKg,
          finalQuantityKg: offer.quantityKg,
        },
      );
      if (updated === null) {
        throw new AppError('CONFLICT', {
          detail: 'The listing was modified by another request. Please refresh and try again.',
        });
      }

      const moved = await this.repo.transitionOfferStatus(tx, offerId, 'ACCEPTED', scope.userId);
      if (!moved) {
        throw new AppError('CONFLICT', {
          detail: 'This counter-offer was answered by another request.',
        });
      }

      await this.repo.recordAudit(tx, {
        actorId: scope.userId,
        actorRole: scope.roleCode,
        actionCode: 'listing.counter_offer.respond',
        entityType: 'counter_offer',
        entityId: offerId,
        before: { status: offer.status },
        after: { status: 'ACCEPTED', listingStatus: updated.status },
        changedFields: ['status'],
      });

      return updated;
    });
  }

  /**
   * POST /listings/{id}/counter-offers/{offerId}/reject — the farmer declines
   * the counter; the round closes and the listing returns to the admin queue
   * for a further decision (BR-10).
   */
  async respondReject(
    _actor: Actor,
    scope: ResolvedScope,
    listingId: string,
    offerId: string,
    message: string | null,
  ): Promise<CounterOfferView> {
    return this.runTx(async (tx) => {
      const listing = await this.requireOwnListing(tx, scope, listingId);
      if (listing.status !== 'COUNTER_OFFERED') {
        throw new AppError('LISTING_NOT_PENDING', {
          detail: `This listing is not open for a response (current status: ${listing.status}).`,
        });
      }
      const offer = await this.requireRespondableOffer(tx, listingId, offerId);
      if (offer.actor !== 'ADMIN') {
        throw new AppError('CONFLICT', {
          detail: 'You cannot reject your own counter-offer.',
        });
      }

      const moved = await this.repo.transitionOfferStatus(tx, offerId, 'REJECTED', scope.userId);
      if (!moved) {
        throw new AppError('CONFLICT', {
          detail: 'This counter-offer was answered by another request.',
        });
      }

      const updated = await this.repo.transitionListingStatus(
        tx,
        listingId,
        'PENDING_APPROVAL',
        ['COUNTER_OFFERED'],
        listing.version,
      );
      if (updated === null) {
        throw new AppError('CONFLICT', {
          detail: 'The listing was modified by another request. Please refresh and try again.',
        });
      }

      await this.repo.recordAudit(tx, {
        actorId: scope.userId,
        actorRole: scope.roleCode,
        actionCode: 'listing.counter_offer.respond',
        entityType: 'counter_offer',
        entityId: offerId,
        before: { status: offer.status },
        after: { status: 'REJECTED', listingStatus: updated.status, message },
        changedFields: ['status'],
      });

      return toCounterOfferView({ ...offer, status: 'REJECTED' });
    });
  }

  /**
   * POST /listings/{id}/counter-offers/{offerId}/counter — the farmer counters
   * back, opening round N+1. The farmer budget (BR-11) and the round ceiling
   * both refuse with 409 COUNTER_LIMIT_REACHED; a concurrent double-submit
   * loses to UNIQUE(listing_id, round) and surfaces as a 409 conflict
   * (BR-11b) — never two rows with the same round.
   */
  async respondCounter(
    _actor: Actor,
    scope: ResolvedScope,
    listingId: string,
    offerId: string,
    body: CounterOfferCreateBody,
  ): Promise<CounterOfferView> {
    return this.runTx(async (tx) => {
      const listing = await this.requireOwnListing(tx, scope, listingId);
      if (listing.status !== 'COUNTER_OFFERED') {
        throw new AppError('LISTING_NOT_PENDING', {
          detail: `This listing is not open for a response (current status: ${listing.status}).`,
        });
      }
      const offer = await this.requireRespondableOffer(tx, listingId, offerId);

      const [windowHours, roundLimit] = await Promise.all([
        this.requireWindowHours(tx),
        this.requireRoundLimit(tx),
      ]);

      const farmerCounters = await this.repo.countFarmerCounters(tx, listingId);
      if (farmerCounters >= roundLimit) {
        throw new AppError('COUNTER_LIMIT_REACHED', {
          detail: 'You have countered the maximum number of times; accept or reject the offer.',
          meta: { farmerCounters, roundLimit },
        });
      }
      const maxRound = await this.repo.getMaxRound(tx, listingId);
      const round = maxRound + 1;
      if (round > roundCeiling(roundLimit)) {
        throw new AppError('COUNTER_LIMIT_REACHED', {
          detail: 'No counter rounds remain for this listing; accept or reject the offer.',
          meta: { maxRound, roundCeiling: roundCeiling(roundLimit) },
        });
      }

      // Server-computed window again — the farmer's clock is irrelevant.
      const expiresAt = new Date(Date.now() + windowHours * 60 * 60 * 1000);
      let created: CounterOfferRow;
      try {
        created = await this.repo.insertCounterOffer(tx, {
          listingId,
          round,
          actor: 'FARMER',
          actorUserId: scope.userId,
          pricePerKg: body.pricePerKg,
          quantityKg: body.quantityKg,
          message: body.message ?? null,
          expiresAt,
        });
      } catch (error) {
        if (isUniqueRoundViolation(error)) {
          // The constraint decided the race; translate, never pre-check.
          throw new AppError('CONFLICT', {
            detail: 'This round was submitted concurrently; exactly one counter-offer was recorded.',
            cause: error,
          });
        }
        throw error;
      }

      // The countered offer (the admin's, or the farmer's own earlier counter)
      // is superseded by the new round.
      const superseded = await this.repo.transitionOfferStatus(
        tx,
        offerId,
        'COUNTERED',
        scope.userId,
      );
      if (!superseded) {
        throw new AppError('CONFLICT', {
          detail: 'This counter-offer was answered by another request.',
        });
      }

      await this.repo.recordAudit(tx, {
        actorId: scope.userId,
        actorRole: scope.roleCode,
        actionCode: 'listing.counter_offer.respond',
        entityType: 'counter_offer',
        entityId: created.id,
        before: { status: offer.status, round: offer.round },
        after: { status: 'PENDING', round, expiresAt: expiresAt.toISOString() },
        changedFields: ['round'],
      });

      return toCounterOfferView(created);
    });
  }

  // ----------------------------------------------------------- expiry sweep

  /**
   * BR-10b: lapse every offer whose window ran out and return its listing to
   * the admin queue. Idempotent by construction — the offer transition only
   * fires while the row is still PENDING, so a second run (or a second
   * worker) observes rowCount 0 and changes nothing. A lapse is NOT an
   * acceptance and NOT a rejection: `responded_at`/`responded_by` stay NULL.
   */
  async sweepExpiredOffers(): Promise<{
    scanned: number;
    offersLapsed: number;
    listingsReverted: number;
  }> {
    const expired = await this.repo.findExpiredPendingOffers(this.dbPool, SWEEP_BATCH);
    let offersLapsed = 0;
    let listingsReverted = 0;

    for (const offer of expired) {
      await this.runTx(async (tx) => {
        const lapsed = await this.repo.transitionOfferStatus(tx, offer.id, 'LAPSED', null);
        if (!lapsed) return; // already answered or lapsed — the guard IS the idempotency

        offersLapsed += 1;

        const listing = await this.repo.findAdminListing(tx, offer.listingId);
        if (listing !== null && listing.status === 'COUNTER_OFFERED') {
          const reverted = await this.repo.transitionListingStatus(
            tx,
            listing.id,
            'PENDING_APPROVAL',
            ['COUNTER_OFFERED'],
            listing.version,
          );
          if (reverted !== null) listingsReverted += 1;
        }

        await this.repo.recordAudit(tx, {
          actorId: null,
          actorType: 'JOB',
          actionCode: 'counter_offer.expiry_sweep',
          entityType: 'counter_offer',
          entityId: offer.id,
          before: { status: 'PENDING' },
          after: { status: 'LAPSED' },
          changedFields: ['status'],
        });
      });
    }

    return { scanned: expired.length, offersLapsed, listingsReverted };
  }
}

export const counterOffersService = new CounterOffersService();
