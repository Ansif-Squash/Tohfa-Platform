import { RoleCode } from '@tohfa/shared-types';
import type { Executor } from '../../db/pool.js';
import { scopedWhere, type ResolvedScope, type ScopedWhere } from '../../rbac/requirePermission.js';
import type { RatingStatus } from './farm-ratings.schema.js';

export interface FarmerZoneRow {
  id: string;
  zoneId: string | null;
}

export interface ActiveCategoryRow {
  id: string;
  code: string;
  sortOrder: number;
}

export interface LatestRatingRow {
  id: string;
  periodLabel: string;
  status: RatingStatus;
  totalScore: number | null;
  tierCode: string | null;
  ratedAt: Date | null;
}

export interface RatingScoreInput {
  categoryId: string;
  score: number;
  scoredBy: string;
}

export interface CreateDraftRatingData {
  farmerId: string;
  zoneId: string | null;
  periodLabel: string;
}

export interface CompleteRatingData {
  totalScore: number;
  tierCode: string | null;
  ratedBy: string;
}

export interface FarmRatingsRepo {
  /** Plain lookup by primary key — no scope filter. Used before assertPredicate,
   *  which needs the row loaded first to evaluate OWN_ZONE_ONLY against it. */
  findFarmerZone(tx: Executor, farmerId: string): Promise<FarmerZoneRow | null>;

  /** Scope-aware lookup for the admin GET. See the MAIN_WH_ADMIN special case
   *  in the implementation for why this cannot be a plain scopedWhere() call. */
  findFarmerForView(tx: Executor, farmerId: string, scope: ResolvedScope): Promise<FarmerZoneRow | null>;

  /** BR-06/BR-06b: the live set of active categories. Always exactly 10 in a
   *  correctly-seeded database, but this reads is_active rather than assuming
   *  the count, so a submission is validated against real config. */
  findActiveCategories(tx: Executor): Promise<ActiveCategoryRow[]>;

  /** Most recent rating cycle for a farmer (DRAFT or COMPLETE), or null if the
   *  farmer has never been rated. Cycles are ordered by created_at, not
   *  rated_at, so an in-progress DRAFT (rated_at IS NULL) is still found. */
  findLatestRating(tx: Executor, farmerId: string): Promise<LatestRatingRow | null>;

  /** categoryId -> score for every category scored so far in this cycle. */
  findScoresForRating(tx: Executor, ratingId: string): Promise<Map<string, number>>;

  /** How many rating cycles (DRAFT or COMPLETE) this farmer has ever had —
   *  used to number the next cycle's period_label. */
  countRatingCycles(tx: Executor, farmerId: string): Promise<number>;

  /** Starts a new, empty DRAFT cycle. Never called while a DRAFT cycle for
   *  this farmer is still open — the service reuses that one instead. */
  createDraftRating(tx: Executor, data: CreateDraftRatingData): Promise<string>;

  /** Upserts one score per category — INSERT on first submission for that
   *  category in this cycle, UPDATE on a later resubmission (the PUT is
   *  explicitly incremental/idempotent-per-category, not append-only; the
   *  ledger discipline of root CLAUDE.md §2.3 applies to farm_ratings' cycle
   *  HISTORY — a new row per cycle — not to a single in-progress cycle's
   *  editable draft scores). */
  upsertScores(tx: Executor, ratingId: string, scores: RatingScoreInput[]): Promise<void>;

  /** Persists notes for the current cycle. Called whenever the caller supplies
   *  `notes`, whether or not the cycle is complete after this write. */
  updateNotes(tx: Executor, ratingId: string, notes: string): Promise<void>;

  /** Flips a cycle to COMPLETE once all 10 categories have a score: sets
   *  total_score, tier_code, rated_by and rated_at together. */
  completeRating(tx: Executor, ratingId: string, data: CompleteRatingData): Promise<void>;

  /** Farmer-facing read cache (farmers.overall_rating / rating_tier_code),
   *  updated in the same transaction as completeRating — a plain UPDATE, not
   *  a ledger: root CLAUDE.md §2.3's trigger-maintained-cache rule is scoped
   *  to wallets.balance / inventory_batches.qty_available. */
  updateFarmerRatingCache(
    tx: Executor,
    farmerId: string,
    overallRating: number,
    tierCode: string | null,
  ): Promise<void>;

  /** BR-04a: tier boundaries are read from `rating_tier_config`, never a
   *  literal. Picks the config generation with the latest `effective_from`
   *  that is not in the future, then the band that score falls in. */
  resolveTierForScore(tx: Executor, score: number): Promise<string | null>;
}

export const farmRatingsRepo: FarmRatingsRepo = {
  async findFarmerZone(tx, farmerId) {
    const result = await tx.query<{ id: string; zone_id: string | null }>(
      `SELECT id, zone_id FROM farmers WHERE id = $1 AND deleted_at IS NULL`,
      [farmerId],
    );
    const row = result.rows[0];
    return row === undefined ? null : { id: row.id, zoneId: row.zone_id };
  },

  async findFarmerForView(tx, farmerId, scope) {
    // MAIN_WH_ADMIN's rbac.json role definition sets scopeDimension: null
    // ("Oversees all 4 warehouses") — assignedWarehouseIds/assignedZoneIds are
    // therefore both empty for this role, and scopedWhere's generic "fail
    // closed to FALSE when a restricted scope produces no clause" rule would
    // otherwise block them entirely despite rbac.json granting them "view".
    // Every other role (FARMER_ADMIN via zone, SUB_WH_ADMIN via the zone's
    // warehouse) scopes normally.
    let filter: ScopedWhere;
    if (scope.roleCode === RoleCode.MAIN_WH_ADMIN) {
      filter = { sql: 'TRUE', params: [], nextIndex: 2 };
    } else {
      filter = scopedWhere(scope, {
        zoneColumn: 'f.zone_id',
        warehouseColumn: 'z.warehouse_id',
        startIndex: 2,
      });
    }

    const sql = `
      SELECT f.id, f.zone_id
        FROM farmers f
   LEFT JOIN zones z ON z.id = f.zone_id
       WHERE f.id = $1 AND f.deleted_at IS NULL AND ${filter.sql}
    `;
    const result = await tx.query<{ id: string; zone_id: string | null }>(sql, [
      farmerId,
      ...filter.params,
    ]);
    const row = result.rows[0];
    return row === undefined ? null : { id: row.id, zoneId: row.zone_id };
  },

  async findActiveCategories(tx) {
    const result = await tx.query<{ id: string; code: string; sort_order: number }>(
      `SELECT id, code, sort_order
         FROM rating_categories
        WHERE is_active = true
        ORDER BY sort_order`,
    );
    return result.rows.map((row) => ({
      id: row.id,
      code: row.code,
      sortOrder: row.sort_order,
    }));
  },

  async findLatestRating(tx, farmerId) {
    const result = await tx.query<{
      id: string;
      period_label: string;
      status: RatingStatus;
      total_score: string | null;
      tier_code: string | null;
      rated_at: Date | null;
    }>(
      `SELECT id, period_label, status, total_score::text AS total_score, tier_code, rated_at
         FROM farm_ratings
        WHERE farmer_id = $1
        ORDER BY created_at DESC
        LIMIT 1`,
      [farmerId],
    );
    const row = result.rows[0];
    if (row === undefined) return null;
    return {
      id: row.id,
      periodLabel: row.period_label,
      status: row.status,
      totalScore: row.total_score === null ? null : Number(row.total_score),
      tierCode: row.tier_code,
      ratedAt: row.rated_at,
    };
  },

  async findScoresForRating(tx, ratingId) {
    const result = await tx.query<{ category_id: string; score: string }>(
      `SELECT category_id, score::text AS score FROM farm_rating_scores WHERE rating_id = $1`,
      [ratingId],
    );
    const map = new Map<string, number>();
    for (const row of result.rows) {
      map.set(row.category_id, Number(row.score));
    }
    return map;
  },

  async countRatingCycles(tx, farmerId) {
    const result = await tx.query<{ count: string }>(
      `SELECT count(*)::text AS count FROM farm_ratings WHERE farmer_id = $1`,
      [farmerId],
    );
    return Number(result.rows[0]?.count ?? '0');
  },

  async createDraftRating(tx, data) {
    const result = await tx.query<{ id: string }>(
      `INSERT INTO farm_ratings (farmer_id, zone_id, period_label, status)
       VALUES ($1, $2, $3, 'DRAFT')
       RETURNING id`,
      [data.farmerId, data.zoneId, data.periodLabel],
    );
    return result.rows[0]!.id;
  },

  async upsertScores(tx, ratingId, scores) {
    for (const score of scores) {
      await tx.query(
        `INSERT INTO farm_rating_scores (rating_id, category_id, score, scored_by)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (rating_id, category_id) DO UPDATE SET
           score      = EXCLUDED.score,
           scored_by  = EXCLUDED.scored_by,
           updated_at = now()`,
        [ratingId, score.categoryId, score.score, score.scoredBy],
      );
    }
  },

  async updateNotes(tx, ratingId, notes) {
    await tx.query(`UPDATE farm_ratings SET notes = $2, updated_at = now() WHERE id = $1`, [
      ratingId,
      notes,
    ]);
  },

  async completeRating(tx, ratingId, data) {
    await tx.query(
      `UPDATE farm_ratings
          SET status = 'COMPLETE', total_score = $2, tier_code = $3, rated_by = $4, rated_at = now(), updated_at = now()
        WHERE id = $1`,
      [ratingId, data.totalScore, data.tierCode, data.ratedBy],
    );
  },

  async updateFarmerRatingCache(tx, farmerId, overallRating, tierCode) {
    await tx.query(
      `UPDATE farmers SET overall_rating = $2, rating_tier_code = $3, updated_at = now() WHERE id = $1`,
      [farmerId, overallRating, tierCode],
    );
  },

  async resolveTierForScore(tx, score) {
    const genResult = await tx.query<{ gen: string | null }>(
      `SELECT MAX(effective_from) AS gen FROM rating_tier_config WHERE effective_from <= CURRENT_DATE`,
    );
    const gen = genResult.rows[0]?.gen ?? null;
    if (gen === null) return null;

    const tierResult = await tx.query<{ tier_code: string }>(
      `SELECT tier_code
         FROM rating_tier_config
        WHERE effective_from = $1
          AND $2 >= min_score
          AND (max_score IS NULL OR $2 < max_score)
        ORDER BY sort_order
        LIMIT 1`,
      [gen, score],
    );
    return tierResult.rows[0]?.tier_code ?? null;
  },
};
