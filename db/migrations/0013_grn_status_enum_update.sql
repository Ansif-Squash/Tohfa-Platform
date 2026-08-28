-- =============================================================================
-- 0013_grn_status_enum_update.sql
-- S-25: Recreate grn_status enum type to include OpenAPI lifecycle statuses.
-- =============================================================================

-- +migrate Up
ALTER TABLE goods_receipts ALTER COLUMN status DROP DEFAULT;
ALTER TABLE goods_receipts ALTER COLUMN status TYPE text;
DROP TYPE IF EXISTS grn_status;
CREATE TYPE grn_status AS ENUM (
    'AWAITING_QC',
    'ACCEPTED',
    'PARTIALLY_ACCEPTED',
    'REJECTED',
    'COUNTER_OFFERED',
    'DRAFT',
    'RECEIVED',
    'QC_PENDING',
    'QC_DONE'
);
ALTER TABLE goods_receipts ALTER COLUMN status TYPE grn_status USING status::grn_status;
ALTER TABLE goods_receipts ALTER COLUMN status SET DEFAULT 'AWAITING_QC';

-- +migrate Down
ALTER TABLE goods_receipts ALTER COLUMN status DROP DEFAULT;
ALTER TABLE goods_receipts ALTER COLUMN status TYPE text;
DROP TYPE IF EXISTS grn_status;
CREATE TYPE grn_status AS ENUM (
    'DRAFT',
    'RECEIVED',
    'QC_PENDING',
    'QC_DONE',
    'REJECTED'
);
ALTER TABLE goods_receipts ALTER COLUMN status TYPE grn_status USING status::grn_status;
ALTER TABLE goods_receipts ALTER COLUMN status SET DEFAULT 'DRAFT';
