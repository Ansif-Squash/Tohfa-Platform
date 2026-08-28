-- =============================================================================
-- 0012_rejected_goods_disposal.sql
-- S-25: Sequence for gap-free GRN numbering and rejected-goods disposal record.
-- =============================================================================

-- +migrate Up
CREATE SEQUENCE IF NOT EXISTS goods_receipt_number_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE IF NOT EXISTS rejected_goods_disposal (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    goods_receipt_id uuid          NOT NULL REFERENCES goods_receipts (id) ON DELETE RESTRICT,
    warehouse_id     uuid          NOT NULL REFERENCES warehouses (id),
    quantity_kg      numeric(12,3) NOT NULL CHECK (quantity_kg > 0),
    disposal_method  text          NOT NULL CHECK (disposal_method IN ('COMPOST', 'DISCARD', 'RETURN_TO_FARMER', 'BIO_WASTE')),
    reason           text          NOT NULL,
    photo_keys       text[],
    disposed_by      uuid          NOT NULL REFERENCES users (id),
    disposed_at      timestamptz   NOT NULL DEFAULT now(),
    created_at       timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rejected_goods_disposal_grn ON rejected_goods_disposal (goods_receipt_id);
CREATE INDEX IF NOT EXISTS idx_rejected_goods_disposal_warehouse ON rejected_goods_disposal (warehouse_id);

-- +migrate Down
DROP TABLE IF EXISTS rejected_goods_disposal;
DROP SEQUENCE IF EXISTS goods_receipt_number_seq;
