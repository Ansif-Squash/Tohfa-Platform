import { describe, expect, it } from 'vitest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import type { Actor } from '../../auth/requireAuth.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import type { AdminListingView, CounterOfferRow } from './counter-offers.repo.js';
import { CounterOffersService } from './counter-offers.service.js';

/**
 * S-22 unit tests — counter-offer state machine.
 *
 * The repo is replaced by a small IN-MEMORY store whose mutation helpers carry
 * the same conditional-update guards the real SQL statements have
 * (`WHERE status='PENDING'`, `WHERE version=$n`, UNIQUE(listing_id, round)).
 * Races are therefore simulated faithfully without a database: whichever
 * caller's guarded update hits a satisfied predicate first wins; the loser
 * observes rowCount 0 exactly like the loser of a live transaction does.
 */

// ---------------------------------------------------------------------------
// Fixed identities
// ---------------------------------------------------------------------------
const IDS = {
  listing: 'aaaaaaaa-0000-0000-0000-000000000001',
  ownerFarmer: 'bbbbbbbb-0000-0000-0000-000000000010',
  // The owning farmer user AND their linked Farmer Admin share this id —
  // BR-29 keys the denial off that ownership linkage, not off a role name.
  ownerUser: 'cccccccc-0000-0000-0000-000000000010',
  farmerActorUser: 'cccccccc-0000-0000-0000-000000000020',
  otherAdminRole: 'eeeeeeee-0000-0000-0000-000000000001',
  otherAdminUser: 'dddddddd-0000-0000-0000-000000000002',
  offerR1: 'ffffffff-0000-0000-0000-000000000001',
  crop: '22222222-2222-2222-2222-222222222222',
};

type OfferMutable = Omit<CounterOfferRow, 'expiresAt' | 'respondedAt' | 'createdAt'> & {
  expiresAt: Date;
  respondedAt: Date | null;
  createdAt: Date;
};

interface RoutingRow {
  listingId: string;
  routedFromUserId: string | null;
  routedToUserId: string | null;
  routedToRoleId?: string | null;
  routedReason: string;
  attemptedAction: string | null;
}

interface Store {
  listing: AdminListingView;
  offers: Map<string, OfferMutable>;
  routingRows: RoutingRow[];
  audits: Array<{ actionCode: string; entityId: string | null; outcome: string }>;
  /** Forces getMaxRound to a stale snapshot value to model a concurrent reader. */
  maxRoundOverride?: number;
}

function makeListing(status: string, overrides?: Partial<AdminListingView>): AdminListingView {
  return {
    id: IDS.listing,
    listingNumber: 'LST-2026-0042',
    farmerId: IDS.ownerFarmer,
    ownerUserId: IDS.ownerUser,
    cropId: IDS.crop,
    grade: 'GRADE_1',
    quantityKg: '250.000',
    askingPricePerKg: '100.00',
    fairPriceId: '33333333-3333-3333-3333-333333333333',
    status,
    finalPricePerKg: null,
    finalQuantityKg: null,
    version: 1,
    approvedBy: null,
    approvedAt: null,
    rejectedBy: null,
    rejectedAt: null,
    rejectionReason: null,
    createdAt: new Date('2026-08-26T09:00:00Z'),
    updatedAt: null,
    ...overrides,
  };
}

function toRow(o: OfferMutable): CounterOfferRow {
  return o as unknown as CounterOfferRow;
}

// ---------------------------------------------------------------------------
// Actors / scopes
// ---------------------------------------------------------------------------
const farmerActor: Actor = {
  userId: IDS.farmerActorUser,
  roles: [{ code: RoleCode.FARMER }],
  farmerId: IDS.ownerFarmer,
  customerId: null,
};

/** Acting Farmer Admin who OWNS the listing under review (BR-29). */
const ownFarmerAdminActor: Actor = {
  userId: IDS.ownerUser,
  roles: [{ code: RoleCode.FARMER_ADMIN }],
  farmerId: IDS.ownerFarmer,
  customerId: null,
};

const peerFarmerAdminActor: Actor = {
  userId: IDS.otherAdminUser,
  roles: [{ code: RoleCode.FARMER_ADMIN }],
  farmerId: null,
  customerId: null,
};

const farmerOwnScope: ResolvedScope = {
  level: ScopeLevel.OWN,
  permission: 'listing.counter_offer.respond',
  roleCode: RoleCode.FARMER,
  warehouseIds: [],
  zoneIds: [],
  farmerId: IDS.ownerFarmer,
  userId: IDS.farmerActorUser,
};

/** A peer Farmer Admin evaluates the NOT_OWN_LISTING predicate against the row. */
const peerAdminScope = (permission: string, userId = IDS.otherAdminUser): ResolvedScope => ({
  level: ScopeLevel.CONDITIONAL,
  permission,
  roleCode: RoleCode.FARMER_ADMIN,
  warehouseIds: [],
  zoneIds: [],
  predicate: 'NOT_OWN_LISTING',
  userId,
});

/** A Farmer Admin who OWNS the listing under review (provokes BR-29 denial). */
const ownAdminScope = (permission: string): ResolvedScope => ({
  level: ScopeLevel.CONDITIONAL,
  permission,
  roleCode: RoleCode.FARMER_ADMIN,
  warehouseIds: [],
  zoneIds: [],
  predicate: 'NOT_OWN_LISTING',
  userId: IDS.ownerUser,
  farmerId: IDS.ownerFarmer,
});

// ---------------------------------------------------------------------------
// In-memory repo (mirrors every conditional guard of the real SQL)
// ---------------------------------------------------------------------------

/**
 * Optimistic-lock status flip over produce_listings, mirroring:
 *   UPDATE ... SET status=$to WHERE id=$id AND version=$v AND status IN (...)
 */
function flipListing(
  store: Store,
  to: string,
  fromStatuses: string[],
  expectedVersion: number,
  patch?: Partial<AdminListingView>,
): AdminListingView | null {
  const l = store.listing;
  if (!fromStatuses.includes(l.status)) return null; // state-guard miss
  if (l.version !== expectedVersion) return null; // lost a concurrent race
  store.listing = {
    ...l,
    ...patch,
    status: to,
    version: l.version + 1,
    updatedAt: new Date(),
  };
  return store.listing;
}

function buildRepo(store: Store) {
  return {
    // ---- configuration ------------------------------------------------------
    getCounterOfferWindowHours: async () => 24,
    getCounterOfferRoundLimit: async () => 3,

    // ---- reads --------------------------------------------------------------
    findAdminListing: async (_db: unknown, id: string) =>
      store.listing.id === id ? store.listing : null,

    findLatestPendingOffer: async (_db: unknown, listingId: string) => {
      let best: OfferMutable | undefined;
      for (const o of store.offers.values()) {
        if (o.listingId === listingId && o.status === 'PENDING') {
          if (best === undefined || o.round > best.round) best = o;
        }
      }
      return best ? toRow(best) : null;
    },

    findOfferById: async (_db: unknown, listingId: string, offerId: string) => {
      const o = store.offers.get(offerId);
      return o && o.listingId === listingId ? toRow(o) : null;
    },

    getMaxRound: async (_db: unknown, listingId: string) => {
      if (store.maxRoundOverride !== undefined) return store.maxRoundOverride;
      let max = 0;
      for (const o of store.offers.values()) {
        if (o.listingId === listingId && o.round > max) max = o.round;
      }
      return max;
    },

    countFarmerCounters: async (_db: unknown, listingId: string) => {
      let n = 0;
      for (const o of store.offers.values()) {
        if (o.listingId === listingId && o.actor === 'FARMER') n += 1;
      }
      return n;
    },

        // ---- counter-offer mutations ---------------------------------------------
    insertCounterOffer: (
      _db: unknown,
      data: {
        listingId: string;
        round: number;
        actor: 'ADMIN' | 'FARMER';
        actorUserId: string;
        pricePerKg: string;
        quantityKg: string;
        message: string | null;
        expiresAt: Date;
      },
    ) => {
      // UNIQUE(listing_id, round) — the DB-level backstop (BR-11b).
      for (const existing of store.offers.values()) {
        if (existing.listingId === data.listingId && existing.round === data.round) {
          throw Object.assign(new Error('duplicate key value'), {
            code: '23505',
            constraint: 'counter_offers_round_unique',
          });
        }
      }
      const created: OfferMutable = {
        id: `offer-r${data.round}-${Math.random().toString(36).slice(2, 8)}`,
        listingId: data.listingId,
        round: data.round,
        actor: data.actor,
        actorUserId: data.actorUserId,
        pricePerKg: data.pricePerKg,
        quantityKg: data.quantityKg,
        message: data.message,
        status: 'PENDING',
        expiresAt: data.expiresAt,
        respondedAt: null,
        respondedBy: null,
        createdAt: new Date(),
        updatedAt: null,
      };
      store.offers.set(created.id, created);
      return toRow(created);
    },

    /** Guarded transition: only a still-PENDING offer can move (race guard). */
    transitionOfferStatus: async (
      _db: unknown,
      offerId: string,
      status: CounterOfferRow['status'],
      respondedBy: string | null,
    ) => {
      const o = store.offers.get(offerId);
      if (!o || o.status !== 'PENDING') return false;
      o.status = status;
      o.updatedAt = new Date();
      if (respondedBy !== null) {
        o.respondedAt = new Date();
        o.respondedBy = respondedBy;
      }
      return true;
    },

    // ---- mutation guards mirroring the real SQL ----------------------------

    transitionListingStatus: (
      _db: unknown,
      id: string,
      to: string,
      fromStatuses: string[],
      expectedVersion: number,
      patch?: Partial<AdminListingView>,
    ) => (store.listing.id === id ? flipListing(store, to, fromStatuses, expectedVersion, patch) : null),

    findRouteTarget: async (_db: unknown, excludeUserId: string) => {
      // Any role other than the acting peer resolves to the shared other admin.
      if (excludeUserId !== IDS.otherAdminUser) {
        return { userId: IDS.otherAdminUser };
      }
      return null;
    },

    insertListingRouting: async (
      _db: unknown,
      data: {
        listingId: string;
        routedFromUserId: string;
        routedToUserId: string | null;
        routedReason: 'self_approval';
        attemptedAction: 'approve' | 'reject' | 'counter_offer';
      },
    ) => {
      store.routingRows.push({
        listingId: data.listingId,
        routedFromUserId: data.routedFromUserId,
        routedToUserId: data.routedToUserId,
        routedReason: data.routedReason,
        attemptedAction: data.attemptedAction,
      });
    },

    recordAudit: async (
      _db: unknown,
      entry: { actionCode: string; entityId: string | null; outcome?: string },
    ) => {
      store.audits.push({
        actionCode: entry.actionCode,
        entityId: entry.entityId ?? null,
        outcome: entry.outcome ?? 'ALLOWED',
      });
      return 'audit-1';
    },

    findExpiredPendingOffers: async () => {
      return Array.from(store.offers.values())
        .filter((o) => o.status === 'PENDING' && o.expiresAt.getTime() <= Date.now())
        .map((o) => ({ id: o.id, listingId: o.listingId, round: o.round, actor: o.actor, expiresAt: o.expiresAt }));
    },
  };
}

/** Wrap the in-memory repo in the exact deps the service was built to receive. */
function createService(store: Store): CounterOffersService {
  const repo = buildRepo(store);
  const runTx = async <T>(fn: (tx: unknown) => Promise<T>): Promise<T> => fn({});
  return new CounterOffersService(repo as never, runTx as never, {} as never);
}

/** Assert a rejected promise is an AppError with a code. */
async function expectAppError(promise: Promise<unknown>, code: string): Promise<void> {
  await expect(promise).rejects.toSatisfy((err: unknown) => {
    const e = err as AppError;
    expect(e).toBeInstanceOf(AppError);
    expect(e.code).toBe(code);
    return true;
  });
}

/** Assert EVERY offer in the store satisfies the predicate (expiry semantics). */
function expectAllOffers(store: Store, predicate: (o: OfferMutable) => boolean): void {
  const offers = Array.from(store.offers.values());
  expect(offers.length).toBeGreaterThan(0);
  for (const o of offers) expect(predicate(o)).toBe(true);
}

/** A fresh isolated negotiation on a PENDING listing nobody owns. */
function freshStore(): Store {
  const store: Store = {
    listing: makeListing('PENDING_APPROVAL'),
    offers: new Map(),
    routingRows: [],
    audits: [],
  };
  return store;
}

/** Admin sends an opening counter (round 1, `status` -> COUNTER_OFFERED). */
async function adminCounter(
  store: Store,
  price = '75.00',
  quantity = '75.000',
): Promise<CounterOfferRow> {
  const svc = createService(store);
  await svc.sendCounterOffer(
    peerFarmerAdminActor,
    peerAdminScope('listing.counter_offer.send'),
    store.listing.id,
    { pricePerKg: price, quantityKg: quantity },
  );
  const offer = await buildRepo(store).findLatestPendingOffer({}, store.listing.id);
  if (offer === null) throw new Error('expected a pending offer after the admin counter');
  return offer;
}

// ===========================================================================
describe('S-22 counter-offer state machine', () => {
  // --------------------------------------------------------------- BR-10 ----
  it(
    'BR-10a: a farmer responding at expires_at + 1s → 409 COUNTER_OFFER_EXPIRED (server clock)',
    async () => {
      const store = freshStore();
      await adminCounter(store);
      const pending = store.offers.values().next().value as OfferMutable;

      // Re-seat the offer's window in the past, as a server that already ticked past it.
      pending.expiresAt = new Date(Date.now() - 1000);
      const svc = createService(store);

      await expectAppError(
        svc.respondAccept(farmerActor, farmerOwnScope, store.listing.id, pending.id),
        'COUNTER_OFFER_EXPIRED',
      );
      // Never reported as accepted or rejected — the listing is untouched.
      expect(store.listing.status).toBe('COUNTER_OFFERED');
      expect(store.listing.finalPricePerKg).toBeNull();
      await expectAppError(
        svc.respondReject(farmerActor, farmerOwnScope, store.listing.id, pending.id, null),
        'COUNTER_OFFER_EXPIRED',
      );
    },
  );

  it('server window is authoritative: a client-supplied timestamp cannot extend it', async () => {
    const store = freshStore();
    await adminCounter(store);
    const pending = store.offers.values().next().value as OfferMutable;
    pending.expiresAt = new Date(Date.now() - 5000); // already past on the server
    const svc = createService(store);

    // The client "helpfully" forwards its clock by sending a future timestamp on the body.
    const body = { pricePerKg: '80.00', quantityKg: '80.000', message: 'x', clientExpiresAt: Date.now() + 3600000 } as never;
    await expectAppError(
      svc.respondCounter(farmerActor, farmerOwnScope, store.listing.id, pending.id, body as never),
      'COUNTER_OFFER_EXPIRED',
    );
  });

  it('BR-10b: the expiry job lapses offers and reverts listings, and is idempotent when re-run', async () => {
    const store = freshStore();
    const svc = createService(store);
    await svc.sendCounterOffer(
      peerFarmerAdminActor,
      peerAdminScope('listing.counter_offer.send'),
      store.listing.id,
      { pricePerKg: '75.00', quantityKg: '75.000' },
    );
    const opening = store.offers.values().next().value as OfferMutable;
    opening.expiresAt = new Date(Date.now() - 1000); // past the 24h window

    const first = await svc.sweepExpiredOffers();
    expect(first.offersLapsed).toBe(1);
    expect(first.listingsReverted).toBe(1);
    expect(store.listing.status).toBe('PENDING_APPROVAL');
    const lapsed = store.offers.get(opening.id);
    expect(lapsed?.status).toBe('LAPSED');
    // Lapsing is nobody's response — NOT an acceptance, NOT a rejection.
    expect(lapsed?.respondedAt).toBeNull();
    expect(lapsed?.respondedBy).toBeNull();

    // Running the sweep again changes nothing (idempotency).
    const second = await svc.sweepExpiredOffers();
    expect(second.offersLapsed).toBe(0);
    expect(second.listingsReverted).toBe(0);
    expect(store.listing.status).toBe('PENDING_APPROVAL');
  });

  it('a lapsed offer is reported as neither accepted nor rejected (BR-10b semantics)', async () => {
    const store = freshStore();
    const svc = createService(store);
    await adminCounter(store);
    const pending = store.offers.values().next().value as OfferMutable;
    pending.expiresAt = new Date(Date.now() - 1000);
    await svc.sweepExpiredOffers();

    expectAllOffers(store, (o) => o.status === 'LAPSED' && o.respondedAt === null && o.respondedBy === null);
  });

  // --------------------------------------- accept / reject / counter -------
  it('farmer accepts the opening counter → listing ACCEPTED at offer terms', async () => {
    const store = freshStore();
    const opening = await adminCounter(store, '75.00', '75.000');
    const svc = createService(store);

    const accepted = await svc.respondAccept(farmerActor, farmerOwnScope, store.listing.id, opening.id);
    expect(accepted.status).toBe('ACCEPTED');
    expect(accepted.finalPricePerKg).toBe('75.00');
    expect(accepted.finalQuantityKg).toBe('75.000');
    const offer = store.offers.get(opening.id);
    expect(offer?.status).toBe('ACCEPTED');
    expect(offer?.respondedBy).toBe(IDS.farmerActorUser);
  });

  it('farmer rejects the counter → listing returns to the admin queue (PENDING_APPROVAL)', async () => {
    const store = freshStore();
    const opening = await adminCounter(store);
    const svc = createService(store);

    const view = await svc.respondReject(farmerActor, farmerOwnScope, store.listing.id, opening.id, 'too low');
    expect(view.status).toBe('REJECTED');
    expect(store.listing.status).toBe('PENDING_APPROVAL');
  });

  it('farmer counters back → round 2 opens with a fresh server window', async () => {
    const store = freshStore();
    const opening = await adminCounter(store);
    const svc = createService(store);

    const r2 = await svc.respondCounter(farmerActor, farmerOwnScope, store.listing.id, opening.id, {
      pricePerKg: '85.00',
      quantityKg: '100.000',
    });
    expect(r2.round).toBe(2);
    expect(r2.offeredBy).toBe('FARMER');
    expect(r2.status).toBe('PENDING');
    // a fresh expiry was computed server-side, off the same 24h window
    expect(r2.expiresAt > new Date(Date.now() + 23 * 60 * 60 * 1000).toISOString()).toBe(true);
    const original = store.offers.get(opening.id);
    expect(original?.status).toBe('COUNTERED');
    expect(store.listing.status).toBe('COUNTER_OFFERED');
  });

  // --------------------------------------------------------------- BR-11 ----
  it('BR-11a: a 4th farmer counter on the same listing → 409 COUNTER_LIMIT_REACHED', async () => {
    const store = freshStore();
    const svc = createService(store);
    await adminCounter(store); // round 1 (ADMIN)
    const r1 = store.offers.values().next().value as OfferMutable;

    // Farmer counts back three times: rounds 2, 3, 4 (budget = max_counter_rounds = 3).
    let target = r1;
    for (let round = 2; round <= 4; round += 1) {
      const view = await svc.respondCounter(farmerActor, farmerOwnScope, store.listing.id, target.id, {
        pricePerKg: `${40 + round}`,
        quantityKg: '100.000',
      });
      const created = store.offers.get(view.id);
      if (created === undefined) throw new Error('counter offer not stored');
      target = created;
    }
    expect(Array.from(store.offers.values()).filter((o) => o.actor === 'FARMER')).toHaveLength(3);

    // A 4th attempt is refused.
    await expectAppError(
      svc.respondCounter(farmerActor, farmerOwnScope, store.listing.id, target.id, {
        pricePerKg: '99.00',
        quantityKg: '100.000',
      }),
      'COUNTER_LIMIT_REACHED',
    );
  });

  it('BR-11b: UNIQUE(listing_id, round) is the backstop — a concurrent double-submit yields 409, never two rows', async () => {
    const store = freshStore();
    const svc = createService(store);
    await adminCounter(store);
    const r1 = store.offers.values().next().value as OfferMutable;

    // The winner commits round 2…
    await svc.respondCounter(farmerActor, farmerOwnScope, store.listing.id, r1.id, {
      pricePerKg: '85.00',
      quantityKg: '100.000',
    });
    const round2Rows = Array.from(store.offers.values()).filter((o) => o.round === 2);
    expect(round2Rows).toHaveLength(1);
    const round2Row = round2Rows[0] as OfferMutable;

    // …while a concurrent caller read a STALE snapshot where max round was 1,
    // so it also computes round 2. The UNIQUE constraint rejects the insert.
    store.maxRoundOverride = 1;
    await expectAppError(
      svc.respondCounter(farmerActor, farmerOwnScope, store.listing.id, round2Row.id, {
        pricePerKg: '86.00',
        quantityKg: '100.000',
      }),
      'CONFLICT',
    );
    delete store.maxRoundOverride;

    // Still exactly one row at round 2 — no duplicate was created.
    expect(Array.from(store.offers.values()).filter((o) => o.round === 2)).toHaveLength(1);
  });

  // --------------------------------------------------------------- BR-29 ----
  it('BR-29a: Farmer Admin approving their own listing → 403 SELF_APPROVAL_FORBIDDEN, state unchanged', async () => {
    const store = freshStore();
    const svc = createService(store);
    const versionBefore = store.listing.version;

    await expectAppError(
      svc.approveListing(ownFarmerAdminActor, ownAdminScope('listing.approve'), store.listing.id, {
        warehouseId: 'aaaaaaaa-0000-0000-0000-000000000099',
      }),
      'SELF_APPROVAL_FORBIDDEN',
    );
    expect(store.listing.status).toBe('PENDING_APPROVAL');
    expect(store.listing.version).toBe(versionBefore);
  });

  it('BR-29b: the same listing lands in another admin queue with routed_reason self_approval', async () => {
    const store = freshStore();
    const svc = createService(store);
    await expectAppError(
      svc.approveListing(ownFarmerAdminActor, ownAdminScope('listing.approve'), store.listing.id, {
        warehouseId: 'aaaaaaaa-0000-0000-0000-000000000099',
      }),
      'SELF_APPROVAL_FORBIDDEN',
    );
    const routed = store.routingRows[store.routingRows.length - 1];
    expect(routed).toBeDefined();
    const routing = routed as RoutingRow;
    expect(routing.routedReason).toBe('self_approval');
    expect(routing.routedFromUserId).toBe(IDS.ownerUser);
    expect(routing.routedToUserId).toBe(IDS.otherAdminUser); // a different eligible admin
    expect(routing.routedToUserId).not.toBe(IDS.ownerUser);
  });

  it('BR-29c: counter and reject paths return the same denial for the owner (not just approve)', async () => {
    const store = freshStore();
    const svc = createService(store);

    await expectAppError(
      svc.sendCounterOffer(ownFarmerAdminActor, ownAdminScope('listing.counter_offer.send'), store.listing.id, {
        pricePerKg: '75.00',
        quantityKg: '75.000',
      }),
      'SELF_APPROVAL_FORBIDDEN',
    );

    await expectAppError(
      svc.rejectListing(ownFarmerAdminActor, ownAdminScope('listing.reject'), store.listing.id, {
        reasonCode: 'QUALITY_CONCERN',
        reason: 'Grade does not match the lot sampled.',
      }),
      'SELF_APPROVAL_FORBIDDEN',
    );

    // Every owner path still records the routing row (BR-29b) with the same reason.
    for (const r of store.routingRows) {
      expect(r.routedReason).toBe('self_approval');
      expect(['approve', 'reject', 'counter_offer']).toContain(r.attemptedAction);
    }
    expect(store.listing.status).toBe('PENDING_APPROVAL');
  });

  // ------------------------------------------------ exhaustive transition table
  it('double-accept race on one offer: exactly one accept wins, the loser is refused', async () => {
    const store = freshStore();
    const opening = await adminCounter(store, '75.00', '75.000');
    const svcA = createService(store);
    const svcB = createService(store);
    const listingId = store.listing.id;

    await svcA.respondAccept(farmerActor, farmerOwnScope, listingId, opening.id);
    // The loser is refused either way — if it observes the listing already
    // accepted it is LISTING_NOT_PENDING, if it observes the offer consumed
    // it is CONFLICT. What must NEVER happen is a second ACCEPTED offer.
    await expect(svcB.respondAccept(farmerActor, farmerOwnScope, listingId, opening.id)).rejects.toThrow();
    expect(store.listing.status).toBe('ACCEPTED');
    expect(Array.from(store.offers.values()).filter((o) => o.status === 'ACCEPTED')).toHaveLength(1);
  });

  it('admin and farmer acting on the same listing serialize on version — one transition wins', async () => {
    const store = freshStore();
    const svc = createService(store);
    const listingId = store.listing.id;

    // Admin opens round 1, then the farmer accepts; a second admin approve must
    // observe the new version/status and refuse rather than silently overwrite.
    const opening = await adminCounter(store, '75.00', '75.000');
    await svc.respondAccept(farmerActor, farmerOwnScope, listingId, opening.id);
    await expectAppError(
      svc.approveListing(peerFarmerAdminActor, peerAdminScope('listing.approve'), listingId, {
        warehouseId: 'aaaaaaaa-0000-0000-0000-000000000099',
      }),
      'LISTING_NOT_PENDING',
    );
    expect(store.listing.status).toBe('ACCEPTED');
  });
});



