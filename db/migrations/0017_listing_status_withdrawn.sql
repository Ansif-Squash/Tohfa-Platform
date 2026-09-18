-- =============================================================================
-- 0017_listing_status_withdrawn.sql
-- Add the missing 'WITHDRAWN' value to listing_status.
--
-- docs/openapi.yaml's ListingStatus enum has always documented WITHDRAWN (a
-- farmer withdrawing their own PENDING_APPROVAL listing), and the API code
-- (listings.repo.ts withdrawListing/getRollupSummary) has always written
-- SQL against that value. The enum created in 0001_extensions_and_enums.sql
-- never actually included it — it has CANCELLED instead, which is not part
-- of the documented contract. Every withdraw-listing request has therefore
-- been failing at the database with "invalid input value for enum
-- listing_status: WITHDRAWN" since the feature was written. The OpenAPI
-- spec is the ground truth here (root CLAUDE.md §1), so the database is
-- what's wrong, not the application code — add the value it was always
-- missing. CANCELLED is left in place: it is not part of the documented
-- ListingStatus enum, but existing seeded data uses it and dropping an
-- enum value is destructive; it is simply an unused legacy value now.
--
-- A partial index and a CHECK constraint both embed literal comparisons
-- against this enum, so both must be dropped before the column can be
-- retyped and recreated identically afterward.
-- =============================================================================

-- +migrate Up
DROP INDEX IF EXISTS idx_produce_listings_queue;
ALTER TABLE produce_listings DROP CONSTRAINT IF EXISTS produce_listings_rejection_reason_chk;

ALTER TABLE produce_listings ALTER COLUMN status DROP DEFAULT;
ALTER TABLE produce_listings ALTER COLUMN status TYPE text;
DROP TYPE IF EXISTS listing_status;
CREATE TYPE listing_status AS ENUM (
    'DRAFT',
    'PENDING_APPROVAL',
    'COUNTER_OFFERED',
    'ACCEPTED',
    'REJECTED',
    'WITHDRAWN',
    'EXPIRED',
    'FULFILLED',
    'CANCELLED'
);
ALTER TABLE produce_listings ALTER COLUMN status TYPE listing_status USING status::listing_status;
ALTER TABLE produce_listings ALTER COLUMN status SET DEFAULT 'DRAFT';

ALTER TABLE produce_listings ADD CONSTRAINT produce_listings_rejection_reason_chk
    CHECK (status <> 'REJECTED' OR rejection_reason IS NOT NULL);
CREATE INDEX idx_produce_listings_queue
    ON produce_listings (status, created_at)
    WHERE status IN ('PENDING_APPROVAL', 'COUNTER_OFFERED');

-- +migrate Down
DROP INDEX IF EXISTS idx_produce_listings_queue;
ALTER TABLE produce_listings DROP CONSTRAINT IF EXISTS produce_listings_rejection_reason_chk;

ALTER TABLE produce_listings ALTER COLUMN status DROP DEFAULT;
ALTER TABLE produce_listings ALTER COLUMN status TYPE text;
DROP TYPE IF EXISTS listing_status;
CREATE TYPE listing_status AS ENUM (
    'DRAFT',
    'PENDING_APPROVAL',
    'COUNTER_OFFERED',
    'ACCEPTED',
    'REJECTED',
    'EXPIRED',
    'FULFILLED',
    'CANCELLED'
);
ALTER TABLE produce_listings ALTER COLUMN status TYPE listing_status USING status::listing_status;
ALTER TABLE produce_listings ALTER COLUMN status SET DEFAULT 'DRAFT';

ALTER TABLE produce_listings ADD CONSTRAINT produce_listings_rejection_reason_chk
    CHECK (status <> 'REJECTED' OR rejection_reason IS NOT NULL);
CREATE INDEX idx_produce_listings_queue
    ON produce_listings (status, created_at)
    WHERE status IN ('PENDING_APPROVAL', 'COUNTER_OFFERED');
