/**
 * Farm rating (BR-06, LOCKED). Exactly 10 named categories, each scored 0-10
 * by an admin, summed DIRECTLY to a 0-100 total — no multiplier (10 x 10 =
 * 100 already). See db/migrations/0003_farmers_and_farms.sql for the schema
 * and db/seed/001_reference.sql for the 10 seeded categories.
 *
 * A rating missing any category score is DRAFT/incomplete, not zero — see
 * farm-ratings.service.ts for the DRAFT -> COMPLETE lifecycle.
 */
import { z } from 'zod';

export const ratingTiers = ['POOR', 'MODERATE', 'GOOD', 'EXCELLENT'] as const;
export type RatingTier = (typeof ratingTiers)[number];

export const ratingStatuses = ['DRAFT', 'COMPLETE'] as const;
export type RatingStatus = (typeof ratingStatuses)[number];

export const farmerIdParams = z
  .object({
    id: z.string().uuid('Farmer ID must be a valid UUID'),
  })
  .strict();
export type FarmerIdParams = z.infer<typeof farmerIdParams>;

/**
 * `categoryCode` is a plain string, NOT a compile-time zod enum of the 10
 * active codes. `rating_categories.is_active` is data specifically so that
 * the active set can change without a code deploy; the live set is validated
 * in farm-ratings.service.ts against that table, not against this schema.
 *
 * `score` is checked only for integer-ness here, NOT range. Zod validation
 * failures always surface as the generic `VALIDATION_FAILED` (see
 * errorHandler.ts's `zodToAppError` — it has no path to a domain code), but
 * BR-06a's test contract requires `code: SCORE_OUT_OF_RANGE` for a score
 * outside 0-10. The service throws that domain error explicitly instead.
 */
export const farmRatingModuleInput = z
  .object({
    categoryCode: z.string().min(1, 'categoryCode is required'),
    score: z.number().int('score must be an integer'),
  })
  .strict();
export type FarmRatingModuleInput = z.infer<typeof farmRatingModuleInput>;

export const setFarmRatingBody = z
  .object({
    // 1-10 entries: the PUT supports incremental scoring across multiple
    // calls to build up the same in-progress (DRAFT) rating cycle. The
    // "exactly the 10 active codes, no more, no fewer, no duplicates" rule
    // (BR-06b) applies to the CUMULATIVE set of scores recorded for the
    // cycle, not to any single request body, so it is enforced in the
    // service against live data, not here.
    modules: z
      .array(farmRatingModuleInput)
      .min(1, 'At least one module score is required')
      .max(10, 'A farm rating has at most 10 categories'),
    notes: z.string().max(500).optional(),
  })
  .strict();
export type SetFarmRatingBody = z.infer<typeof setFarmRatingBody>;

/**
 * No `name`/display-name field: root CLAUDE.md §2.7 forbids user-facing
 * strings sourced from the DB reaching a client. The mobile/admin clients own
 * category display names via their own i18n catalogues; `categoryCode` is
 * enough for them to look up their own label.
 */
export const farmRatingModuleResponse = z.object({
  categoryCode: z.string(),
  score: z.number().int().nullable(),
  maxScore: z.literal(10),
});
export type FarmRatingModuleResponse = z.infer<typeof farmRatingModuleResponse>;

export const farmRatingResponse = z.object({
  farmerId: z.string().uuid(),
  periodLabel: z.string(),
  status: z.enum(ratingStatuses),
  modules: z.array(farmRatingModuleResponse).length(10),
  overallRating: z.number().nullable(),
  ratingTier: z.enum(ratingTiers).nullable(),
  ratedAt: z.string().nullable(),
});
export type FarmRatingResponse = z.infer<typeof farmRatingResponse>;
