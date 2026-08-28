import type { Executor } from '../../db/pool.js';
import type { UpdateListingBody } from './listings.schema.js';

export interface ListingRow {
  id: string;
  listingNumber: string;
  farmerId: string;
  farmId: string | null;
  farmCropId: string | null;
  cropId: string;
  cropName: string;
  grade: 'GRADE_1' | 'GRADE_2' | 'GRADE_3' | 'REJECT';
  quantityKg: string;
  askingPricePerKg: string;
  ceilingPricePerKg: string;
  finalPricePerKg: string | null;
  finalQuantityKg: string | null;
  fairPriceId: string;
  status: string;
  availableFrom: string | null;
  photos: string[];
  certificationBadges: unknown[];
  version: number;
  approvedBy: string | null;
  approvedAt: string | null;
  rejectedBy: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface ListingRollup {
  pendingCount: number;
  pendingKg: string;
  acceptedCount: number;
  acceptedKg: string;
  withdrawnCount: number;
}

export interface FarmerProfileRow {
  id: string;
  userId: string;
  isMarketBlocked: boolean;
}

export interface CertBadge {
  certType: string;
  certNumber: string;
  issuingBody: string;
  issuedOn: string;
  expiresOn: string;
}

export interface FairPriceLookup {
  id: string;
  ceilingPrice: string;
  effectiveFrom: string;
  effectiveTo: string | null;
}

export const listingsRepo = {
  async findFarmerByUserId(db: Executor, userId: string): Promise<FarmerProfileRow | null> {
    const res = await db.query<FarmerProfileRow>(
      `SELECT id, user_id AS "userId", is_market_blocked AS "isMarketBlocked"
       FROM farmers
       WHERE user_id = $1 AND deleted_at IS NULL
       LIMIT 1`,
      [userId],
    );
    return res.rows[0] ?? null;
  },

  async findFarmerById(db: Executor, farmerId: string): Promise<FarmerProfileRow | null> {
    const res = await db.query<FarmerProfileRow>(
      `SELECT id, user_id AS "userId", is_market_blocked AS "isMarketBlocked"
       FROM farmers
       WHERE id = $1 AND deleted_at IS NULL
       LIMIT 1`,
      [farmerId],
    );
    return res.rows[0] ?? null;
  },

  async getFarmerCertificates(
    db: Executor,
    farmerId: string,
  ): Promise<{
    hasExpired: boolean;
    expiredCert?: { certType: string; certNumber: string; expiresOn: string } | undefined;
    hasUnverified: boolean;
    unverifiedCert?: { certType: string; certNumber: string } | undefined;
    verifiedBadges: CertBadge[];
  }> {
    const res = await db.query<{
      cert_type: string;
      cert_number: string;
      issuing_body: string;
      issued_on: string;
      expires_on: string;
      verification_status: string;
      is_expired: boolean;
    }>(
      `SELECT cert_type, cert_number, issuing_body, issued_on, expires_on, verification_status,
              (expires_on < CURRENT_DATE) AS is_expired
       FROM certifications
       WHERE farmer_id = $1 AND deleted_at IS NULL`,
      [farmerId],
    );

    let hasExpired = false;
    let expiredCert: { certType: string; certNumber: string; expiresOn: string } | undefined;
    let hasUnverified = false;
    let unverifiedCert: { certType: string; certNumber: string } | undefined;
    const verifiedBadges: CertBadge[] = [];

    for (const row of res.rows) {
      if (row.is_expired || row.verification_status === 'EXPIRED') {
        hasExpired = true;
        if (!expiredCert) {
          expiredCert = {
            certType: row.cert_type,
            certNumber: row.cert_number,
            expiresOn: String(row.expires_on).slice(0, 10),
          };
        }
      }
      if (row.verification_status === 'PENDING' || row.verification_status === 'UNVERIFIED') {
        hasUnverified = true;
        if (!unverifiedCert) {
          unverifiedCert = {
            certType: row.cert_type,
            certNumber: row.cert_number,
          };
        }
      }
      if (row.verification_status === 'VERIFIED' && !row.is_expired) {
        verifiedBadges.push({
          certType: row.cert_type,
          certNumber: row.cert_number,
          issuingBody: row.issuing_body,
          issuedOn: String(row.issued_on).slice(0, 10),
          expiresOn: String(row.expires_on).slice(0, 10),
        });
      }
    }

    return {
      hasExpired,
      expiredCert,
      hasUnverified,
      unverifiedCert,
      verifiedBadges,
    };
  },

  async getSystemConfig(db: Executor, key: string): Promise<unknown | null> {
    const res = await db.query<{ value: unknown }>(
      `SELECT value FROM system_config WHERE key = $1 LIMIT 1`,
      [key],
    );
    return res.rows[0]?.value ?? null;
  },

  async countActiveListings(db: Executor, farmerId: string): Promise<number> {
    const res = await db.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM produce_listings
       WHERE farmer_id = $1
         AND status IN ('PENDING_APPROVAL', 'COUNTER_OFFERED', 'ACCEPTED')
         AND deleted_at IS NULL`,
      [farmerId],
    );
    return parseInt(res.rows[0]?.count ?? '0', 10);
  },

  async findEffectiveFairPrice(
    db: Executor,
    cropId: string,
    grade: string,
    effectiveDate: string,
  ): Promise<FairPriceLookup | null> {
    const res = await db.query<{
      id: string;
      ceiling_price: string;
      effective_from: string;
      effective_to: string | null;
    }>(
      `SELECT id, ceiling_price::text, effective_from::text, effective_to::text
       FROM fair_prices
       WHERE crop_id = $1
         AND grade = $2
         AND effective_from <= $3::date
         AND (effective_to IS NULL OR effective_to >= $3::date)
       ORDER BY effective_from DESC
       LIMIT 1`,
      [cropId, grade, effectiveDate],
    );

    if (!res.rows[0]) return null;
    return {
      id: res.rows[0].id,
      ceilingPrice: res.rows[0].ceiling_price,
      effectiveFrom: res.rows[0].effective_from.slice(0, 10),
      effectiveTo: res.rows[0].effective_to ? res.rows[0].effective_to.slice(0, 10) : null,
    };
  },

  async generateListingNumber(db: Executor): Promise<string> {
    const year = new Date().getFullYear();
    const res = await db.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM produce_listings WHERE listing_number LIKE $1`,
      [`LST-${year}-%`],
    );
    const nextSeq = parseInt(res.rows[0]?.count ?? '0', 10) + 1;
    return `LST-${year}-${String(nextSeq).padStart(4, '0')}`;
  },

  async insertListing(
    db: Executor,
    data: {
      listingNumber: string;
      farmerId: string;
      farmId?: string | undefined;
      cropId: string;
      grade: string;
      quantityKg: string;
      askingPricePerKg: string;
      fairPriceId: string;
      availableFrom?: string | undefined;
      photos?: string[] | undefined;
      certificationBadges: CertBadge[];
    },
  ): Promise<ListingRow> {
    const res = await db.query<{
      id: string;
      listing_number: string;
      farmer_id: string;
      farm_id: string | null;
      farm_crop_id: string | null;
      crop_id: string;
      crop_name: string;
      grade: 'GRADE_1' | 'GRADE_2' | 'GRADE_3' | 'REJECT';
      quantity_kg: string;
      price_per_kg: string;
      ceiling_price: string;
      final_price_per_kg: string | null;
      final_quantity_kg: string | null;
      fair_price_id: string;
      status: string;
      available_from: string | null;
      photo_keys: string[] | null;
      certification_badges: unknown[];
      version: number;
      approved_by: string | null;
      approved_at: string | null;
      rejected_by: string | null;
      rejected_at: string | null;
      rejection_reason: string | null;
      created_at: string;
      updated_at: string | null;
    }>(
      `WITH ins AS (
         INSERT INTO produce_listings (
           listing_number, farmer_id, farm_id, crop_id, grade,
           quantity_kg, price_per_kg, fair_price_id, status,
           available_from, photo_keys, certification_badges, version
         ) VALUES (
           $1, $2, $3, $4, $5,
           $6, $7, $8, 'PENDING_APPROVAL',
           $9, $10, $11::jsonb, 1
         )
         RETURNING *
       )
       SELECT ins.id, ins.listing_number, ins.farmer_id, ins.farm_id, ins.farm_crop_id,
              ins.crop_id, cm.name AS crop_name, ins.grade, ins.quantity_kg::text,
              ins.price_per_kg::text, fp.ceiling_price::text AS ceiling_price,
              ins.final_price_per_kg::text, ins.final_quantity_kg::text,
              ins.fair_price_id, ins.status, ins.available_from::text,
              ins.photo_keys, ins.certification_badges, ins.version,
              ins.approved_by, ins.approved_at::text, ins.rejected_by,
              ins.rejected_at::text, ins.rejection_reason,
              ins.created_at::text, ins.updated_at::text
       FROM ins
       JOIN crop_master cm ON cm.id = ins.crop_id
       JOIN fair_prices fp ON fp.id = ins.fair_price_id`,
      [
        data.listingNumber,
        data.farmerId,
        data.farmId ?? null,
        data.cropId,
        data.grade,
        data.quantityKg,
        data.askingPricePerKg,
        data.fairPriceId,
        data.availableFrom ?? null,
        data.photos ?? null,
        JSON.stringify(data.certificationBadges),
      ],
    );

    const row = res.rows[0]!;
    return {
      id: row.id,
      listingNumber: row.listing_number,
      farmerId: row.farmer_id,
      farmId: row.farm_id,
      farmCropId: row.farm_crop_id,
      cropId: row.crop_id,
      cropName: row.crop_name,
      grade: row.grade,
      quantityKg: row.quantity_kg,
      askingPricePerKg: row.price_per_kg,
      ceilingPricePerKg: row.ceiling_price,
      finalPricePerKg: row.final_price_per_kg,
      finalQuantityKg: row.final_quantity_kg,
      fairPriceId: row.fair_price_id,
      status: row.status,
      availableFrom: row.available_from ? row.available_from.slice(0, 10) : null,
      photos: row.photo_keys ?? [],
      certificationBadges: (row.certification_badges as unknown[]) ?? [],
      version: row.version,
      approvedBy: row.approved_by,
      approvedAt: row.approved_at,
      rejectedBy: row.rejected_by,
      rejectedAt: row.rejected_at,
      rejectionReason: row.rejection_reason,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },

  async findListingById(db: Executor, id: string): Promise<ListingRow | null> {
    const res = await db.query<{
      id: string;
      listing_number: string;
      farmer_id: string;
      farm_id: string | null;
      farm_crop_id: string | null;
      crop_id: string;
      crop_name: string;
      grade: 'GRADE_1' | 'GRADE_2' | 'GRADE_3' | 'REJECT';
      quantity_kg: string;
      price_per_kg: string;
      ceiling_price: string;
      final_price_per_kg: string | null;
      final_quantity_kg: string | null;
      fair_price_id: string;
      status: string;
      available_from: string | null;
      photo_keys: string[] | null;
      certification_badges: unknown[];
      version: number;
      approved_by: string | null;
      approved_at: string | null;
      rejected_by: string | null;
      rejected_at: string | null;
      rejection_reason: string | null;
      created_at: string;
      updated_at: string | null;
    }>(
      `SELECT pl.id, pl.listing_number, pl.farmer_id, pl.farm_id, pl.farm_crop_id,
              pl.crop_id, cm.name AS crop_name, pl.grade, pl.quantity_kg::text,
              pl.price_per_kg::text, fp.ceiling_price::text AS ceiling_price,
              pl.final_price_per_kg::text, pl.final_quantity_kg::text,
              pl.fair_price_id, pl.status, pl.available_from::text,
              pl.photo_keys, pl.certification_badges, pl.version,
              pl.approved_by, pl.approved_at::text, pl.rejected_by,
              pl.rejected_at::text, pl.rejection_reason,
              pl.created_at::text, pl.updated_at::text
       FROM produce_listings pl
       JOIN crop_master cm ON cm.id = pl.crop_id
       JOIN fair_prices fp ON fp.id = pl.fair_price_id
       WHERE pl.id = $1 AND pl.deleted_at IS NULL`,
      [id],
    );

    if (!res.rows[0]) return null;
    const row = res.rows[0];
    return {
      id: row.id,
      listingNumber: row.listing_number,
      farmerId: row.farmer_id,
      farmId: row.farm_id,
      farmCropId: row.farm_crop_id,
      cropId: row.crop_id,
      cropName: row.crop_name,
      grade: row.grade,
      quantityKg: row.quantity_kg,
      askingPricePerKg: row.price_per_kg,
      ceilingPricePerKg: row.ceiling_price,
      finalPricePerKg: row.final_price_per_kg,
      finalQuantityKg: row.final_quantity_kg,
      fairPriceId: row.fair_price_id,
      status: row.status,
      availableFrom: row.available_from ? row.available_from.slice(0, 10) : null,
      photos: row.photo_keys ?? [],
      certificationBadges: (row.certification_badges as unknown[]) ?? [],
      version: row.version,
      approvedBy: row.approved_by,
      approvedAt: row.approved_at,
      rejectedBy: row.rejected_by,
      rejectedAt: row.rejected_at,
      rejectionReason: row.rejection_reason,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },

  async listFarmerListings(
    db: Executor,
    farmerId: string,
    filters: {
      status?: string | undefined;
      cursor?: string | undefined;
      limit: number;
    },
  ): Promise<{ items: ListingRow[]; nextCursor: string | null; hasMore: boolean }> {
    const conditions = ['pl.farmer_id = $1', 'pl.deleted_at IS NULL'];
    const values: unknown[] = [farmerId];
    let idx = 2;

    if (filters.status) {
      conditions.push(`pl.status = $${idx}`);
      values.push(filters.status);
      idx++;
    }

    if (filters.cursor) {
      conditions.push(`pl.created_at < $${idx}`);
      values.push(filters.cursor);
      idx++;
    }

    values.push(filters.limit + 1);

    const res = await db.query<{
      id: string;
      listing_number: string;
      farmer_id: string;
      farm_id: string | null;
      farm_crop_id: string | null;
      crop_id: string;
      crop_name: string;
      grade: 'GRADE_1' | 'GRADE_2' | 'GRADE_3' | 'REJECT';
      quantity_kg: string;
      price_per_kg: string;
      ceiling_price: string;
      final_price_per_kg: string | null;
      final_quantity_kg: string | null;
      fair_price_id: string;
      status: string;
      available_from: string | null;
      photo_keys: string[] | null;
      certification_badges: unknown[];
      version: number;
      approved_by: string | null;
      approved_at: string | null;
      rejected_by: string | null;
      rejected_at: string | null;
      rejection_reason: string | null;
      created_at: string;
      updated_at: string | null;
    }>(
      `SELECT pl.id, pl.listing_number, pl.farmer_id, pl.farm_id, pl.farm_crop_id,
              pl.crop_id, cm.name AS crop_name, pl.grade, pl.quantity_kg::text,
              pl.price_per_kg::text, fp.ceiling_price::text AS ceiling_price,
              pl.final_price_per_kg::text, pl.final_quantity_kg::text,
              pl.fair_price_id, pl.status, pl.available_from::text,
              pl.photo_keys, pl.certification_badges, pl.version,
              pl.approved_by, pl.approved_at::text, pl.rejected_by,
              pl.rejected_at::text, pl.rejection_reason,
              pl.created_at::text, pl.updated_at::text
       FROM produce_listings pl
       JOIN crop_master cm ON cm.id = pl.crop_id
       JOIN fair_prices fp ON fp.id = pl.fair_price_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY pl.created_at DESC
       LIMIT $${idx}`,
      values,
    );

    const hasMore = res.rows.length > filters.limit;
    const rawItems = hasMore ? res.rows.slice(0, filters.limit) : res.rows;
    const nextCursor = hasMore && rawItems.length > 0 ? rawItems[rawItems.length - 1]!.created_at : null;

    const items: ListingRow[] = rawItems.map((row) => ({
      id: row.id,
      listingNumber: row.listing_number,
      farmerId: row.farmer_id,
      farmId: row.farm_id,
      farmCropId: row.farm_crop_id,
      cropId: row.crop_id,
      cropName: row.crop_name,
      grade: row.grade,
      quantityKg: row.quantity_kg,
      askingPricePerKg: row.price_per_kg,
      ceilingPricePerKg: row.ceiling_price,
      finalPricePerKg: row.final_price_per_kg,
      finalQuantityKg: row.final_quantity_kg,
      fairPriceId: row.fair_price_id,
      status: row.status,
      availableFrom: row.available_from ? row.available_from.slice(0, 10) : null,
      photos: row.photo_keys ?? [],
      certificationBadges: (row.certification_badges as unknown[]) ?? [],
      version: row.version,
      approvedBy: row.approved_by,
      approvedAt: row.approved_at,
      rejectedBy: row.rejected_by,
      rejectedAt: row.rejected_at,
      rejectionReason: row.rejection_reason,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return { items, nextCursor, hasMore };
  },

  async getRollupSummary(db: Executor, farmerId: string): Promise<ListingRollup> {
    const res = await db.query<{
      pending_count: string;
      pending_kg: string;
      accepted_count: string;
      accepted_kg: string;
      withdrawn_count: string;
    }>(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'PENDING_APPROVAL')::text AS pending_count,
         COALESCE(SUM(quantity_kg) FILTER (WHERE status = 'PENDING_APPROVAL'), 0)::text AS pending_kg,
         COUNT(*) FILTER (WHERE status = 'ACCEPTED')::text AS accepted_count,
         COALESCE(SUM(quantity_kg) FILTER (WHERE status = 'ACCEPTED'), 0)::text AS accepted_kg,
         COUNT(*) FILTER (WHERE status = 'WITHDRAWN')::text AS withdrawn_count
       FROM produce_listings
       WHERE farmer_id = $1 AND deleted_at IS NULL`,
      [farmerId],
    );

    const r = res.rows[0];
    return {
      pendingCount: parseInt(r?.pending_count ?? '0', 10),
      pendingKg: r?.pending_kg ?? '0',
      acceptedCount: parseInt(r?.accepted_count ?? '0', 10),
      acceptedKg: r?.accepted_kg ?? '0',
      withdrawnCount: parseInt(r?.withdrawn_count ?? '0', 10),
    };
  },

  async updateListing(
    db: Executor,
    id: string,
    version: number,
    data: UpdateListingBody,
  ): Promise<ListingRow | null> {
    const setClauses = ['updated_at = now()', 'version = version + 1'];
    const values: unknown[] = [id, version];
    let idx = 3;

    if (data.quantityKg !== undefined) {
      setClauses.push(`quantity_kg = $${idx}`);
      values.push(data.quantityKg);
      idx++;
    }

    if (data.askingPricePerKg !== undefined) {
      setClauses.push(`price_per_kg = $${idx}`);
      values.push(data.askingPricePerKg);
      idx++;
    }

    if (data.availableFrom !== undefined) {
      setClauses.push(`available_from = $${idx}`);
      values.push(data.availableFrom);
      idx++;
    }

    if (data.photos !== undefined) {
      setClauses.push(`photo_keys = $${idx}`);
      values.push(data.photos);
      idx++;
    }

    const res = await db.query<{ id: string }>(
      `UPDATE produce_listings
       SET ${setClauses.join(', ')}
       WHERE id = $1 AND version = $2 AND status = 'PENDING_APPROVAL' AND deleted_at IS NULL
       RETURNING id`,
      values,
    );

    if (res.rowCount === 0) return null;
    return this.findListingById(db, id);
  },

  async withdrawListing(
    db: Executor,
    id: string,
    version: number,
  ): Promise<ListingRow | null> {
    const res = await db.query<{ id: string }>(
      `UPDATE produce_listings
       SET status = 'WITHDRAWN', updated_at = now(), version = version + 1
       WHERE id = $1 AND version = $2 AND status = 'PENDING_APPROVAL' AND deleted_at IS NULL
       RETURNING id`,
      [id, version],
    );

    if (res.rowCount === 0) return null;
    return this.findListingById(db, id);
  },
};
