-- =============================================================================
-- 0011_purchase_order_uniqueness.sql
-- S-24: Ensures exactly one purchase order per listing (idempotent approvals)
-- and provides a sequence for gap-free PO number generation.
-- =============================================================================

-- +migrate Up
CREATE SEQUENCE IF NOT EXISTS purchase_order_number_seq START WITH 1 INCREMENT BY 1;

CREATE UNIQUE INDEX IF NOT EXISTS uq_purchase_orders_listing_id ON purchase_orders (listing_id);

-- +migrate Down
DROP INDEX IF EXISTS uq_purchase_orders_listing_id;
DROP SEQUENCE IF EXISTS purchase_order_number_seq;
