-- =============================================================================
-- 0015_order_dispatch_status.sql
-- S-36: Add DISPATCHED to order_status enum type for delivery lifecycle.
-- =============================================================================

-- +migrate Up
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'DISPATCHED' AFTER 'PACKED';

-- +migrate Down
-- PostgreSQL does not support removing enum values in-place.
-- The DISPATCHED value remains dormant in rollback without active rows.
SELECT 1;
