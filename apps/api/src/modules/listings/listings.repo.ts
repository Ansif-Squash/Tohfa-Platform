import type { Executor } from '../../db/pool.js';
import type { SqlFilter } from '../../rbac/requirePermission.js';
import type {
  CounterOfferResponse,
  CreateListingBody,
  ListingResponse,
  ListListingsQuery,
  ProduceGrade,
  UpdateListingBody,
} from './listings.schema.ts';

export interface FarmerCertState {
  farmerId: string;
  isMarketBlocked: boolean;
  certificates: Array<{
    id: string;
    certType: string;
    certNumber: string;
    status: string;
    expiresAt: string | null;
  }>;
}

export interface FairPriceRecord {
  id: string;
  cropId: string;
  grade: ProduceGrade;
  ceilingPrice: string;
  effectiveFrom: string;
  effectiveTo: string | null;
}

export interface ListingsRepo {
  create(
    db: Executor,
    data: CreateListingBody & {
      farmerId: string;
      listingNumber: string;
      fairPriceId: string;
      badgesJson: string;
    },
  ): Promise<ListingResponse>;
  findById(db: Executor, id: string, scope?: SqlFilter): Promise<ListingResponse | null>;
  findActiveCountByFarmer(db: Executor, farmerId: string): Promise<number>;
  findFarmerCertState(db: Executor, farmerId: string): Promise<FarmerCertState | null>;
  findActiveFairPrice(
    db: Executor,
    cropId: string,
    grade: ProduceGrade,
    effectiveDate: string,
  ): Promise<FairPriceRecord | null>;
  getSystemConfigLimit(db: Executor): Promise<{ limit: number; enabled: boolean }>;
  getCounterOfferWindowHours(db: Executor): Promise<number>;
  createCounterOffer(
    db: Executor,
    data: {
      listingId: string;
      round: number;
      actor: 'ADMIN' | 'FARMER';
      actorUserId: string;
      pricePerKg: string;
      quantityKg: string;
      message?: string;
      windowHours: number;
    },
  ): Promise<CounterOfferResponse>;
  findCounterOfferById(db: Executor, offerId: string): Promise<CounterOfferResponse | null>;
  findLatestCounterOffer(db: Executor, listingId: string): Promise<CounterOfferResponse | null>;
  updateCounterOfferStatus(
    db: Executor,
    offerId: string,
    status: 'ACCEPTED' | 'REJECTED' | 'LAPSED',
    respondedBy?: string,
  ): Promise<CounterOfferResponse | null>;
  createListingRouting(
    db: Executor,
    data: {
      listingId: string;
      routedFromUserId: string;
      routedToUserId: string | null;
      attemptedAction: 'approve' | 'reject' | 'counter_offer';
    },
  ): Promise<void>;
  findEligibleOtherAdmin(db: Executor, excludeUserId: string): Promise<string | null>;
  updateListingStatus(
    db: Executor,
    id: string,
    version: number,
    status: string,
    extra?: {
      approvedBy?: string;
      rejectedBy?: string;
      rejectionReason?: string;
      finalPricePerKg?: string;
      finalQuantityKg?: string;
    },
  ): Promise<ListingResponse | null>;
  sweepExpiredCounterOffers(db: Executor): Promise<number>;
  update(
    db: Executor,
    id: string,
    version: number,
    data: UpdateListingBody,
    newFairPriceId?: string,
  ): Promise<ListingResponse | null>;
  withdraw(db: Executor, id: string, version?: number, reason?: string): Promise<ListingResponse | null>;
  list(
    db: Executor,
    options: { filters: ListListingsQuery; scope: SqlFilter },
  ): Promise<{
    items: ListingResponse[];
    total: number;
    summary: { totalListings: number; soldKg: string; unsoldKg: string };
  }>;
}

export const listingsRepo: ListingsRepo = {
  async create(db, data): Promise<ListingResponse> {
    const query = `
      INSERT INTO produce_listings (
        listing_number,
        farmer_id,
        farm_id,
        farm_crop_id,
        crop_id,
        grade,
        quantity_kg,
        price_per_kg,
        fair_price_id,
        status,
        available_from,
        photo_keys,
        certification_badges
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'PENDING_APPROVAL', $10, $11, $12::jsonb)
      RETURNING
        id,
        listing_number AS "listingNumber",
        farmer_id AS "farmerId",
        farm_id AS "farmId",
        farm_crop_id AS "farmCropId",
        crop_id AS "cropId",
        grade,
        quantity_kg::text AS "quantityKg",
        price_per_kg::text AS "askingPricePerKg",
        fair_price_id AS "fairPriceId",
        status,
        available_from::text AS "availableFrom",
        COALESCE(photo_keys, ARRAY[]::text[]) AS "photoKeys",
        certification_badges AS "certificationBadges",
        version,
        created_at::text AS "createdAt",
        updated_at::text AS "updatedAt";
    `;

    const res = await db.query(query, [
      data.listingNumber,
      data.farmerId,
      data.farmId || null,
      data.farmCropId || null,
      data.cropId,
      data.grade,
      data.quantityKg,
      data.askingPricePerKg,
      data.fairPriceId,
      data.availableFrom || null,
      data.photos || [],
      data.badgesJson,
    ]);

    return res.rows[0];
  },

  async findById(db, id, scope): Promise<ListingResponse | null> {
    const scopeClause = scope ? `AND ${scope.clause}` : '';
    const params = scope ? [id, ...scope.params] : [id];

    const query = `
      SELECT
        id,
        listing_number AS "listingNumber",
        farmer_id AS "farmerId",
        farm_id AS "farmId",
        farm_crop_id AS "farmCropId",
        crop_id AS "cropId",
        grade,
        quantity_kg::text AS "quantityKg",
        price_per_kg::text AS "askingPricePerKg",
        fair_price_id AS "fairPriceId",
        status,
        available_from::text AS "availableFrom",
        COALESCE(photo_keys, ARRAY[]::text[]) AS "photoKeys",
        certification_badges AS "certificationBadges",
        version,
        created_at::text AS "createdAt",
        updated_at::text AS "updatedAt"
      FROM produce_listings
      WHERE id = $1 AND deleted_at IS NULL ${scopeClause};
    `;

    const res = await db.query(query, params);
    return res.rows[0] ?? null;
  },

  async findActiveCountByFarmer(db, farmerId): Promise<number> {
    const query = `
      SELECT COUNT(*)::int AS count
      FROM produce_listings
      WHERE farmer_id = $1
        AND deleted_at IS NULL
        AND status NOT IN ('WITHDRAWN', 'REJECTED', 'EXPIRED', 'FULFILLED');
    `;
    const res = await db.query(query, [farmerId]);
    return res.rows[0]?.count ?? 0;
  },

  async findFarmerCertState(db, farmerId): Promise<FarmerCertState | null> {
    const farmerRes = await db.query(
      `SELECT id, is_market_blocked AS "isMarketBlocked" FROM farmers WHERE id = $1`,
      [farmerId],
    );
    if (farmerRes.rowCount === 0) return null;

    const certsRes = await db.query(
      `SELECT id, cert_type AS "certType", cert_number AS "certNumber", status, expires_at::text AS "expiresAt"
       FROM farmer_certifications
       WHERE farmer_id = $1 AND deleted_at IS NULL`,
      [farmerId],
    );

    return {
      farmerId,
      isMarketBlocked: farmerRes.rows[0].isMarketBlocked ?? false,
      certificates: certsRes.rows,
    };
  },

  async findActiveFairPrice(db, cropId, grade, effectiveDate): Promise<FairPriceRecord | null> {
    const query = `
      SELECT
        id,
        crop_id AS "cropId",
        grade,
        ceiling_price::text AS "ceilingPrice",
        effective_from::text AS "effectiveFrom",
        effective_to::text AS "effectiveTo"
      FROM fair_prices
      WHERE crop_id = $1
        AND grade = $2
        AND effective_from <= $3
        AND (effective_to IS NULL OR effective_to >= $3)
      ORDER BY effective_from DESC
      LIMIT 1;
    `;
    const res = await db.query(query, [cropId, grade, effectiveDate]);
    return res.rows[0] ?? null;
  },

  async getSystemConfigLimit(db): Promise<{ limit: number; enabled: boolean }> {
    const res = await db.query(`
      SELECT
        COALESCE((SELECT value::int FROM system_config WHERE key = 'free_tier_listing_limit'), 5) AS limit,
        COALESCE((SELECT value::boolean FROM system_config WHERE key = 'free_tier_limits_enabled'), false) AS enabled
    `);
    return {
      limit: res.rows[0]?.limit ?? 5,
      enabled: res.rows[0]?.enabled ?? false,
    };
  },

  async getCounterOfferWindowHours(db): Promise<number> {
    const res = await db.query(`
      SELECT COALESCE((SELECT value::int FROM system_config WHERE key = 'counter_offer_window_hours'), 24) AS hours
    `);
    return res.rows[0]?.hours ?? 24;
  },

  async createCounterOffer(db, data): Promise<CounterOfferResponse> {
    const query = `
      INSERT INTO counter_offers (
        listing_id,
        round,
        actor,
        actor_user_id,
        price_per_kg,
        quantity_kg,
        message,
        status,
        expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING', now() + ($8 || ' hour')::interval)
      RETURNING
        id,
        listing_id AS "listingId",
        round,
        actor,
        actor_user_id AS "actorUserId",
        price_per_kg::text AS "pricePerKg",
        quantity_kg::text AS "quantityKg",
        message,
        status,
        expires_at::text AS "expiresAt",
        responded_at::text AS "respondedAt",
        responded_by AS "respondedBy",
        created_at::text AS "createdAt";
    `;

    const res = await db.query(query, [
      data.listingId,
      data.round,
      data.actor,
      data.actorUserId,
      data.pricePerKg,
      data.quantityKg,
      data.message || null,
      data.windowHours.toString(),
    ]);

    return res.rows[0];
  },

  async findCounterOfferById(db, offerId): Promise<CounterOfferResponse | null> {
    const query = `
      SELECT
        id,
        listing_id AS "listingId",
        round,
        actor,
        actor_user_id AS "actorUserId",
        price_per_kg::text AS "pricePerKg",
        quantity_kg::text AS "quantityKg",
        message,
        status,
        expires_at::text AS "expiresAt",
        responded_at::text AS "respondedAt",
        responded_by AS "respondedBy",
        created_at::text AS "createdAt"
      FROM counter_offers
      WHERE id = $1;
    `;
    const res = await db.query(query, [offerId]);
    return res.rows[0] ?? null;
  },

  async findLatestCounterOffer(db, listingId): Promise<CounterOfferResponse | null> {
    const query = `
      SELECT
        id,
        listing_id AS "listingId",
        round,
        actor,
        actor_user_id AS "actorUserId",
        price_per_kg::text AS "pricePerKg",
        quantity_kg::text AS "quantityKg",
        message,
        status,
        expires_at::text AS "expiresAt",
        responded_at::text AS "respondedAt",
        responded_by AS "respondedBy",
        created_at::text AS "createdAt"
      FROM counter_offers
      WHERE listing_id = $1
      ORDER BY round DESC
      LIMIT 1;
    `;
    const res = await db.query(query, [listingId]);
    return res.rows[0] ?? null;
  },

  async updateCounterOfferStatus(db, offerId, status, respondedBy): Promise<CounterOfferResponse | null> {
    const query = `
      UPDATE counter_offers
      SET status = $2, responded_at = now(), responded_by = $3, updated_at = now()
      WHERE id = $1
      RETURNING
        id,
        listing_id AS "listingId",
        round,
        actor,
        actor_user_id AS "actorUserId",
        price_per_kg::text AS "pricePerKg",
        quantity_kg::text AS "quantityKg",
        message,
        status,
        expires_at::text AS "expiresAt",
        responded_at::text AS "respondedAt",
        responded_by AS "respondedBy",
        created_at::text AS "createdAt";
    `;
    const res = await db.query(query, [offerId, status, respondedBy || null]);
    return res.rows[0] ?? null;
  },

  async createListingRouting(db, data): Promise<void> {
    const query = `
      INSERT INTO listing_routing (
        listing_id,
        routed_from_user_id,
        routed_to_user_id,
        routed_reason,
        attempted_action
      ) VALUES ($1, $2, $3, 'self_approval', $4);
    `;
    await db.query(query, [
      data.listingId,
      data.routedFromUserId,
      data.routedToUserId,
      data.attemptedAction,
    ]);
  },

  async findEligibleOtherAdmin(db, excludeUserId): Promise<string | null> {
    const query = `
      SELECT u.id
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE r.code IN ('SUPER_ADMIN', 'TOHFA_ADMIN')
        AND u.id <> $1
        AND u.deleted_at IS NULL
      LIMIT 1;
    `;
    const res = await db.query(query, [excludeUserId]);
    return res.rows[0]?.id ?? null;
  },

  async updateListingStatus(db, id, version, status, extra = {}): Promise<ListingResponse | null> {
    const updates: string[] = ['status = $3', 'version = version + 1', 'updated_at = now()'];
    const params: unknown[] = [id, version, status];
    let idx = 4;

    if (extra.approvedBy) {
      updates.push(`approved_by = $${idx++}`, `approved_at = now()`);
      params.push(extra.approvedBy);
    }
    if (extra.rejectedBy) {
      updates.push(`rejected_by = $${idx++}`, `rejected_at = now()`);
      params.push(extra.rejectedBy);
    }
    if (extra.rejectionReason) {
      updates.push(`rejection_reason = $${idx++}`);
      params.push(extra.rejectionReason);
    }
    if (extra.finalPricePerKg) {
      updates.push(`final_price_per_kg = $${idx++}`);
      params.push(extra.finalPricePerKg);
    }
    if (extra.finalQuantityKg) {
      updates.push(`final_quantity_kg = $${idx++}`);
      params.push(extra.finalQuantityKg);
    }

    const query = `
      UPDATE produce_listings
      SET ${updates.join(', ')}
      WHERE id = $1 AND version = $2 AND deleted_at IS NULL
      RETURNING
        id,
        listing_number AS "listingNumber",
        farmer_id AS "farmerId",
        farm_id AS "farmId",
        farm_crop_id AS "farmCropId",
        crop_id AS "cropId",
        grade,
        quantity_kg::text AS "quantityKg",
        price_per_kg::text AS "askingPricePerKg",
        fair_price_id AS "fairPriceId",
        status,
        available_from::text AS "availableFrom",
        COALESCE(photo_keys, ARRAY[]::text[]) AS "photoKeys",
        certification_badges AS "certificationBadges",
        version,
        created_at::text AS "createdAt",
        updated_at::text AS "updatedAt";
    `;

    const res = await db.query(query, params);
    return res.rows[0] ?? null;
  },

  async sweepExpiredCounterOffers(db): Promise<number> {
    const res = await db.query(`
      WITH lapsed AS (
        UPDATE counter_offers
        SET status = 'LAPSED', updated_at = now()
        WHERE status = 'PENDING' AND expires_at <= now()
        RETURNING listing_id
      )
      UPDATE produce_listings
      SET status = 'PENDING_APPROVAL', updated_at = now()
      WHERE id IN (SELECT listing_id FROM lapsed) AND status = 'COUNTER_OFFERED'
      RETURNING id;
    `);
    return res.rowCount ?? 0;
  },

  async update(db, id, version, data, newFairPriceId): Promise<ListingResponse | null> {
    const updates: string[] = ['version = version + 1', 'updated_at = now()'];
    const params: unknown[] = [id, version];
    let idx = 3;

    if (data.quantityKg !== undefined) {
      updates.push(`quantity_kg = $${idx++}`);
      params.push(data.quantityKg);
    }
    if (data.askingPricePerKg !== undefined) {
      updates.push(`price_per_kg = $${idx++}`);
      params.push(data.askingPricePerKg);
    }
    if (newFairPriceId) {
      updates.push(`fair_price_id = $${idx++}`);
      params.push(newFairPriceId);
    }
    if (data.availableFrom !== undefined) {
      updates.push(`available_from = $${idx++}`);
      params.push(data.availableFrom);
    }
    if (data.photos !== undefined) {
      updates.push(`photo_keys = $${idx++}`);
      params.push(data.photos);
    }

    const query = `
      UPDATE produce_listings
      SET ${updates.join(', ')}
      WHERE id = $1 AND version = $2 AND status = 'PENDING_APPROVAL' AND deleted_at IS NULL
      RETURNING
        id,
        listing_number AS "listingNumber",
        farmer_id AS "farmerId",
        farm_id AS "farmId",
        farm_crop_id AS "farmCropId",
        crop_id AS "cropId",
        grade,
        quantity_kg::text AS "quantityKg",
        price_per_kg::text AS "askingPricePerKg",
        fair_price_id AS "fairPriceId",
        status,
        available_from::text AS "availableFrom",
        COALESCE(photo_keys, ARRAY[]::text[]) AS "photoKeys",
        certification_badges AS "certificationBadges",
        version,
        created_at::text AS "createdAt",
        updated_at::text AS "updatedAt";
    `;

    const res = await db.query(query, params);
    return res.rows[0] ?? null;
  },

  async withdraw(db, id, version, reason): Promise<ListingResponse | null> {
    const versionClause = version !== undefined ? `AND version = $2` : '';
    const params = version !== undefined ? [id, version] : [id];
    let idx = params.length + 1;
    let reasonAssign = '';

    if (reason) {
      reasonAssign = `, rejection_reason = $${idx++}`;
      params.push(reason);
    }

    const query = `
      UPDATE produce_listings
      SET status = 'WITHDRAWN', version = version + 1, updated_at = now() ${reasonAssign}
      WHERE id = $1 ${versionClause} AND status IN ('DRAFT', 'PENDING_APPROVAL') AND deleted_at IS NULL
      RETURNING
        id,
        listing_number AS "listingNumber",
        farmer_id AS "farmerId",
        farm_id AS "farmId",
        farm_crop_id AS "farmCropId",
        crop_id AS "cropId",
        grade,
        quantity_kg::text AS "quantityKg",
        price_per_kg::text AS "askingPricePerKg",
        fair_price_id AS "fairPriceId",
        status,
        available_from::text AS "availableFrom",
        COALESCE(photo_keys, ARRAY[]::text[]) AS "photoKeys",
        certification_badges AS "certificationBadges",
        version,
        created_at::text AS "createdAt",
        updated_at::text AS "updatedAt";
    `;

    const res = await db.query(query, params);
    return res.rows[0] ?? null;
  },

  async list(db, options): Promise<{ items: ListingResponse[]; total: number; summary: { totalListings: number; soldKg: string; unsoldKg: string } }> {
    const { filters, scope } = options;
    const scopeClause = scope.clause ? `AND ${scope.clause}` : '';
    const params: unknown[] = [...scope.params];
    let idx = params.length + 1;

    let statusClause = '';
    if (filters.status) {
      statusClause = `AND status = $${idx++}`;
      params.push(filters.status);
    }

    const itemsQuery = `
      SELECT
        id,
        listing_number AS "listingNumber",
        farmer_id AS "farmerId",
        farm_id AS "farmId",
        farm_crop_id AS "farmCropId",
        crop_id AS "cropId",
        grade,
        quantity_kg::text AS "quantityKg",
        price_per_kg::text AS "askingPricePerKg",
        fair_price_id AS "fairPriceId",
        status,
        available_from::text AS "availableFrom",
        COALESCE(photo_keys, ARRAY[]::text[]) AS "photoKeys",
        certification_badges AS "certificationBadges",
        version,
        created_at::text AS "createdAt",
        updated_at::text AS "updatedAt"
      FROM produce_listings
      WHERE deleted_at IS NULL ${scopeClause} ${statusClause}
      ORDER BY created_at DESC
      LIMIT ${filters.limit};
    `;

    const countQuery = `
      SELECT
        COUNT(*)::int AS total,
        COALESCE(SUM(CASE WHEN status = 'FULFILLED' THEN quantity_kg ELSE 0 END), 0)::text AS "soldKg",
        COALESCE(SUM(CASE WHEN status NOT IN ('FULFILLED', 'WITHDRAWN', 'REJECTED') THEN quantity_kg ELSE 0 END), 0)::text AS "unsoldKg"
      FROM produce_listings
      WHERE deleted_at IS NULL ${scopeClause} ${statusClause};
    `;

    const [itemsRes, countRes] = await Promise.all([
      db.query(itemsQuery, params),
      db.query(countQuery, params),
    ]);

    return {
      items: itemsRes.rows,
      total: countRes.rows[0]?.total ?? 0,
      summary: {
        totalListings: countRes.rows[0]?.total ?? 0,
        soldKg: countRes.rows[0]?.soldKg ?? '0.000',
        unsoldKg: countRes.rows[0]?.unsoldKg ?? '0.000',
      },
    };
  },
};
