-- =============================================================================
-- 0006_customers_orders.sql
-- Customers, the 24-hour cart lock (BR-22), orders with the four sales
-- channels (BR-15), pickup-first fulfilment (BR-21) and the 4-digit handover
-- OTP (BR-20). Order status history is append-only.
-- =============================================================================

-- +migrate Up

-- -----------------------------------------------------------------------------
-- customers
-- -----------------------------------------------------------------------------
CREATE TABLE customers (
    id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 uuid        NOT NULL UNIQUE REFERENCES users (id) ON DELETE RESTRICT,
    customer_code           text        NOT NULL UNIQUE,
    customer_type           text        NOT NULL DEFAULT 'RETAIL'
                                        CHECK (customer_type IN ('RETAIL', 'B2B', 'HORECA')),
    business_name           text,
    gstin                   text,
    gst_verified            boolean     NOT NULL DEFAULT false,
    preferred_warehouse_id  uuid        REFERENCES warehouses (id),
    default_address_id      uuid,       -- FK added below
    total_orders            integer     NOT NULL DEFAULT 0 CHECK (total_orders >= 0),
    lifetime_value          numeric(12,2) NOT NULL DEFAULT 0 CHECK (lifetime_value >= 0),
    created_at              timestamptz NOT NULL DEFAULT now(),
    updated_at              timestamptz,
    deleted_at              timestamptz,
    CONSTRAINT customers_gstin_format_chk
        CHECK (gstin IS NULL OR gstin ~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]{3}$'),
    -- A B2B/Horeca account without a business name is a retail account with
    -- ambitions; GST treatment depends on this distinction being real.
    CONSTRAINT customers_business_needs_name_chk
        CHECK (customer_type = 'RETAIL' OR business_name IS NOT NULL)
);

CREATE INDEX idx_customers_user_id                ON customers (user_id);
CREATE INDEX idx_customers_preferred_warehouse_id ON customers (preferred_warehouse_id);
CREATE INDEX idx_customers_default_address_id     ON customers (default_address_id);
CREATE UNIQUE INDEX uq_customers_gstin ON customers (gstin) WHERE gstin IS NOT NULL AND deleted_at IS NULL;

COMMENT ON TABLE customers IS
    'Customer master. BR-27: preferred_warehouse_id is a convenience default only — '
    'a customer may place a pickup order at any of the four warehouses and the '
    'order path must not narrow that. BR-36: every customer query is filtered by '
    'this id; cross-customer reads return 404, not 403.';

CREATE TABLE customer_addresses (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id  uuid        NOT NULL REFERENCES customers (id) ON DELETE CASCADE,
    label        text        NOT NULL DEFAULT 'HOME',
    line1        text        NOT NULL,
    line2        text,
    city         text        NOT NULL,
    district     text,
    state        text        NOT NULL DEFAULT 'Tamil Nadu',
    pincode      text        NOT NULL CHECK (pincode ~ '^[1-9][0-9]{5}$'),
    lat          numeric(9,6) CHECK (lat IS NULL OR lat BETWEEN -90  AND 90),
    lng          numeric(9,6) CHECK (lng IS NULL OR lng BETWEEN -180 AND 180),
    geom         geography(POINT, 4326),
    is_default   boolean     NOT NULL DEFAULT false,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz,
    deleted_at   timestamptz
);

CREATE INDEX idx_customer_addresses_customer_id ON customer_addresses (customer_id);
CREATE INDEX idx_customer_addresses_geom_gix    ON customer_addresses USING gist (geom);
CREATE UNIQUE INDEX uq_customer_addresses_default
    ON customer_addresses (customer_id) WHERE is_default AND deleted_at IS NULL;

COMMENT ON TABLE customer_addresses IS
    'Delivery addresses. Modelled for the deferred delivery path (BR-21); Track 1 '
    'orders are pickup and carry a warehouse instead.';

ALTER TABLE customers
    ADD CONSTRAINT customers_default_address_id_fkey
    FOREIGN KEY (default_address_id) REFERENCES customer_addresses (id);

-- -----------------------------------------------------------------------------
-- carts / cart_items — BR-22
-- -----------------------------------------------------------------------------
CREATE TABLE carts (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id   uuid        NOT NULL REFERENCES customers (id) ON DELETE CASCADE,
    warehouse_id  uuid        REFERENCES warehouses (id),
    status        text        NOT NULL DEFAULT 'ACTIVE'
                              CHECK (status IN ('ACTIVE', 'LOCKED', 'CONVERTED', 'EXPIRED')),
    locked_at     timestamptz,
    locked_until  timestamptz,
    subtotal      numeric(12,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz,
    CONSTRAINT carts_lock_pair_chk CHECK ((locked_at IS NULL) = (locked_until IS NULL)),
    CONSTRAINT carts_lock_window_chk CHECK (locked_until IS NULL OR locked_until > locked_at)
);

CREATE INDEX idx_carts_customer_id  ON carts (customer_id);
CREATE INDEX idx_carts_warehouse_id ON carts (warehouse_id);
-- Drives the release job (BR-22b).
CREATE INDEX idx_carts_expiring ON carts (locked_until)
    WHERE status IN ('ACTIVE', 'LOCKED') AND locked_until IS NOT NULL;
CREATE UNIQUE INDEX uq_carts_active_per_customer
    ON carts (customer_id) WHERE status IN ('ACTIVE', 'LOCKED');

COMMENT ON TABLE carts IS
    'BR-22: adding an item reserves quantity against the ONLINE allocation bucket '
    'for 24 hours. locked_until is that deadline — the reservation release job '
    'sweeps rows past it, returns the quantity to allocations.reserved_qty and '
    'marks the cart EXPIRED. The job is idempotent (BR-22b). The window length '
    'comes from system_config.cart_lock_hours, never a literal.';
COMMENT ON COLUMN carts.locked_until IS
    'BR-22: locked_at + 24h. Past this instant the held stock belongs to everyone again.';

CREATE TABLE cart_items (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id            uuid          NOT NULL REFERENCES carts (id) ON DELETE CASCADE,
    crop_id            uuid          NOT NULL REFERENCES crop_master (id),
    grade              produce_grade NOT NULL,
    qty_kg             numeric(12,3) NOT NULL CHECK (qty_kg > 0),
    unit_price         numeric(12,2) NOT NULL CHECK (unit_price >= 0),
    line_total         numeric(12,2) NOT NULL DEFAULT 0 CHECK (line_total >= 0),
    allocation_id      uuid          REFERENCES allocations (id),
    reserved_until     timestamptz,
    status             text          NOT NULL DEFAULT 'HELD'
                                     CHECK (status IN ('HELD', 'RELEASED', 'CONVERTED', 'EXPIRED')),
    created_at         timestamptz   NOT NULL DEFAULT now(),
    updated_at         timestamptz,
    CONSTRAINT cart_items_unique UNIQUE (cart_id, crop_id, grade)
);

CREATE INDEX idx_cart_items_cart_id       ON cart_items (cart_id);
CREATE INDEX idx_cart_items_crop_id       ON cart_items (crop_id);
CREATE INDEX idx_cart_items_allocation_id ON cart_items (allocation_id);
CREATE INDEX idx_cart_items_reserved_until ON cart_items (reserved_until) WHERE status = 'HELD';

COMMENT ON TABLE cart_items IS
    'BR-22a: a held line reduces the ONLINE bucket immediately via '
    'allocations.reserved_qty (allocation_id names the bucket). BR-22b: the expiry '
    'job flips HELD to EXPIRED and gives the quantity back.';

-- -----------------------------------------------------------------------------
-- orders — BR-15, BR-17, BR-20, BR-21, BR-27
-- -----------------------------------------------------------------------------
CREATE TABLE orders (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number        text            NOT NULL UNIQUE,
    customer_id         uuid            NOT NULL REFERENCES customers (id) ON DELETE RESTRICT,
    warehouse_id        uuid            NOT NULL REFERENCES warehouses (id),
    cart_id             uuid            REFERENCES carts (id),

    -- BR-15: exactly four channels, non-nullable. Track 1 accepts ONLINE only;
    -- the other three are rejected with 501, never silently treated as ONLINE.
    channel             text            NOT NULL DEFAULT 'ONLINE'
                                        CHECK (channel IN ('ONLINE', 'MARKET', 'HORECA', 'B2B')),

    fulfilment_type     fulfilment_type NOT NULL DEFAULT 'PICKUP',
    delivery_address_id uuid            REFERENCES customer_addresses (id),
    delivery_slot       delivery_slot,
    delivery_date       date,

    subtotal            numeric(12,2)   NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
    delivery_fee        numeric(12,2)   NOT NULL DEFAULT 0 CHECK (delivery_fee >= 0),
    discount            numeric(12,2)   NOT NULL DEFAULT 0 CHECK (discount >= 0),
    gst_amount          numeric(12,2)   NOT NULL DEFAULT 0 CHECK (gst_amount >= 0),
    total_amount        numeric(12,2)   NOT NULL DEFAULT 0 CHECK (total_amount >= 0),

    payment_method      payment_method  NOT NULL DEFAULT 'WALLET',
    payment_status      text            NOT NULL DEFAULT 'PENDING'
                                        CHECK (payment_status IN ('PENDING', 'PAID',
                                                                  'PARTIALLY_PAID',
                                                                  'REFUNDED', 'FAILED')),
    status              order_status    NOT NULL DEFAULT 'PENDING_PAYMENT',

    -- BR-20: the 4-digit handover OTP. Only ever stored hashed; the plaintext is
    -- generated server-side, sent to the customer, and never returned to the
    -- verifying admin or included in any response payload.
    delivery_otp_hash   text,
    otp_verified_at     timestamptz,
    otp_attempts        smallint        NOT NULL DEFAULT 0 CHECK (otp_attempts >= 0),
    otp_verified_by     uuid            REFERENCES users (id),

    placed_at           timestamptz     NOT NULL DEFAULT now(),
    packed_at           timestamptz,
    completed_at        timestamptz,
    cancelled_at        timestamptz,
    cancellation_reason text,

    created_at          timestamptz     NOT NULL DEFAULT now(),
    updated_at          timestamptz,

    -- BR-21a: a pickup order names a warehouse (always true, warehouse_id is NOT
    -- NULL) and carries no address; a delivery order must name an address.
    CONSTRAINT orders_delivery_needs_address_chk
        CHECK (fulfilment_type <> 'DELIVERY' OR delivery_address_id IS NOT NULL),
    CONSTRAINT orders_pickup_has_no_address_chk
        CHECK (fulfilment_type <> 'PICKUP' OR delivery_address_id IS NULL),
    CONSTRAINT orders_cancellation_reason_chk
        CHECK (status <> 'CANCELLED' OR cancellation_reason IS NOT NULL),
    CONSTRAINT orders_otp_verified_pair_chk
        CHECK ((otp_verified_at IS NULL) = (otp_verified_by IS NULL))
);

CREATE INDEX idx_orders_customer_id         ON orders (customer_id, placed_at DESC);
CREATE INDEX idx_orders_warehouse_id        ON orders (warehouse_id, status);
CREATE INDEX idx_orders_cart_id             ON orders (cart_id);
CREATE INDEX idx_orders_delivery_address_id ON orders (delivery_address_id);
CREATE INDEX idx_orders_otp_verified_by     ON orders (otp_verified_by);
CREATE INDEX idx_orders_open                ON orders (warehouse_id, placed_at)
    WHERE status IN ('CONFIRMED', 'PACKED', 'READY_FOR_PICKUP');

COMMENT ON TABLE orders IS
$doc$Customer orders.

BR-15  — channel is NOT NULL and constrained to the four values; Track 1 serves
         ONLINE and returns 501 for the rest rather than mislabelling them.
BR-17  — wallet-first. An order row is only created once the wallet debit has
         succeeded; an insufficient balance is a 402 with a shortfall and NO row.
BR-20  — delivery_otp_hash holds only a hash. The plaintext OTP is never
         returned to the verifying admin, never logged, never in a payload.
         otp_attempts backs the lockout.
BR-21a — every Track 1 order is fulfilment_type = PICKUP with a warehouse_id.
BR-21b — OUT_FOR_DELIVERY exists in the enum but no endpoint transitions to it.
BR-27  — warehouse_id may be any of the four; there is no home-warehouse rule.
BR-36  — every read is filtered by customer_id; another customer's order is 404.$doc$;
COMMENT ON COLUMN orders.delivery_otp_hash IS
    'BR-20: hash only. Generated server-side per order, held by the customer, '
    'verified by the warehouse admin who never sees the value (contradiction 11).';

CREATE TABLE order_items (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id          uuid          NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
    crop_id           uuid          NOT NULL REFERENCES crop_master (id),
    grade             produce_grade NOT NULL,
    qty_kg            numeric(12,3) NOT NULL CHECK (qty_kg > 0),
    unit_price        numeric(12,2) NOT NULL CHECK (unit_price >= 0),
    gst_rate          numeric(5,2)  NOT NULL DEFAULT 0 CHECK (gst_rate >= 0),
    gst_amount        numeric(12,2) NOT NULL DEFAULT 0 CHECK (gst_amount >= 0),
    line_total        numeric(12,2) NOT NULL CHECK (line_total >= 0),
    fulfilled_qty_kg  numeric(12,3) NOT NULL DEFAULT 0 CHECK (fulfilled_qty_kg >= 0),
    batch_id          uuid          REFERENCES inventory_batches (id),
    allocation_id     uuid          REFERENCES allocations (id),
    status            text          NOT NULL DEFAULT 'PENDING'
                                    CHECK (status IN ('PENDING', 'PACKED', 'FULFILLED',
                                                      'CANCELLED', 'RETURNED')),
    created_at        timestamptz   NOT NULL DEFAULT now(),
    updated_at        timestamptz,
    CONSTRAINT order_items_fulfilled_within_ordered_chk CHECK (fulfilled_qty_kg <= qty_kg)
);

CREATE INDEX idx_order_items_order_id      ON order_items (order_id);
CREATE INDEX idx_order_items_crop_id       ON order_items (crop_id);
CREATE INDEX idx_order_items_batch_id      ON order_items (batch_id);
CREATE INDEX idx_order_items_allocation_id ON order_items (allocation_id);

COMMENT ON TABLE order_items IS
    'Order lines. batch_id closes the traceability loop (BR-24b) from a sold '
    'kilogram back to the farmer who grew it, for payout and recall. BR-16: that '
    'link must never be serialised into a customer response.';

-- -----------------------------------------------------------------------------
-- order_status_history — APPEND ONLY
-- -----------------------------------------------------------------------------
CREATE TABLE order_status_history (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id     uuid        NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
    from_status  order_status,
    to_status    order_status NOT NULL,
    changed_by   uuid        REFERENCES users (id),
    note         text,
    created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_order_status_history_order_id   ON order_status_history (order_id, created_at);
CREATE INDEX idx_order_status_history_changed_by ON order_status_history (changed_by);

COMMENT ON TABLE order_status_history IS
    'APPEND-ONLY. The order lifecycle as evidence: who moved the order, when, and '
    'from what. A correction is a new row. Backdating a delivery by editing this '
    'table is exactly what the append-only guard exists to prevent (BR-20, BR-35).';

SELECT app_make_append_only('order_status_history');

-- -----------------------------------------------------------------------------
-- deliveries / delivery_slots — modelled, deferred (BR-21)
-- -----------------------------------------------------------------------------
CREATE TABLE deliveries (
    id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id             uuid        NOT NULL UNIQUE REFERENCES orders (id) ON DELETE CASCADE,
    warehouse_id         uuid        NOT NULL REFERENCES warehouses (id),
    type                 fulfilment_type NOT NULL DEFAULT 'PICKUP',
    delivery_partner_id  uuid        REFERENCES users (id),
    status               text        NOT NULL DEFAULT 'PENDING'
                                     CHECK (status IN ('PENDING', 'READY', 'DISPATCHED',
                                                       'COMPLETED', 'FAILED')),
    scheduled_slot       delivery_slot,
    scheduled_date       date,
    dispatched_at        timestamptz,
    completed_at         timestamptz,
    handed_over_by       uuid        REFERENCES users (id),
    pod_photo_key        text,
    failure_reason       text,
    created_at           timestamptz NOT NULL DEFAULT now(),
    updated_at           timestamptz
);

CREATE INDEX idx_deliveries_order_id            ON deliveries (order_id);
CREATE INDEX idx_deliveries_warehouse_id        ON deliveries (warehouse_id);
CREATE INDEX idx_deliveries_delivery_partner_id ON deliveries (delivery_partner_id);
CREATE INDEX idx_deliveries_handed_over_by      ON deliveries (handed_over_by);

COMMENT ON TABLE deliveries IS
    'The handover record. BR-20: completion requires the server to verify the '
    'customer OTP held on orders; handed_over_by is the admin who submitted it. '
    'BR-21b: delivery_partner_id is modelled but never populated in Track 1 — no '
    'endpoint assigns a driver (contradiction 3).';

CREATE TABLE delivery_slots (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_id    uuid          NOT NULL REFERENCES warehouses (id) ON DELETE CASCADE,
    slot_date       date          NOT NULL,
    slot            delivery_slot NOT NULL,
    capacity_orders integer       NOT NULL CHECK (capacity_orders >= 0),
    booked_orders   integer       NOT NULL DEFAULT 0 CHECK (booked_orders >= 0),
    is_active       boolean       NOT NULL DEFAULT true,
    created_at      timestamptz   NOT NULL DEFAULT now(),
    updated_at      timestamptz,
    CONSTRAINT delivery_slots_unique UNIQUE (warehouse_id, slot_date, slot),
    CONSTRAINT delivery_slots_capacity_chk CHECK (booked_orders <= capacity_orders)
);

CREATE INDEX idx_delivery_slots_warehouse_id ON delivery_slots (warehouse_id, slot_date);

COMMENT ON TABLE delivery_slots IS
    'Per-warehouse slot capacity. Modelled because the requirements describe slots '
    'and the matrix describes pickup-only (contradiction 3); no routing consumes '
    'these rows in Track 1, so the model does not prejudge the answer.';

SELECT app_attach_updated_at_triggers();

-- +migrate Down

DROP TABLE IF EXISTS delivery_slots;
DROP TABLE IF EXISTS deliveries;
DROP TABLE IF EXISTS order_status_history;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS cart_items;
DROP TABLE IF EXISTS carts;
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_default_address_id_fkey;
DROP TABLE IF EXISTS customer_addresses;
DROP TABLE IF EXISTS customers;
