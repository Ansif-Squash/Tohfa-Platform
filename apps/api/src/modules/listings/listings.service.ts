import type { Executor } from '../../db/pool.js';
import { pool, withTransaction } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import { scopedWhere, type ResolvedScope } from '../../rbac/requirePermission.js';
import { listingsRepo, type ListingsRepo } from './listings.repo.ts';
import type {
  ApproveListingBody,
  CounterOfferBody,
  CounterOfferResponse,
  CreateListingBody,
  ListingResponse,
  ListListingsQuery,
  ListListingsResponse,
  RejectListingBody,
  UpdateListingBody,
  WithdrawListingBody,
} from './listings.schema.ts';
import { Money } from '@tohfa/shared-types';

export interface ListingsServiceDeps {
  repo: ListingsRepo;
  db: Executor;
}

export function createListingsService(
  deps: Partial<ListingsServiceDeps> = {},
): ListingsService {
  const repo = deps.repo ?? listingsRepo;
  const db = deps.db ?? pool;

  /** BR-29: Denies self-approval and routes to another admin */
  async function checkSelfApproval(
    scope: ResolvedScope,
    listing: ListingResponse,
    attemptedAction: 'approve' | 'reject' | 'counter_offer',
  ): Promise<void> {
    const isOwner =
      (scope.actor.farmerId && scope.actor.farmerId === listing.farmerId) ||
      scope.actor.userId === listing.farmerId;

    if (isOwner) {
      const eligibleOtherAdmin = await repo.findEligibleOtherAdmin(db, scope.actor.userId);
      await repo.createListingRouting(db, {
        listingId: listing.id,
        routedFromUserId: scope.actor.userId,
        routedToUserId: eligibleOtherAdmin,
        attemptedAction,
      });
      throw new AppError('SELF_APPROVAL_FORBIDDEN', {
        detail: `You cannot ${attemptedAction} your own listing. It has been automatically routed to another admin.`,
      });
    }
  }

  return {
    async create(scope: ResolvedScope, body: CreateListingBody): Promise<ListingResponse> {
      const farmerId = scope.actor.farmerId;
      if (!farmerId) {
        throw new AppError('FORBIDDEN', { detail: 'Only a registered farmer can create a produce listing.' });
      }

      const today = new Date().toISOString().split('T')[0];

      // Gate 1: BR-01 & BR-02 — Certificate state & market block check
      const certState = await repo.findFarmerCertState(db, farmerId);
      if (!certState) {
        throw new AppError('NOT_FOUND', { detail: 'Farmer record not found.' });
      }
      if (certState.isMarketBlocked) {
        throw new AppError('CERT_UNVERIFIED', { detail: 'Farmer account is currently market-blocked.' });
      }

      const validBadges: Array<{ certType: string; certNumber: string }> = [];
      for (const cert of certState.certificates) {
        if (cert.status !== 'VERIFIED') {
          throw new AppError('CERT_UNVERIFIED', {
            detail: `Certificate ${cert.certNumber} is not verified (status: ${cert.status}).`,
          });
        }
        if (cert.expiresAt && cert.expiresAt < today) {
          throw new AppError('CERT_EXPIRED', {
            detail: `Certificate ${cert.certNumber} expired on ${cert.expiresAt}.`,
          });
        }
        validBadges.push({ certType: cert.certType, certNumber: cert.certNumber });
      }

      // Gate 2: BR-14 — Free-tier concurrent-listing gate
      const { limit, enabled } = await repo.getSystemConfigLimit(db);
      if (enabled) {
        const activeCount = await repo.findActiveCountByFarmer(db, farmerId);
        if (activeCount >= limit) {
          throw new AppError('FREE_TIER_LIMIT', {
            detail: `Free tier concurrent listing limit (${limit}) reached.`,
            meta: { limit, activeCount },
          });
        }
      }

      // Gate 3: BR-07 — Asking price at or below fair price ceiling
      const fairPrice = await repo.findActiveFairPrice(db, body.cropId, body.grade, today);
      if (!fairPrice) {
        throw new AppError('PRICE_ABOVE_CEILING', {
          detail: `No active fair price ceiling established for this crop and grade on ${today}.`,
        });
      }

      const askingMoney = Money.from(body.askingPricePerKg);
      const ceilingMoney = Money.from(fairPrice.ceilingPrice);

      if (askingMoney.amountPaise > ceilingMoney.amountPaise) {
        throw new AppError('PRICE_ABOVE_CEILING', {
          detail: `Asking price ${body.askingPricePerKg} exceeds the ${fairPrice.ceilingPrice} ceiling for this crop and grade.`,
          meta: { ceilingPrice: fairPrice.ceilingPrice, askingPrice: body.askingPricePerKg },
        });
      }

      const listingNumber = `LST-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      return repo.create(db, {
        ...body,
        farmerId,
        listingNumber,
        fairPriceId: fairPrice.id,
        badgesJson: JSON.stringify(validBadges),
      });
    },

    async getById(scope: ResolvedScope, id: string): Promise<ListingResponse> {
      const scopeFilter = scopedWhere(scope, { farmerColumn: 'farmer_id', startIndex: 2 });
      const listing = await repo.findById(db, id, scopeFilter);
      if (!listing) {
        throw new AppError('NOT_FOUND', { detail: `No listing found with ID ${id}.` });
      }
      const latestOffer = await repo.findLatestCounterOffer(db, id);
      return { ...listing, activeCounterOffer: latestOffer };
    },

    async adminCounterOffer(
      scope: ResolvedScope,
      id: string,
      body: CounterOfferBody,
    ): Promise<CounterOfferResponse> {
      const listing = await repo.findById(db, id);
      if (!listing) {
        throw new AppError('NOT_FOUND', { detail: `Listing with ID ${id} not found.` });
      }

      // BR-29: Self-approval check
      await checkSelfApproval(scope, listing, 'counter_offer');

      const windowHours = await repo.getCounterOfferWindowHours(db);

      return withTransaction(async (client) => {
        const offer = await repo.createCounterOffer(client, {
          listingId: id,
          round: 1, // Round 1 is opening admin counter
          actor: 'ADMIN',
          actorUserId: scope.actor.userId,
          pricePerKg: body.pricePerKg,
          quantityKg: body.quantityKg,
          message: body.message,
          windowHours,
        });

        const currentVersion = body.version ?? listing.version;
        await repo.updateListingStatus(client, id, currentVersion, 'COUNTER_OFFERED');

        return offer;
      });
    },

    async farmerAcceptCounterOffer(
      scope: ResolvedScope,
      id: string,
      offerId: string,
    ): Promise<ListingResponse> {
      const listing = await repo.findById(db, id);
      if (!listing) throw new AppError('NOT_FOUND', { detail: 'Listing not found.' });

      const offer = await repo.findCounterOfferById(db, offerId);
      if (!offer) throw new AppError('NOT_FOUND', { detail: 'Counter offer not found.' });

      const now = new Date().toISOString();
      if (offer.status === 'LAPSED' || (offer.expiresAt && offer.expiresAt < now)) {
        throw new AppError('COUNTER_OFFER_EXPIRED', {
          detail: 'Counter offer has expired and cannot be accepted.',
        });
      }

      return withTransaction(async (client) => {
        await repo.updateCounterOfferStatus(client, offerId, 'ACCEPTED', scope.actor.userId);
        const updated = await repo.updateListingStatus(
          client,
          id,
          listing.version,
          'ACCEPTED',
          { finalPricePerKg: offer.pricePerKg, finalQuantityKg: offer.quantityKg },
        );
        if (!updated) throw new AppError('CONFLICT', { detail: 'Listing version mismatch.' });
        return updated;
      });
    },

    async farmerRejectCounterOffer(
      scope: ResolvedScope,
      id: string,
      offerId: string,
    ): Promise<ListingResponse> {
      const listing = await repo.findById(db, id);
      if (!listing) throw new AppError('NOT_FOUND', { detail: 'Listing not found.' });

      const offer = await repo.findCounterOfferById(db, offerId);
      if (!offer) throw new AppError('NOT_FOUND', { detail: 'Counter offer not found.' });

      return withTransaction(async (client) => {
        await repo.updateCounterOfferStatus(client, offerId, 'REJECTED', scope.actor.userId);
        const updated = await repo.updateListingStatus(client, id, listing.version, 'REJECTED', {
          rejectionReason: 'Counter offer rejected by farmer',
        });
        if (!updated) throw new AppError('CONFLICT', { detail: 'Listing version mismatch.' });
        return updated;
      });
    },

    async farmerCounterOffer(
      scope: ResolvedScope,
      id: string,
      offerId: string,
      body: CounterOfferBody,
    ): Promise<CounterOfferResponse> {
      const listing = await repo.findById(db, id);
      if (!listing) throw new AppError('NOT_FOUND', { detail: 'Listing not found.' });

      const prevOffer = await repo.findCounterOfferById(db, offerId);
      if (!prevOffer) throw new AppError('NOT_FOUND', { detail: 'Counter offer not found.' });

      const nextRound = prevOffer.round + 1;

      // BR-11: 3-round farmer cap (Rounds 1..4 in table, max 3 farmer counter attempts)
      if (nextRound > 4) {
        throw new AppError('COUNTER_LIMIT_REACHED', {
          detail: 'No counter-offer rounds remain. You must accept or reject.',
        });
      }

      const windowHours = await repo.getCounterOfferWindowHours(db);

      return withTransaction(async (client) => {
        await repo.updateCounterOfferStatus(client, offerId, 'REJECTED', scope.actor.userId);
        const newOffer = await repo.createCounterOffer(client, {
          listingId: id,
          round: nextRound,
          actor: 'FARMER',
          actorUserId: scope.actor.userId,
          pricePerKg: body.pricePerKg,
          quantityKg: body.quantityKg,
          message: body.message,
          windowHours,
        });

        return newOffer;
      });
    },

    async adminApprove(
      scope: ResolvedScope,
      id: string,
      body: ApproveListingBody,
    ): Promise<ListingResponse> {
      const listing = await repo.findById(db, id);
      if (!listing) throw new AppError('NOT_FOUND', { detail: 'Listing not found.' });

      // BR-29: Self-approval check
      await checkSelfApproval(scope, listing, 'approve');

      const version = body.version ?? listing.version;
      const updated = await repo.updateListingStatus(db, id, version, 'ACCEPTED', {
        approvedBy: scope.actor.userId,
        finalPricePerKg: body.finalPricePerKg ?? listing.askingPricePerKg,
        finalQuantityKg: body.finalQuantityKg ?? listing.quantityKg,
      });

      if (!updated) throw new AppError('CONFLICT', { detail: 'Listing version mismatch.' });
      return updated;
    },

    async adminReject(
      scope: ResolvedScope,
      id: string,
      body: RejectListingBody,
    ): Promise<ListingResponse> {
      const listing = await repo.findById(db, id);
      if (!listing) throw new AppError('NOT_FOUND', { detail: 'Listing not found.' });

      // BR-29: Self-approval check
      await checkSelfApproval(scope, listing, 'reject');

      const version = body.version ?? listing.version;
      const updated = await repo.updateListingStatus(db, id, version, 'REJECTED', {
        rejectedBy: scope.actor.userId,
        rejectionReason: body.reason,
      });

      if (!updated) throw new AppError('CONFLICT', { detail: 'Listing version mismatch.' });
      return updated;
    },

    async update(
      scope: ResolvedScope,
      id: string,
      body: UpdateListingBody,
    ): Promise<ListingResponse> {
      const scopeFilter = scopedWhere(scope, { farmerColumn: 'farmer_id', startIndex: 2 });
      const existing = await repo.findById(db, id, scopeFilter);
      if (!existing) {
        throw new AppError('NOT_FOUND', { detail: `Listing with ID ${id} not found.` });
      }

      if (existing.status !== 'PENDING_APPROVAL') {
        throw new AppError('LISTING_NOT_PENDING', {
          detail: `Only listings in PENDING_APPROVAL status can be edited.`,
        });
      }

      let newFairPriceId: string | undefined;
      if (body.askingPricePerKg) {
        const today = new Date().toISOString().split('T')[0];
        const fairPrice = await repo.findActiveFairPrice(db, existing.cropId, existing.grade, today);
        if (!fairPrice) {
          throw new AppError('PRICE_ABOVE_CEILING', { detail: 'No active fair price ceiling found.' });
        }
        const askingMoney = Money.from(body.askingPricePerKg);
        const ceilingMoney = Money.from(fairPrice.ceilingPrice);
        if (askingMoney.amountPaise > ceilingMoney.amountPaise) {
          throw new AppError('PRICE_ABOVE_CEILING', { detail: 'Updated price exceeds ceiling.' });
        }
        newFairPriceId = fairPrice.id;
      }

      const updated = await repo.update(db, id, body.version, body, newFairPriceId);
      if (!updated) throw new AppError('CONFLICT', { detail: 'Listing version mismatch.' });
      return updated;
    },

    async withdraw(
      scope: ResolvedScope,
      id: string,
      body: WithdrawListingBody,
    ): Promise<ListingResponse> {
      const scopeFilter = scopedWhere(scope, { farmerColumn: 'farmer_id', startIndex: 2 });
      const existing = await repo.findById(db, id, scopeFilter);
      if (!existing) throw new AppError('NOT_FOUND', { detail: 'Listing not found.' });

      if (existing.status !== 'PENDING_APPROVAL' && existing.status !== 'DRAFT') {
        throw new AppError('INVALID_STATE_TRANSITION', { detail: 'Cannot withdraw listing.' });
      }

      const withdrawn = await repo.withdraw(db, id, body.version ?? existing.version, body.reason);
      if (!withdrawn) throw new AppError('CONFLICT', { detail: 'Listing version mismatch.' });
      return withdrawn;
    },

    async list(scope: ResolvedScope, filters: ListListingsQuery): Promise<ListListingsResponse> {
      const scopeFilter = scopedWhere(scope, { farmerColumn: 'farmer_id', startIndex: 1 });
      const { items, summary } = await repo.list(db, { filters, scope: scopeFilter });
      const nextCursor = items.length >= filters.limit ? items[items.length - 1].id : null;
      return { items, page: { nextCursor, hasMore: nextCursor !== null }, summary };
    },
  };
}

export interface ListingsService {
  create(scope: ResolvedScope, body: CreateListingBody): Promise<ListingResponse>;
  getById(scope: ResolvedScope, id: string): Promise<ListingResponse>;
  adminCounterOffer(
    scope: ResolvedScope,
    id: string,
    body: CounterOfferBody,
  ): Promise<CounterOfferResponse>;
  farmerAcceptCounterOffer(
    scope: ResolvedScope,
    id: string,
    offerId: string,
  ): Promise<ListingResponse>;
  farmerRejectCounterOffer(
    scope: ResolvedScope,
    id: string,
    offerId: string,
  ): Promise<ListingResponse>;
  farmerCounterOffer(
    scope: ResolvedScope,
    id: string,
    offerId: string,
    body: CounterOfferBody,
  ): Promise<CounterOfferResponse>;
  adminApprove(scope: ResolvedScope, id: string, body: ApproveListingBody): Promise<ListingResponse>;
  adminReject(scope: ResolvedScope, id: string, body: RejectListingBody): Promise<ListingResponse>;
  update(scope: ResolvedScope, id: string, body: UpdateListingBody): Promise<ListingResponse>;
  withdraw(scope: ResolvedScope, id: string, body: WithdrawListingBody): Promise<ListingResponse>;
  list(scope: ResolvedScope, filters: ListListingsQuery): Promise<ListListingsResponse>;
}

export const listingsService: ListingsService = createListingsService();
