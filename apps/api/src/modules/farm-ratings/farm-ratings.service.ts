import { writeAuditLog } from '../../audit/auditLog.js';
import type { Actor } from '../../auth/requireAuth.js';
import { pool, withTransaction, type Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import { assertPredicate, type ResolvedScope } from '../../rbac/requirePermission.js';
import { farmRatingsRepo, type FarmRatingsRepo } from './farm-ratings.repo.js';
import type { FarmRatingResponse, RatingTier, SetFarmRatingBody } from './farm-ratings.schema.js';

export type TransactionRunner = <T>(fn: (tx: Executor) => Promise<T>) => Promise<T>;

export interface FarmRatingsService {
  getAdminRating(scope: ResolvedScope, farmerId: string): Promise<FarmRatingResponse>;
  getMyRating(scope: ResolvedScope): Promise<FarmRatingResponse>;
  setRating(
    actor: Actor,
    scope: ResolvedScope,
    farmerId: string,
    body: SetFarmRatingBody,
  ): Promise<FarmRatingResponse>;
}

/**
 * Assembles the FarmRating response for a farmer from the latest cycle
 * (DRAFT or COMPLETE), or an all-null DRAFT shell if the farmer has never
 * been rated. Shared by both GET endpoints and by setRating's before/after
 * audit snapshots, so the shape returned to a client always matches what got
 * written to `audit_log`.
 *
 * "CYCLE-1" for a never-rated farmer is the prospective label the next PUT
 * will actually create (see setRating's cycle numbering below) — it is not
 * persisted until that first write happens.
 */
async function assembleResponse(
  repo: FarmRatingsRepo,
  tx: Executor,
  farmerId: string,
): Promise<FarmRatingResponse> {
  const categories = await repo.findActiveCategories(tx);
  const latest = await repo.findLatestRating(tx, farmerId);
  const scoresByCategoryId = latest !== null ? await repo.findScoresForRating(tx, latest.id) : new Map<string, number>();

  return {
    farmerId,
    periodLabel: latest?.periodLabel ?? 'CYCLE-1',
    status: latest?.status ?? 'DRAFT',
    modules: categories.map((category) => ({
      categoryCode: category.code,
      score: scoresByCategoryId.get(category.id) ?? null,
      maxScore: 10 as const,
    })),
    overallRating: latest?.totalScore ?? null,
    ratingTier: (latest?.tierCode as RatingTier | null | undefined) ?? null,
    ratedAt: latest?.ratedAt ? latest.ratedAt.toISOString() : null,
  };
}

export function createFarmRatingsService(
  repo: FarmRatingsRepo = farmRatingsRepo,
  runTx: TransactionRunner = withTransaction,
  db: Executor = pool,
): FarmRatingsService {
  return {
    async getAdminRating(scope, farmerId) {
      const farmer = await repo.findFarmerForView(db, farmerId, scope);
      if (farmer === null) {
        // NOTE: 404 rather than 403 — a row that exists but is out of scope
        // must not be distinguishable from one that does not exist (root
        // CLAUDE.md §2.1; see also warehouses.service.ts's identical note).
        throw new AppError('NOT_FOUND', {
          detail: `No farmer with id "${farmerId}" is visible to you.`,
        });
      }
      return assembleResponse(repo, db, farmerId);
    },

    async getMyRating(scope) {
      if (scope.farmerId === undefined) {
        throw new AppError('NOT_FOUND', { detail: 'No farmer profile for the current actor.' });
      }
      const farmer = await repo.findFarmerZone(db, scope.farmerId);
      if (farmer === null) {
        throw new AppError('NOT_FOUND', { detail: 'No farmer profile for the current actor.' });
      }
      return assembleResponse(repo, db, scope.farmerId);
    },

    async setRating(actor, scope, farmerId, body) {
      // 1. Load the farmer plain — the middleware has not seen this row yet,
      //    so it could not evaluate OWN_ZONE_ONLY (requirePermission.ts's own
      //    doc comment on `conditional` scope).
      const farmer = await repo.findFarmerZone(db, farmerId);
      if (farmer === null) {
        throw new AppError('NOT_FOUND', { detail: `No farmer with id "${farmerId}" was found.` });
      }

      // 2. FARMER_ADMIN's grant is conditional/OWN_ZONE_ONLY. assertPredicate
      //    is a no-op for SUPER_ADMIN/TOHFA_ADMIN (their scope is "all", not
      //    "conditional") and throws WAREHOUSE_SCOPE_VIOLATION (403) for a
      //    Farmer Admin acting outside their own zone.
      assertPredicate(scope, { zoneId: farmer.zoneId ?? undefined });

      // 3. Every submitted category must be one of the currently-active
      //    categories (BR-06b) — no unknowns, no duplicates. This checks
      //    against live config (rating_categories.is_active), not a
      //    compile-time list. Unlike the old 5-module design, a single PUT no
      //    longer has to name every active category: 1-10 entries are
      //    accepted so a cycle can be built up incrementally (see the cycle
      //    logic below).
      const categories = await repo.findActiveCategories(db);
      const categoryByCode = new Map(categories.map((category) => [category.code, category] as const));

      const submittedCodes = new Set(body.modules.map((module) => module.categoryCode));
      if (submittedCodes.size !== body.modules.length) {
        throw new AppError('VALIDATION_FAILED', {
          detail: 'Each rating category may be submitted at most once per request.',
        });
      }
      for (const module of body.modules) {
        if (!categoryByCode.has(module.categoryCode)) {
          throw new AppError('VALIDATION_FAILED', {
            detail: `"${module.categoryCode}" is not a currently-active rating category.`,
          });
        }
      }

      // 4. Each score must be 0-10 (BR-06a). The zod schema only checks
      //    integer-ness (see farm-ratings.schema.ts) — a request-validation
      //    failure always surfaces as the generic VALIDATION_FAILED, but
      //    BR-06a names SCORE_OUT_OF_RANGE, so the domain check and its error
      //    code live here.
      for (const module of body.modules) {
        if (module.score < 0 || module.score > 10) {
          throw new AppError('SCORE_OUT_OF_RANGE', {
            detail: `Score for "${module.categoryCode}" must be between 0 and 10 (got ${module.score}).`,
            meta: { categoryCode: module.categoryCode, score: module.score },
          });
        }
      }

      return runTx(async (tx) => {
        const before = await assembleResponse(repo, tx, farmerId);

        // 5. Find (or start) the current cycle. A cycle stays DRAFT and
        //    reusable across multiple PUT calls until all 10 active
        //    categories have a score; once COMPLETE, it is frozen (BR-06's
        //    "fewer than 10 is incomplete, not zero") and the next edit
        //    starts a brand-new cycle instead of mutating it — the history
        //    mechanism root CLAUDE.md §2.3 asks ledger-adjacent tables for.
        const latest = await repo.findLatestRating(tx, farmerId);
        let ratingId: string;
        if (latest === null || latest.status === 'COMPLETE') {
          const priorCycles = await repo.countRatingCycles(tx, farmerId);
          const periodLabel = `CYCLE-${priorCycles + 1}`;
          ratingId = await repo.createDraftRating(tx, {
            farmerId,
            zoneId: farmer.zoneId,
            periodLabel,
          });
        } else {
          ratingId = latest.id;
        }

        // 6. Upsert this call's scores into the cycle (INSERT the first time a
        //    category is scored, UPDATE on a later resubmission for the same
        //    still-DRAFT cycle).
        await repo.upsertScores(
          tx,
          ratingId,
          body.modules.map((module) => ({
            categoryId: categoryByCode.get(module.categoryCode)!.id,
            score: module.score,
            scoredBy: actor.userId,
          })),
        );

        if (body.notes !== undefined) {
          await repo.updateNotes(tx, ratingId, body.notes);
        }

        // 7. Only when every active category now has a score for this cycle:
        //    compute total_score as a DIRECT sum (BR-06, LOCKED — no x2 or
        //    other multiplier), resolve the tier from rating_tier_config
        //    (BR-04a — never a literal), and flip the cycle to COMPLETE.
        const scoresAfterUpsert = await repo.findScoresForRating(tx, ratingId);
        if (scoresAfterUpsert.size === categories.length) {
          const totalScore = categories.reduce(
            (sum, category) => sum + (scoresAfterUpsert.get(category.id) ?? 0),
            0,
          );
          const tierCode = await repo.resolveTierForScore(tx, totalScore);
          await repo.completeRating(tx, ratingId, { totalScore, tierCode, ratedBy: actor.userId });
          // Farmer-facing cache, updated directly in this transaction — not a
          // DB trigger. Root CLAUDE.md §2.3's trigger-maintained-cache rule is
          // scoped to wallets.balance / inventory_batches.qty_available; this
          // module's own precedent (goods-receipts' updateGoodsReceiptStatus)
          // is a plain UPDATE inside the transaction for non-ledger status
          // fields.
          await repo.updateFarmerRatingCache(tx, farmerId, totalScore, tierCode);
        }

        const after = await assembleResponse(repo, tx, farmerId);

        await writeAuditLog(tx, {
          actorId: actor.userId,
          actorRole: scope.roleCode,
          actionCode: 'farmer.rating.edit',
          entityType: 'farm_rating',
          entityId: ratingId,
          before,
          after,
        });

        return after;
      });
    },
  };
}

export const farmRatingsService: FarmRatingsService = createFarmRatingsService();
