451///-- =============================================================================
-- 0005_warehouse_inventory.sql
-- The four fixed warehouses (BR-23), purchasing, goods receipt and quality
-- check, the APPEND-ONLY stock ledger (BR-37) that is the only source of truth
-- for stock, and the 70/10/10/10 allocation buckets (BR-12).
-- =============================================================================

-- +migrate Up

-- -----------------------------------------------------------------------------
-- warehouses — BR-23
-- -----------------------------------------------------------------------------
CREATE TABLE warehouses (
    id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code                 text        NOT NULL UNIQUE,
    name                 text        NOT NULL,
    type                 text        NOT NULL DEFAULT 'SUB' CHECK (type IN ('MAIN', 'SUB')),
    address              text,
    city                 text,
    pincode              text CHECK (pincode IS NULL OR pincode ~ '^[1-9][0-9]{5}$'),
    lat                  numeric(9,6) CHECK (lat IS NULL OR lat BETWEEN -90  AND 90),
    lng                  numeric(9,6) CHECK (lng IS NULL OR lng BETWEEN -180 AND 180),
    geom                 geography(POINT, 4326),
    capacity_kg          numeric(12,3) CHECK (capacity_kg IS NULL OR capacity_kg > 0),
    operating_hours      jsonb,
    is_market_day_venue  boolean     NOT NULL DEFAULT false,
    market_day_of_week   smallint CHECK (market_day_of_week IS NULL OR market_day_of_week BETWEEN 0 AND 6),
    contact_phone        text,
    is_active            boolean     NOT NULL DEFAULT true,
    created_at           timestamptz NOT NULL DEFAULT now(),
    updated_at           timestamptz,
    deleted_at           timestamptz
);

CREATE INDEX idx_warehouses_geom_gix ON warehouses USING gist (geom);
CREATE INDEX idx_warehouses_active   ON warehouses (is_active) WHERE deleted_at IS NULL;

COMMENT ON TABLE warehouses IS
    'BR-23: exactly four warehouses — Ooty, Coonoor, Kotagiri, Gudalur Market — '
    'created by db/seed/001_reference.sql with stable codes. BR-23b: there is no '
    'warehouse-create endpoint in Track 1. BR-27: a customer may pick up from any '
    'of the four; there is no home-warehouse restriction. BR-30: this id is the '
    'scope dimension injected into every SUB_WH_ADMIN query.';

-- Deferred FKs from earlier migrations can now be closed.
ALTER TABLE zones
    ADD CONSTRAINT zones_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES warehouses (id);
ALTER TABLE user_roles
    ADD CONSTRAINT user_roles_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES warehouses (id);

-- -----------------------------------------------------------------------------
-- purchase_orders
-- -----------------------------------------------------------------------------
CREATE TABLE purchase_orders (
    id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    po_number               text          NOT NULL UNIQUE,
    farmer_id               uuid          NOT NULL REFERENCES farmers (id) ON DELETE RESTRICT,
    listing_id              uuid          NOT NULL REFERENCES produce_listings (id),
    warehouse_id            uuid          NOT NULL REFERENCES warehouses (id),
    crop_id                 uuid          NOT NULL REFERENCES crop_master (id),
    grade                   produce_grade NOT NULL,
    quantity_kg             numeric(12,3) NOT NULL CHECK (quantity_kg > 0),
    price_per_kg            numeric(12,2) NOT NULL CHECK (price_per_kg > 0),
    total_amount            numeric(12,2) NOT NULL CHECK (total_amount >= 0),
    status                  po_status     NOT NULL DEFAULT 'ISSUED',
    issued_by               uuid          NOT NULL REFERENCES users (id),
    issued_at               timestamptz   NOT NULL DEFAULT now(),
    expected_delivery_date  date,
    cancelled_by            uuid          REFERENCES users (id),
    cancelled_at            timestamptz,
    cancellation_reason     text,
    created_at              timestamptz   NOT NULL DEFAULT now(),
    updated_at              timestamptz
);

CREATE INDEX idx_purchase_orders_farmer_id    ON purchase_orders (farmer_id);
CREATE INDEX idx_purchase_orders_listing_id   ON purchase_orders (listing_id);
CREATE INDEX idx_purchase_orders_warehouse_id ON purchase_orders (warehouse_id);
CREATE INDEX idx_purchase_orders_crop_id      ON purchase_orders (crop_id);
CREATE INDEX idx_purchase_orders_issued_by    ON purchase_orders (issued_by);
CREATE INDEX idx_purchase_orders_cancelled_by ON purchase_orders (cancelled_by);
CREATE INDEX idx_purchase_orders_open         ON purchase_orders (warehouse_id, status)
    WHERE status IN ('ISSUED', 'PARTIALLY_RECEIVED');

COMMENT ON TABLE purchase_orders IS
    'PO raised against an accepted listing. warehouse_id is the delivery '
    'destination and the BR-30 scope key for SUB_WH_ADMIN reads.';

-- -----------------------------------------------------------------------------
-- goods_receipts
-- -----------------------------------------------------------------------------
CREATE TABLE goods_receipts (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    grn_number         text          NOT NULL UNIQUE,
    purchase_order_id  uuid          NOT NULL REFERENCES purchase_orders (id),
    warehouse_id       uuid          NOT NULL REFERENCES warehouses (id),
    farmer_id          uuid          NOT NULL REFERENCES farmers (id),
    status             grn_status    NOT NULL DEFAULT 'DRAFT',
    gross_qty_kg       numeric(12,3) NOT NULL CHECK (gross_qty_kg >= 0),
    accepted_qty_kg    numeric(12,3) NOT NULL DEFAULT 0 CHECK (accepted_qty_kg >= 0),
    rejected_qty_kg    numeric(12,3) NOT NULL DEFAULT 0 CHECK (rejected_qty_kg >= 0),
    rejection_reason   text,
    vehicle_number     text,
    photo_keys         text[],
    received_by        uuid          NOT NULL REFERENCES users (id),
    received_at        timestamptz   NOT NULL DEFAULT now(),
    created_at         timestamptz   NOT NULL DEFAULT now(),
    updated_at         timestamptz,
    CONSTRAINT goods_receipts_qty_balance_chk
        CHECK (accepted_qty_kg + rejected_qty_kg <= gross_qty_kg),
    CONSTRAINT goods_receipts_rejection_reason_chk
        CHECK (rejected_qty_kg = 0 OR rejection_reason IS NOT NULL)
);

CREATE INDEX idx_goods_receipts_purchase_order_id ON goods_receipts (purchase_order_id);
CREATE INDEX idx_goods_receipts_warehouse_id      ON goods_receipts (warehouse_id);
CREATE INDEX idx_goods_receipts_farmer_id         ON goods_receipts (farmer_id);
CREATE INDEX idx_goods_receipts_received_by       ON goods_receipts (received_by);

COMMENT ON TABLE goods_receipts IS
    'GRN — produce arriving at a warehouse. Rejecting incoming produce always '
    'carries a reason (CHECK), which is what makes the quality counter-offer '
    'surface auditable when it ships.';

-- -----------------------------------------------------------------------------
-- quality_checks / quality_check_items — the 5-point check
-- -----------------------------------------------------------------------------
CREATE TABLE quality_checks (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    goods_receipt_id   uuid          NOT NULL REFERENCES goods_receipts (id) ON DELETE CASCADE,
    warehouse_id       uuid          NOT NULL REFERENCES warehouses (id),
    assigned_grade     produce_grade NOT NULL,
    listed_grade       produce_grade NOT NULL,
    outcome            qc_result     NOT NULL,
    accepted_qty_kg    numeric(12,3) NOT NULL CHECK (accepted_qty_kg >= 0),
    rejected_qty_kg    numeric(12,3) NOT NULL DEFAULT 0 CHECK (rejected_qty_kg >= 0),
    price_adjustment   numeric(12,2) NOT NULL DEFAULT 0,
    defect_notes       text,
    photo_keys         text[],
    checked_by         uuid          NOT NULL REFERENCES users (id),
    checked_at         timestamptz   NOT NULL DEFAULT now(),
    created_at         timestamptz   NOT NULL DEFAULT now(),
    updated_at         timestamptz
);

CREATE INDEX idx_quality_checks_goods_receipt_id ON quality_checks (goods_receipt_id);
CREATE INDEX idx_quality_checks_warehouse_id     ON quality_checks (warehouse_id);
CREATE INDEX idx_quality_checks_checked_by       ON quality_checks (checked_by);

COMMENT ON TABLE quality_checks IS
    'The 5-point quality check at goods receipt. assigned_grade may differ from '
    'listed_grade, which is the trigger for a price adjustment and (deferred) the '
    'second counter-offer surface. Photos are mandatory in the service layer.';

CREATE TABLE quality_check_items (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    quality_check_id  uuid        NOT NULL REFERENCES quality_checks (id) ON DELETE CASCADE,
    parameter         text        NOT NULL
                                  CHECK (parameter IN ('APPEARANCE', 'SIZE_UNIFORMITY', 'MOISTURE',
                                                       'DAMAGE_PEST', 'FRESHNESS')),
    score             smallint    CHECK (score IS NULL OR score BETWEEN 0 AND 10),
    passed            boolean     NOT NULL,
    measured_value    numeric(10,3),
    remarks           text,
    photo_keys        text[],
    created_at        timestamptz NOT NULL DEFAULT now(),
    updated_at        timestamptz,
    CONSTRAINT quality_check_items_unique UNIQUE (quality_check_id, parameter)
);

CREATE INDEX idx_quality_check_items_quality_check_id ON quality_check_items (quality_check_id);

COMMENT ON TABLE quality_check_items IS
    'One row per point of the 5-point check. UNIQUE(check, parameter) means a '
    'check is complete or it is not — partial checks cannot masquerade as passes.';

-- -----------------------------------------------------------------------------
-- inventory_batches — BR-24
-- -----------------------------------------------------------------------------
CREATE TABLE inventory_batches (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_code         text          NOT NULL UNIQUE,
    warehouse_id       uuid          NOT NULL REFERENCES warehouses (id),
    crop_id            uuid          NOT NULL REFERENCES crop_master (id),
    grade              produce_grade NOT NULL,
    goods_receipt_id   uuid          REFERENCES goods_receipts (id),
    source_farmer_id   uuid          NOT NULL REFERENCES farmers (id),
    qty_received       numeric(12,3) NOT NULL CHECK (qty_received >= 0),
    -- Denormalised cache of the ledger. Maintained ONLY by the stock_ledger
    -- trigger; no service, job or migration may set it directly.
    qty_available      numeric(12,3) NOT NULL DEFAULT 0 CHECK (qty_available >= 0),
    cost_per_kg        numeric(12,2) CHECK (cost_per_kg IS NULL OR cost_per_kg >= 0),
    storage_location   text,
    received_on        date          NOT NULL DEFAULT CURRENT_DATE,
    expiry_on          date,
    status             text          NOT NULL DEFAULT 'ACTIVE'
                                     CHECK (status IN ('ACTIVE', 'DEPLETED', 'EXPIRED', 'WRITTEN_OFF')),
    created_at         timestamptz   NOT NULL DEFAULT now(),
    updated_at         timestamptz
);

CREATE INDEX idx_inventory_batches_warehouse_id     ON inventory_batches (warehouse_id);
CREATE INDEX idx_inventory_batches_crop_id          ON inventory_batches (crop_id);
CREATE INDEX idx_inventory_batches_goods_receipt_id ON inventory_batches (goods_receipt_id);
CREATE INDEX idx_inventory_batches_source_farmer_id ON inventory_batches (source_farmer_id);
-- The availability query: pooled by warehouse/crop/grade, FEFO by expiry.
CREATE INDEX idx_inventory_batches_availability
    ON inventory_batches (warehouse_id, crop_id, grade, status, expiry_on)
    WHERE status = 'ACTIVE';

COMMENT ON TABLE inventory_batches IS
    'BR-24: stock is pooled by (warehouse, crop, grade) for selling, so two farmers '
    'batches of Grade 1 carrots in Ooty present as one availability figure. '
    'source_farmer_id keeps provenance for payout and traceability (BR-24b) but '
    'MUST NEVER scope availability and MUST NEVER reach a customer response (BR-16).';
COMMENT ON COLUMN inventory_batches.qty_available IS
    'Derived cache of the append-only stock_ledger. Written exclusively by '
    'trg_stock_ledger_apply. Anything that UPDATEs this column directly is a bug.';
COMMENT ON COLUMN inventory_batches.source_farmer_id IS
    'BR-16: farm-anonymity is a query-layer obligation. This column exists for '
    'payout and recall traceability and is denied to every customer-facing serializer.';

-- -----------------------------------------------------------------------------
-- stock_ledger — APPEND ONLY (BR-37)
-- -----------------------------------------------------------------------------
CREATE TABLE stock_ledger (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id       uuid                NOT NULL REFERENCES inventory_batches (id),
    warehouse_id   uuid                NOT NULL REFERENCES warehouses (id),
    movement_type  stock_movement_type NOT NULL,
    qty_delta      numeric(12,3)       NOT NULL CHECK (qty_delta <> 0),
    balance_after  numeric(12,3)       NOT NULL CHECK (balance_after >= 0),
    ref_type       text,
    ref_id         uuid,
    remarks        text,
    created_by     uuid                REFERENCES users (id),
    created_at     timestamptz         NOT NULL DEFAULT now()
    -- No updated_at, no deleted_at: this table has no "after".
);

CREATE INDEX idx_stock_ledger_batch_id     ON stock_ledger (batch_id, created_at);
CREATE INDEX idx_stock_ledger_warehouse_id ON stock_ledger (warehouse_id, created_at DESC);
CREATE INDEX idx_stock_ledger_created_by   ON stock_ledger (created_by);
CREATE INDEX idx_stock_ledger_ref          ON stock_ledger (ref_type, ref_id);

COMMENT ON TABLE stock_ledger IS
$doc$APPEND-ONLY. The single source of truth for stock quantity (BR-37).

Nothing updates a quantity in place. A correction is a new compensating row,
never an edit of an old one — that is what makes the ledger evidence rather
than a running note. UPDATE, DELETE and TRUNCATE are blocked by
trg_stock_ledger_append_only / trg_stock_ledger_no_truncate and additionally
revoked from the tohfa_app role.

BR-24b: every row resolves to its batch_id, and through it to source_farmer_id.
BR-37b: an approved stock adjustment changes availability by INSERTING here.
BR-12c: allocation buckets are decremented alongside, never instead.

Do not write a migration that rewrites rows in this table. See db/README.md.$doc$;
COMMENT ON COLUMN stock_ledger.balance_after IS
    'Batch balance after this movement, computed by trg_stock_ledger_balance under '
    'a row lock on the batch. CHECK (>= 0) is the last line of defence against '
    'overselling; the allocation buckets are the first.';

-- Computes balance_after under a row lock, so two concurrent sales cannot both
-- read the same "before" figure.
CREATE OR REPLACE FUNCTION app_stock_ledger_balance() RETURNS trigger
LANGUAGE plpgsql AS $fn$
DECLARE
    v_available    numeric(12,3);
    v_warehouse_id uuid;
BEGIN
    SELECT qty_available, warehouse_id
      INTO v_available, v_warehouse_id
      FROM inventory_batches
     WHERE id = NEW.batch_id
     FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'unknown batch_id %', NEW.batch_id USING ERRCODE = '23503';
    END IF;

    IF NEW.warehouse_id IS NULL THEN
        NEW.warehouse_id := v_warehouse_id;
    ELSIF NEW.warehouse_id <> v_warehouse_id THEN
        RAISE EXCEPTION
            'stock_ledger.warehouse_id % does not match batch % warehouse %',
            NEW.warehouse_id, NEW.batch_id, v_warehouse_id
            USING ERRCODE = '23514';
    END IF;

    NEW.balance_after := v_available + NEW.qty_delta;

    IF NEW.balance_after < 0 THEN
        RAISE EXCEPTION
            'insufficient stock on batch %: available %, requested %',
            NEW.batch_id, v_available, NEW.qty_delta
            USING ERRCODE = '23514', HINT = 'code: INSUFFICIENT_STOCK';
    END IF;

    RETURN NEW;
END
$fn$;

CREATE TRIGGER trg_stock_ledger_balance
    BEFORE INSERT ON stock_ledger
    FOR EACH ROW EXECUTE FUNCTION app_stock_ledger_balance();

-- Maintains inventory_batches.qty_available from the ledger. This is the only
-- writer of that column.
CREATE OR REPLACE FUNCTION app_stock_ledger_apply() RETURNS trigger
LANGUAGE plpgsql AS $fn$
BEGIN
    UPDATE inventory_batches
       SET qty_available = NEW.balance_after,
           status = CASE
                        WHEN NEW.balance_after = 0 AND status = 'ACTIVE'   THEN 'DEPLETED'
                        WHEN NEW.balance_after > 0 AND status = 'DEPLETED' THEN 'ACTIVE'
                        ELSE status
                    END,
           updated_at = now()
     WHERE id = NEW.batch_id;

    RETURN NULL;
END
$fn$;

CREATE TRIGGER trg_stock_ledger_apply
    AFTER INSERT ON stock_ledger
    FOR EACH ROW EXECUTE FUNCTION app_stock_ledger_apply();

SELECT app_make_append_only('stock_ledger');

-- -----------------------------------------------------------------------------
-- stock_adjustments — BR-37
-- -----------------------------------------------------------------------------
CREATE TABLE stock_adjustments (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id         uuid          NOT NULL REFERENCES inventory_batches (id),
    warehouse_id     uuid          NOT NULL REFERENCES warehouses (id),
    adjustment_type  text          NOT NULL
                                   CHECK (adjustment_type IN ('DAMAGE', 'SHRINKAGE',
                                                              'COUNT_CORRECTION', 'EXPIRY')),
    qty_delta        numeric(12,3) NOT NULL CHECK (qty_delta <> 0),
    reason           text          NOT NULL,
    status           text          NOT NULL DEFAULT 'PENDING'
                                   CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    created_by       uuid          NOT NULL REFERENCES users (id),
    approved_by      uuid          REFERENCES users (id),
    approved_at      timestamptz,
    ledger_entry_id  uuid          REFERENCES stock_ledger (id),
    created_at       timestamptz   NOT NULL DEFAULT now(),
    updated_at       timestamptz,
    -- BR-37a: the person who loses the stock does not write it off.
    CONSTRAINT stock_adjustments_no_self_approval_chk
        CHECK (approved_by IS NULL OR approved_by <> created_by),
    CONSTRAINT stock_adjustments_approved_pair_chk
        CHECK ((approved_by IS NULL) = (approved_at IS NULL)),
    CONSTRAINT stock_adjustments_ledger_only_when_approved_chk
        CHECK (ledger_entry_id IS NULL OR status = 'APPROVED')
);

CREATE INDEX idx_stock_adjustments_batch_id        ON stock_adjustments (batch_id);
CREATE INDEX idx_stock_adjustments_warehouse_id    ON stock_adjustments (warehouse_id);
CREATE INDEX idx_stock_adjustments_created_by      ON stock_adjustments (created_by);
CREATE INDEX idx_stock_adjustments_approved_by     ON stock_adjustments (approved_by);
CREATE INDEX idx_stock_adjustments_ledger_entry_id ON stock_adjustments (ledger_entry_id);
CREATE INDEX idx_stock_adjustments_pending
    ON stock_adjustments (warehouse_id, created_at) WHERE status = 'PENDING';

COMMENT ON TABLE stock_adjustments IS
    'Manual stock corrections. BR-37a: a SUB_WH_ADMIN may create one for its own '
    'warehouse but may not approve it — approval needs SUPER_ADMIN, TOHFA_ADMIN or '
    'MAIN_WH_ADMIN, and the CHECK forbids approver = creator outright. BR-37b: the '
    'quantity moves only when an APPROVED adjustment inserts a stock_ledger row, '
    'recorded here as ledger_entry_id.';

-- -----------------------------------------------------------------------------
-- stock_verifications — physical count vs system
-- -----------------------------------------------------------------------------
CREATE TABLE stock_verifications (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_id       uuid          NOT NULL REFERENCES warehouses (id),
    batch_id           uuid          REFERENCES inventory_batches (id),
    system_qty         numeric(12,3) NOT NULL CHECK (system_qty >= 0),
    counted_qty        numeric(12,3) NOT NULL CHECK (counted_qty >= 0),
    variance_qty       numeric(12,3) GENERATED ALWAYS AS (counted_qty - system_qty) STORED,
    status             text          NOT NULL DEFAULT 'RECORDED'
                                     CHECK (status IN ('RECORDED', 'RECONCILED', 'DISPUTED')),
    notes              text,
    verified_by        uuid          NOT NULL REFERENCES users (id),
    verified_at        timestamptz   NOT NULL DEFAULT now(),
    adjustment_id      uuid          REFERENCES stock_adjustments (id),
    created_at         timestamptz   NOT NULL DEFAULT now(),
    updated_at         timestamptz
);

CREATE INDEX idx_stock_verifications_warehouse_id  ON stock_verifications (warehouse_id);
CREATE INDEX idx_stock_verifications_batch_id      ON stock_verifications (batch_id);
CREATE INDEX idx_stock_verifications_verified_by   ON stock_verifications (verified_by);
CREATE INDEX idx_stock_verifications_adjustment_id ON stock_verifications (adjustment_id);

COMMENT ON TABLE stock_verifications IS
    'Physical count against the ledger figure. A variance never edits the ledger: '
    'it raises a stock_adjustment which someone else approves (BR-37).';

-- -----------------------------------------------------------------------------
-- stock_transfers — BR-26
-- -----------------------------------------------------------------------------
CREATE TABLE stock_transfers (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_number    text        NOT NULL UNIQUE,
    from_warehouse_id  uuid        NOT NULL REFERENCES warehouses (id),
    to_warehouse_id    uuid        NOT NULL REFERENCES warehouses (id),
    status             text        NOT NULL DEFAULT 'DRAFT'
                                   CHECK (status IN ('DRAFT', 'APPROVED', 'IN_TRANSIT',
                                                     'RECEIVED', 'CANCELLED')),
    initiated_by       uuid        NOT NULL REFERENCES users (id),
    approved_by        uuid        REFERENCES users (id),
    approved_at        timestamptz,
    dispatched_at      timestamptz,
    received_by        uuid        REFERENCES users (id),
    received_at        timestamptz,
    vehicle_number     text,
    notes              text,
    created_at         timestamptz NOT NULL DEFAULT now(),
    updated_at         timestamptz,
    CONSTRAINT stock_transfers_distinct_warehouses_chk
        CHECK (from_warehouse_id <> to_warehouse_id)
);

CREATE INDEX idx_stock_transfers_from_warehouse_id ON stock_transfers (from_warehouse_id);
CREATE INDEX idx_stock_transfers_to_warehouse_id   ON stock_transfers (to_warehouse_id);
CREATE INDEX idx_stock_transfers_initiated_by      ON stock_transfers (initiated_by);
CREATE INDEX idx_stock_transfers_approved_by       ON stock_transfers (approved_by);
CREATE INDEX idx_stock_transfers_received_by       ON stock_transfers (received_by);

COMMENT ON TABLE stock_transfers IS
    'Inter-warehouse movement. BR-26: only SUPER_ADMIN and MAIN_WH_ADMIN may '
    'initiate (TOHFA_ADMIN may not, despite outranking MW; SUB_WH_ADMIN may not '
    'move stock out of its own site). Receiving is a separate, wider permission. '
    'No transfer endpoint exists in Track 1 — the ledger types and this table are '
    'modelled so the capability is not retrofitted onto live stock.';

CREATE TABLE stock_transfer_items (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_id       uuid          NOT NULL REFERENCES stock_transfers (id) ON DELETE CASCADE,
    batch_id          uuid          NOT NULL REFERENCES inventory_batches (id),
    qty_sent          numeric(12,3) NOT NULL CHECK (qty_sent > 0),
    qty_received      numeric(12,3) CHECK (qty_received IS NULL OR qty_received >= 0),
    variance_qty      numeric(12,3) GENERATED ALWAYS AS (COALESCE(qty_received, 0) - qty_sent) STORED,
    out_ledger_id     uuid          REFERENCES stock_ledger (id),
    in_ledger_id      uuid          REFERENCES stock_ledger (id),
    created_at        timestamptz   NOT NULL DEFAULT now(),
    updated_at        timestamptz,
    CONSTRAINT stock_transfer_items_unique UNIQUE (transfer_id, batch_id)
);

CREATE INDEX idx_stock_transfer_items_transfer_id ON stock_transfer_items (transfer_id);
CREATE INDEX idx_stock_transfer_items_batch_id    ON stock_transfer_items (batch_id);
CREATE INDEX idx_stock_transfer_items_out_ledger  ON stock_transfer_items (out_ledger_id);
CREATE INDEX idx_stock_transfer_items_in_ledger   ON stock_transfer_items (in_ledger_id);

COMMENT ON TABLE stock_transfer_items IS
    'Transfer lines. Each side of the move is a separate ledger row '
    '(TRANSFER_OUT, TRANSFER_IN) referenced here, so stock in transit is never '
    'counted twice or lost.';

-- -----------------------------------------------------------------------------
-- allocation_config / allocations — BR-12
-- -----------------------------------------------------------------------------
CREATE TABLE allocation_config (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    channel         allocation_channel NOT NULL,
    percentage      numeric(5,2)  NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
    effective_from  date          NOT NULL DEFAULT CURRENT_DATE,
    set_by          uuid          REFERENCES users (id),
    created_at      timestamptz   NOT NULL DEFAULT now(),
    updated_at      timestamptz,
    CONSTRAINT allocation_config_unique UNIQUE (channel, effective_from)
);

CREATE INDEX idx_allocation_config_set_by ON allocation_config (set_by);
CREATE INDEX idx_allocation_config_window ON allocation_config (effective_from DESC);

COMMENT ON TABLE allocation_config IS
    'BR-12: the 70/10/10/10 split as configuration, settable by SUPER_ADMIN only. '
    'BR-12b: percentages within one effective_from window MUST sum to 100 — '
    'enforced by the deferred constraint trigger below, so a partial edit inside a '
    'transaction is allowed but a committed 99 or 101 is not.';

CREATE OR REPLACE FUNCTION app_allocation_config_sum_guard() RETURNS trigger
LANGUAGE plpgsql AS $fn$
DECLARE
    v_window date;
    v_sum    numeric(6,2);
    v_count  integer;
BEGIN
    v_window := COALESCE(NEW.effective_from, OLD.effective_from);

    SELECT COALESCE(SUM(percentage), 0), COUNT(*)
      INTO v_sum, v_count
      FROM allocation_config
     WHERE effective_from = v_window;

    IF v_count > 0 AND v_sum <> 100 THEN
        RAISE EXCEPTION
            'BR-12b: allocation percentages for % sum to %, must be 100', v_window, v_sum
            USING ERRCODE = '23514', HINT = 'code: ALLOCATION_SUM_INVALID';
    END IF;

    RETURN NULL;
END
$fn$;

CREATE CONSTRAINT TRIGGER trg_allocation_config_sum
    AFTER INSERT OR UPDATE OR DELETE ON allocation_config
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW EXECUTE FUNCTION app_allocation_config_sum_guard();

CREATE TABLE allocations (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id        uuid               NOT NULL REFERENCES inventory_batches (id) ON DELETE CASCADE,
    warehouse_id    uuid               NOT NULL REFERENCES warehouses (id),
    channel         allocation_channel NOT NULL,
    allocated_qty   numeric(12,3)      NOT NULL CHECK (allocated_qty >= 0),
    consumed_qty    numeric(12,3)      NOT NULL DEFAULT 0 CHECK (consumed_qty >= 0),
    reserved_qty    numeric(12,3)      NOT NULL DEFAULT 0 CHECK (reserved_qty >= 0),
    available_qty   numeric(12,3)      GENERATED ALWAYS AS
                                       (allocated_qty - consumed_qty - reserved_qty) STORED,
    computed_by     text               NOT NULL DEFAULT 'AUTO'
                                       CHECK (computed_by IN ('AUTO', 'MANUAL')),
    overridden_by   uuid               REFERENCES users (id),
    overridden_at   timestamptz,
    created_at      timestamptz        NOT NULL DEFAULT now(),
    updated_at      timestamptz,
    CONSTRAINT allocations_unique UNIQUE (batch_id, channel),
    -- The whole point: a bucket cannot promise more than it holds.
    CONSTRAINT allocations_not_oversold_chk
        CHECK (consumed_qty + reserved_qty <= allocated_qty)
);

CREATE INDEX idx_allocations_batch_id      ON allocations (batch_id);
CREATE INDEX idx_allocations_warehouse_id  ON allocations (warehouse_id);
CREATE INDEX idx_allocations_overridden_by ON allocations (overridden_by);
CREATE INDEX idx_allocations_available
    ON allocations (warehouse_id, channel) WHERE available_qty > 0;

COMMENT ON TABLE allocations IS
    'BR-12: the per-batch 70/10/10/10 buckets. BR-12a: a 1000 kg batch yields '
    '700/100/100/100 and any rounding remainder goes to BUFFER, never nowhere. '
    'BR-12c: an online order that exceeds the ONLINE bucket is a 409 '
    'INSUFFICIENT_ALLOCATION — it does not quietly draw on RESERVE. '
    'BR-22: cart holds increment reserved_qty; the release job decrements it. '
    'BR-13: there is deliberately no B2B/HORECA bucket until the client resolves '
    'contradiction 10.';

SELECT app_attach_updated_at_triggers();

-- -----------------------------------------------------------------------------
-- warehouse_consolidated_inventory — BR-24
-- -----------------------------------------------------------------------------
CREATE MATERIALIZED VIEW warehouse_consolidated_inventory AS
SELECT
    warehouse_id,
    crop_id,
    grade,
    SUM(qty_available) AS total_qty,
    jsonb_agg(jsonb_build_object('farmer_id', source_farmer_id, 'qty', qty_available)) AS provenance
FROM inventory_batches
WHERE status = 'ACTIVE'
GROUP BY warehouse_id, crop_id, grade;

CREATE INDEX idx_warehouse_consolidated_inventory ON warehouse_consolidated_inventory (warehouse_id, crop_id, grade);

CREATE OR REPLACE FUNCTION refresh_warehouse_consolidated_inventory() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY warehouse_consolidated_inventory;
    RETURN NULL;
END;
$$;

CREATE TRIGGER trg_refresh_warehouse_consolidated_inventory
AFTER INSERT OR UPDATE OR DELETE ON inventory_batches
FOR EACH STATEMENT EXECUTE FUNCTION refresh_warehouse_consolidated_inventory();

-- +migrate Down

DROP TABLE IF EXISTS allocations;
DROP TRIGGER IF EXISTS trg_allocation_config_sum ON allocation_config;
DROP FUNCTION IF EXISTS app_allocation_config_sum_guard();
DROP TABLE IF EXISTS allocation_config;
DROP TABLE IF EXISTS stock_transfer_items;
DROP TABLE IF EXISTS stock_transfers;
DROP TABLE IF EXISTS stock_verifications;
DROP TABLE IF EXISTS stock_adjustments;
DROP TRIGGER IF EXISTS trg_stock_ledger_apply ON stock_ledger;
DROP TRIGGER IF EXISTS trg_stock_ledger_balance ON stock_ledger;
DROP FUNCTION IF EXISTS app_stock_ledger_apply();
DROP FUNCTION IF EXISTS app_stock_ledger_balance();
DROP TABLE IF EXISTS stock_ledger;
DROP TABLE IF EXISTS inventory_batches;
DROP TABLE IF EXISTS quality_check_items;
DROP TABLE IF EXISTS quality_checks;
DROP TABLE IF EXISTS goods_receipts;
DROP TABLE IF EXISTS purchase_orders;
ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_warehouse_id_fkey;
ALTER TABLE zones      DROP CONSTRAINT IF EXISTS zones_warehouse_id_fkey;
DROP TABLE IF EXISTS warehouses;
