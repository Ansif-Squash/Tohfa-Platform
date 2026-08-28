/**
 * counter-offers.repo — SQL only.
 *
 * Every mutating statement is a GUARDED conditional update (`WHERE status =
 * 'PENDING'`, `WHERE version = $n AND status IN (...)`) so two concurrent
 * actors race on the row, not on a pre-checked SELECT: exactly one caller sees
 * rowCount 1 and the loser observes rowCount 0. That rowCount-0 loser is what
 * the service translates into a conflict, which is what makes the double-accept
 * race, the double-submit counter (UNIQUE(listing_id, round) backstop) and the
 * expiry sweep safe to run twice.
 *
 * Tables: counter_offers, listing_routing, produce_listings, system_config —
 * db/migrations/0004_produce_pricing_marketing.sql. The long COMMENT on
 * counter_offers is the authoritative statement of the negotiation semantics.
 */
import { writeAuditLog, type AuditEntry } from '../../audit/auditLog.js';
import type { Executor } from '../../db/pool.js';

export type CounterActor = 'ADMIN' | 'FARMER';

/** Mirrors the `counter_offer_status` enum — LAPSED is the expiry job's value. */
export type CounterOfferStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COUNTERED' | 'LAPSED';

export interface CounterOfferRow {
  id: string;
  listingId: string;
  round: number;
  actor: CounterActor;
  actorUserId: string;
  pricePerKg: string;
  quantityKg: string;
  message: string | null;
  status: CounterOfferStatus;
  expiresAt: Date;
  respondedAt: Date | null;
  respondedBy: string | null;
  createdAt: Date;
  updatedAt: Date | null;
}

/**
 * The admin-side view of a listing, joined with farmers to carry `ownerUserId`
 * — the NOT_OWN_LISTING predicate (BR-29) keys the self-approval denial off
 * that ownership linkage, not off a role name.
 */
export interface AdminListingView {
  id: string;
  listingNumber: string;
  farmerId: string;
  ownerUserId: string;
  cropId: string;
  grade: 'GRADE_1' | 'GRADE_2' | 'GRADE_3' | 'REJECT';
  quantityKg: string;
  askingPricePerKg: string;
  fairPriceId: string;
  status: string;
  finalPricePerKg: string | null;
  finalQuantityKg: string | null;
  version: number;
  approvedBy: string | null;
  approvedAt: Date | null;
  rejectedBy: string | null;
  rejectedAt: Date | null;
  rejectionReason: string | null;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface InsertCounterOfferData {
  listingId: string;
  round: number;
  actor: CounterActor;
  actorUserId: string;
  pricePerKg: string;
  quantityKg: string;
  message: string | null;
  /** Computed by the SERVICE from system_config.counter_offer_window_hours. */
  expiresAt: Date;
}

export interface InsertListingRoutingData {
  listingId: string;
  routedFromUserId: string;
  /** Null when no other eligible admin exists; the routing row is still written. */
  routedToUserId: string | null;
  routedReason: 'self_approval';
  attemptedAction: 'approve' | 'reject' | 'counter_offer';
}

/** Columns a listing transition may change alongside status + version. */
export interface ListingTransitionPatch {
  finalPricePerKg?: string;
  finalQuantityKg?: string;
  approvedBy?: string;
  approvedAt?: Date;
  rejectedBy?: string;
  rejectedAt?: Date;
  rejectionReason?: string;
}

export interface ExpiredPendingOffer {
  id: string;
  listingId: string;
  round: number;
  actor: CounterActor;
  expiresAt: Date;
}

const OFFER_COLUMNS = `
  id, listing_id AS "listingId", round, actor, actor_user_id AS "actorUserId",
  price_per_kg AS "pricePerKg", quantity_kg AS "quantityKg", message, status,
  expires_at AS "expiresAt", responded_at AS "respondedAt", responded_by AS "respondedBy",
  created_at AS "createdAt", updated_at AS "updatedAt"
`;

const LISTING_COLUMNS = `
  l.id, l.listing_number AS "listingNumber", l.farmer_id AS "farmerId",
  f.user_id AS "ownerUserId", l.crop_id AS "cropId", l.grade,
  l.quantity_kg AS "quantityKg", l.price_per_kg AS "askingPricePerKg",
  l.fair_price_id AS "fairPriceId", l.status,
  l.final_price_per_kg AS "finalPricePerKg", l.final_quantity_kg AS "finalQuantityKg",
  l.version, l.approved_by AS "approvedBy", l.approved_at AS "approvedAt",
  l.rejected_by AS "rejectedBy", l.rejected_at AS "rejectedAt",
  l.rejection_reason AS "rejectionReason", l.created_at AS "createdAt", l.updated_at AS "updatedAt"
`;

export const counterOffersRepo = {
  /**
   * BR-10: the window length lives in system_config, never in a literal.
   * Returns NaN when the key is missing/unparsable — the service turns that
   * into an INTERNAL error rather than silently negotiating on a guess.
   */
  async getCounterOfferWindowHours(db: Executor): Promise<number> {
    const res = await db.query<{ value: unknown }>(
      `SELECT value FROM system_config WHERE key = 'counter_offer_window_hours' LIMIT 1`,
    );
    const raw = res.rows[0]?.value;
    const parsed = typeof raw === 'number' ? raw : Number(raw);
    return Number.isFinite(parsed) ? parsed : Number.NaN;
  },

  /** BR-11: rounds run 1..(limit + 1) — round 1 is the admin's opening counter. */
  async getCounterOfferRoundLimit(db: Executor): Promise<number> {
    const res = await db.query<{ value: unknown }>(
      `SELECT value FROM system_config WHERE key = 'max_counter_rounds' LIMIT 1`,
    );
    const raw = res.rows[0]?.value;
    const parsed = typeof raw === 'number' ? raw : Number(raw);
    return Number.isFinite(parsed) ? parsed : Number.NaN;
  },

  async findAdminListing(db: Executor, id: string): Promise<AdminListingView | null> {
    const res = await db.query<AdminListingView>(
      `SELECT ${LISTING_COLUMNS}
       FROM produce_listings l
       JOIN farmers f ON f.id = l.farmer_id
       WHERE l.id = $1 AND l.deleted_at IS NULL
       LIMIT 1`,
      [id],
    );
    return res.rows[0] ?? null;
  },

  async findLatestPendingOffer(
    db: Executor,
    listingId: string,
  ): Promise<CounterOfferRow | null> {
    const res = await db.query<CounterOfferRow>(
      `SELECT ${OFFER_COLUMNS}
       FROM counter_offers
       WHERE listing_id = $1 AND status = 'PENDING'
       ORDER BY round DESC
       LIMIT 1`,
      [listingId],
    );
    return res.rows[0] ?? null;
  },

  async findOfferById(
    db: Executor,
    listingId: string,
    offerId: string,
  ): Promise<CounterOfferRow | null> {
    const res = await db.query<CounterOfferRow>(
      `SELECT ${OFFER_COLUMNS}
       FROM counter_offers
       WHERE listing_id = $1 AND id = $2
       LIMIT 1`,
      [listingId, offerId],
    );
    return res.rows[0] ?? null;
  },

  async getMaxRound(db: Executor, listingId: string): Promise<number> {
    const res = await db.query<{ maxRound: number }>(
      `SELECT COALESCE(MAX(round), 0)::int AS "maxRound" FROM counter_offers WHERE listing_id = $1`,
      [listingId],
    );
    return res.rows[0]?.maxRound ?? 0;
  },

  /** BR-11 caps FARMER counters; admin rows do not count toward the limit. */
  async countFarmerCounters(db: Executor, listingId: string): Promise<number> {
    const res = await db.query<{ count: number }>(
      `SELECT COUNT(*)::int AS "count" FROM counter_offers WHERE listing_id = $1 AND actor = 'FARMER'`,
      [listingId],
    );
    return res.rows[0]?.count ?? 0;
  },

  /**
   * Insert one offer row. The round number is computed by the service from
   * MAX(round); UNIQUE(listing_id, round) is the concurrency backstop — a
   * losing double-submit surfaces here as pg error 23505, which the service
   * translates into a conflict. Deliberately NOT pre-checked with a SELECT.
   */
  async insertCounterOffer(
    db: Executor,
    data: InsertCounterOfferData,
  ): Promise<CounterOfferRow> {
    const res = await db.query<CounterOfferRow>(
      `INSERT INTO counter_offers
         (listing_id, round, actor, actor_user_id, price_per_kg, quantity_kg, message, status, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING', $8)
       RETURNING ${OFFER_COLUMNS}`,
      [
        data.listingId,
        data.round,
        data.actor,
        data.actorUserId,
        data.pricePerKg,
        data.quantityKg,
        data.message,
        data.expiresAt,
      ],
    );
    const row = res.rows[0];
    if (row === undefined) throw new Error('counter_offers insert returned no row');
    return row;
  },

  /**
   * Guarded offer transition: only a still-PENDING offer can move, which is
   * what makes accept/reject/counter double-submits and the expiry sweep
   * idempotent. When `respondedBy` is set the response pair is stamped (the
   * CHECK requires responded_at/responded_by together); a LAPSED offer keeps
   * both NULL — a lapse is nobody's response.
   */
  async transitionOfferStatus(
    db: Executor,
    offerId: string,
    status: CounterOfferStatus,
    respondedBy: string | null,
  ): Promise<boolean> {
    const res = await db.query<{ id: string }>(
      `UPDATE counter_offers
          SET status = $2,
              updated_at = now(),
              responded_at = COALESCE(responded_at, CASE WHEN $3::uuid IS NOT NULL THEN now() END),
              responded_by = $3
        WHERE id = $1 AND status = 'PENDING'
        RETURNING id`,
      [offerId, status, respondedBy],
    );
    return res.rowCount === 1;
  },

  /**
   * Optimistic-lock status flip over produce_listings. `expectedVersion` and
   * the from-status set are the guard: two admins acting on the same listing
   * is the normal case once BR-29b auto-routing puts it in two queues, and
   * the loser sees rowCount 0 rather than a silent overwrite.
   */
  async transitionListingStatus(
    db: Executor,
    id: string,
    toStatus: string,
    fromStatuses: string[],
    expectedVersion: number,
    patch: ListingTransitionPatch = {},
  ): Promise<AdminListingView | null> {
    const values: unknown[] = [id, toStatus, expectedVersion];
    const setClauses = ['status = $2', 'version = version + 1', 'updated_at = now()'];
    let idx = 4;

    const columnByPatchKey: Record<keyof ListingTransitionPatch, string> = {
      finalPricePerKg: 'final_price_per_kg',
      finalQuantityKg: 'final_quantity_kg',
      approvedBy: 'approved_by',
      approvedAt: 'approved_at',
      rejectedBy: 'rejected_by',
      rejectedAt: 'rejected_at',
      rejectionReason: 'rejection_reason',
    };
    for (const key of Object.keys(patch) as Array<keyof ListingTransitionPatch>) {
      const value = patch[key];
      if (value === undefined) continue;
      setClauses.push(`${columnByPatchKey[key]} = $${idx}`);
      values.push(value);
      idx += 1;
    }

    const statusParams = fromStatuses.map((_, i) => `$${idx + i}`).join(', ');
    values.push(...fromStatuses);

    const res = await db.query<{ id: string }>(
      `UPDATE produce_listings
          SET ${setClauses.join(', ')}
        WHERE id = $1 AND version = $3 AND status IN (${statusParams}) AND deleted_at IS NULL
        RETURNING id`,
      values,
    );
    if (res.rowCount === 0) return null;
    return this.findAdminListing(db, id);
  },

  /**
   * The sweep's candidate set — the partial index idx_counter_offers_expiry
   * makes this a no-op scan when nothing is due. Bounded so one slow pass
   * cannot monopolise the worker; the next tick picks up the remainder.
   */
  async findExpiredPendingOffers(
    db: Executor,
    limit: number,
  ): Promise<ExpiredPendingOffer[]> {
    const res = await db.query<ExpiredPendingOffer>(
      `SELECT id, listing_id AS "listingId", round, actor, expires_at AS "expiresAt"
       FROM counter_offers
       WHERE status = 'PENDING' AND expires_at <= now()
       ORDER BY expires_at
       LIMIT ${Math.max(1, Math.trunc(limit))}`,
    );
    return res.rows;
  },

  /**
   * BR-29b: pick another eligible admin to receive the routed listing — any
   * live ACTIVE user whose role grants listing.approval.auto_route at `all`
   * scope, excluding the actor who just got denied. Null when nobody else is
   * eligible; the routing row is written regardless so the denial is visible.
   */
  async findRouteTarget(
    db: Executor,
    excludeUserId: string,
  ): Promise<{ userId: string } | null> {
    const res = await db.query<{ userId: string }>(
      `SELECT u.id AS "userId"
       FROM users u
       JOIN user_roles ur ON ur.user_id = u.id
       JOIN roles r ON r.id = ur.role_id
       JOIN role_permissions rp ON rp.role_id = r.id
       JOIN permissions p ON p.id = rp.permission_id
       WHERE p.code = 'listing.approval.auto_route'
         AND rp.scope = 'all'
         AND u.id <> $1
         AND u.status = 'ACTIVE'
         AND u.deleted_at IS NULL
       ORDER BY u.created_at
       LIMIT 1`,
      [excludeUserId],
    );
    return res.rows[0] ?? null;
  },

  async insertListingRouting(
    db: Executor,
    data: InsertListingRoutingData,
  ): Promise<void> {
    await db.query(
      `INSERT INTO listing_routing
         (listing_id, routed_from_user_id, routed_to_user_id, routed_reason, attempted_action)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        data.listingId,
        data.routedFromUserId,
        data.routedToUserId,
        data.routedReason,
        data.attemptedAction,
      ],
    );
  },

  /**
   * Thin delegate so services write audits through the repo boundary — the
   * SQL and the shared writeAuditLog helper stay in one place and the service
   * stays mockable without a real database.
   */
  async recordAudit(db: Executor, entry: AuditEntry): Promise<string> {
    return writeAuditLog(db, entry);
  },
};
