-- =============================================================================
-- 0010_fair_price_no_overlap.sql
-- Enforces BR-08b: Non-overlapping fair price windows per (crop_id, grade)
-- at the database level using an EXCLUDE USING gist constraint.
-- =============================================================================

-- +migrate Up
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE fair_prices
    ADD CONSTRAINT fair_prices_no_overlap
    EXCLUDE USING gist (
        crop_id WITH =,
        grade WITH =,
        daterange(effective_from, effective_to, '[)') WITH &&
    );

-- +migrate Down
ALTER TABLE fair_prices DROP CONSTRAINT IF EXISTS fair_prices_no_overlap;
