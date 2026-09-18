-- =============================================================================
-- 0018_farm_rating_five_modules.sql
--
-- NOTE ON THIS FILENAME: an earlier version of this migration implemented a
-- WRONG "5 active modules x 10, doubled to 100" reading of BR-06. That reading
-- was reverted (docs/rules.md BR-06 is LOCKED at 10 categories x 10 points,
-- summed directly, no multiplier — see db/seed/001_reference.sql's
-- `rating_categories`, all 10 rows `is_active = true`). A migration file's
-- number cannot be renamed once created, so the filename stays; only the
-- content and comments below have been corrected to match the real, locked
-- BR-06. The one piece of this migration that was never module-count-specific
-- — the integer-score CHECK constraint — is unaffected by the correction and
-- is kept as-is.
-- =============================================================================

-- +migrate Up

-- BR-06a: scores are admin-entered integers 0-10, never fractional. This is
-- category-count-agnostic (it constrains one score row at a time, regardless
-- of how many categories are active), so it holds unchanged under the
-- corrected 10-category reading of BR-06. Mirrors the existing "the database
-- rejects it, not only the service" pattern already used for the 0-10 range
-- check in 0003. The table was not yet written to by any application code
-- when this constraint was added, so it needs no backfill.
ALTER TABLE farm_rating_scores
    ADD CONSTRAINT farm_rating_scores_score_integer_chk CHECK (score = trunc(score));

COMMENT ON TABLE farm_ratings IS
    'A rating cycle for one farmer. BR-06 (LOCKED): 10 categories x 10 points, '
    'summed directly to a 0-100 total_score — no multiplier. status stays DRAFT '
    'until all 10 active rating_categories rows have a score for this rating_id; '
    'only then does total_score/tier_code get set and status flip to COMPLETE. '
    'zone_id carries the OWN_ZONE_ONLY predicate for FARMER_ADMIN edits '
    '(farmer.rating.edit). Scores may be submitted incrementally across '
    'multiple PUT calls while DRAFT; once COMPLETE, the next edit starts a new '
    'cycle (new period_label) rather than mutating this row, so every prior '
    'cycle''s scores stay intact — the history mechanism root CLAUDE.md §2.3 '
    'asks ledger-adjacent tables for.';

COMMENT ON TABLE farm_rating_scores IS
    'BR-06a: CHECK (score BETWEEN 0 AND 10) AND CHECK (score = trunc(score)), '
    'the latter added in 0018 — a submitted 11, or a submitted 8.5, is rejected '
    'by the database, not only by the service. BR-06b: exactly one row per '
    '(rating, category).';

-- +migrate Down

ALTER TABLE farm_rating_scores DROP CONSTRAINT IF EXISTS farm_rating_scores_score_integer_chk;

COMMENT ON TABLE farm_ratings IS
    'A rating cycle for one farmer. BR-06: a rating with fewer than 10 category '
    'rows is incomplete, not zero — status stays DRAFT until all 10 exist. '
    'zone_id carries the OWN_ZONE_ONLY predicate for FARMER_ADMIN edits.';

COMMENT ON TABLE farm_rating_scores IS
    'BR-06a: CHECK (score BETWEEN 0 AND 10) per category row — a submitted 11 is '
    'rejected by the database, not only by the service. BR-06b: exactly one row '
    'per (rating, category).';
