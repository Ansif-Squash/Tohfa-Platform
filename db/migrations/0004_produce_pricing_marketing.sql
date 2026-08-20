-- =============================================================================
-- 0004_produce_pricing_marketing.sql
-- The crop catalogue, the fair price ceiling (BR-07/BR-08), retail pricing
-- (BR-09), produce listings, the 24h / 3-round counter-offer loop
-- (BR-10/BR-11) and the self-approval auto-route (BR-29).
-- =============================================================================

-- +migrate Up

-- -----------------------------------------------------------------------------
-- Reference: categories, grades, crop_master
-- -----------------------------------------------------------------------------
CREATE TABLE categories (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug        text        NOT NULL UNIQUE,
    name        text        NOT NULL,
    image_key   text,
    sort_order  smallint    NOT NULL DEFAULT 0,
    is_active   boolean     NOT NULL DEFAULT true,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz
);

COMMENT ON TABLE categories IS
    'Customer-facing produce categories (seeded reference data). BR-16: category '
    'and grade are the sort of thing a customer may see; farm identity is not.';

CREATE TABLE grades (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code        produce_grade NOT NULL UNIQUE,
    name        text        NOT NULL,
    description text,
    sort_order  smallint    NOT NULL DEFAULT 0,
    is_sellable boolean     NOT NULL DEFAULT true,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz
);

COMMENT ON TABLE grades IS
    'Grade 1/2/3/Reject as reference data keyed by the produce_grade enum, so that '
    'display text can change without a type migration. is_sellable is false for REJECT.';

CREATE TABLE crop_master (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug            text        NOT NULL UNIQUE,
    name            text        NOT NULL,
    name_ta         text,
    category_id     uuid        NOT NULL REFERENCES categories (id),
    botanical_name  text,
    default_unit    text        NOT NULL DEFAULT 'kg' CHECK (default_unit IN ('kg')),
    season_months   smallint[],
    shelf_life_days smallint CHECK (shelf_life_days IS NULL OR shelf_life_days > 0),
    hsn_code        text,
    icon_key        text,
    is_active       boolean     NOT NULL DEFAULT true,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz,
    deleted_at      timestamptz
);

CREATE INDEX idx_crop_master_category_id ON crop_master (category_id);
CREATE INDEX idx_crop_master_active      ON crop_master (is_active) WHERE deleted_at IS NULL;

COMMENT ON TABLE crop_master IS
    'Crop catalogue (seeded with the Nilgiris crop set). Every price, listing, '
    'batch and order line resolves to a crop here.';

-- -----------------------------------------------------------------------------
-- farm_crops — what is planted where
-- -----------------------------------------------------------------------------
CREATE TABLE farm_crops (
    id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    plot_id              uuid        NOT NULL REFERENCES plots (id) ON DELETE CASCADE,
    crop_id              uuid        NOT NULL REFERENCES crop_master (id),
    planted_on           date,
    expected_harvest_on  date,
    actual_harvest_on    date,
    expected_yield_kg    numeric(12,3) CHECK (expected_yield_kg IS NULL OR expected_yield_kg >= 0),
    actual_yield_kg      numeric(12,3) CHECK (actual_yield_kg IS NULL OR actual_yield_kg >= 0),
    status               text        NOT NULL DEFAULT 'PLANNED'
                                     CHECK (status IN ('PLANNED', 'GROWING', 'HARVESTED', 'FAILED')),
    notes                text,
    created_at           timestamptz NOT NULL DEFAULT now(),
    updated_at           timestamptz,
    deleted_at           timestamptz,
    CONSTRAINT farm_crops_harvest_after_planting_chk
        CHECK (actual_harvest_on IS NULL OR planted_on IS NULL OR actual_harvest_on >= planted_on)
);

CREATE INDEX idx_farm_crops_plot_id ON farm_crops (plot_id);
CREATE INDEX idx_farm_crops_crop_id ON farm_crops (crop_id);
CREATE INDEX idx_farm_crops_calendar ON farm_crops (expected_harvest_on)
    WHERE status IN ('PLANNED', 'GROWING');

COMMENT ON TABLE farm_crops IS
    'Planting records; the source of the consolidated produce calendar '
    '(produce.calendar.view_consolidated). Links a listing back to the plot it grew in.';

-- -----------------------------------------------------------------------------
-- fair_prices — BR-07, BR-08
-- -----------------------------------------------------------------------------
CREATE TABLE fair_prices (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    crop_id         uuid          NOT NULL REFERENCES crop_master (id),
    grade           produce_grade NOT NULL,
    ceiling_price   numeric(12,2) NOT NULL CHECK (ceiling_price > 0),
    effective_from  date          NOT NULL,
    effective_to    date,
    frequency       text          NOT NULL DEFAULT 'WEEKLY'
                                  CHECK (frequency IN ('DAILY', 'WEEKLY')),
    set_by          uuid          NOT NULL REFERENCES users (id),
    notes           text,
    created_at      timestamptz   NOT NULL DEFAULT now(),
    updated_at      timestamptz,
    CONSTRAINT fair_prices_range_chk CHECK (effective_to IS NULL OR effective_to > effective_from),
    CONSTRAINT fair_prices_unique UNIQUE (crop_id, grade, effective_from)
);

CREATE INDEX idx_fair_prices_crop_id ON fair_prices (crop_id);
CREATE INDEX idx_fair_prices_set_by  ON fair_prices (set_by);
CREATE INDEX idx_fair_prices_lookup  ON fair_prices (crop_id, grade, effective_from DESC);
CREATE UNIQUE INDEX uq_fair_prices_open_window
    ON fair_prices (crop_id, grade) WHERE effective_to IS NULL;

COMMENT ON TABLE fair_prices IS
    'The fair price ceiling. BR-08: writable by SUPER_ADMIN only — TOHFA_ADMIN is '
    'explicitly denied. BR-08b: rows are append-only in practice (a change closes '
    'the old window and inserts a new one) and the unique index on an open window '
    'plus UNIQUE(crop_id, grade, effective_from) keeps ranges from overlapping. '
    'BR-07: produce_listings.fair_price_id records the exact row a listing was '
    'validated against, so BR-07c (a later cut does not invalidate history) holds.';
COMMENT ON COLUMN fair_prices.set_by IS
    'BR-08: the acting SUPER_ADMIN. NOT NULL — an anonymous ceiling change is not '
    'an audit trail.';

-- -----------------------------------------------------------------------------
-- retail_prices — BR-09
-- -----------------------------------------------------------------------------
CREATE TABLE retail_prices (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    crop_id         uuid          NOT NULL REFERENCES crop_master (id),
    grade           produce_grade NOT NULL,
    price           numeric(12,2) NOT NULL CHECK (price > 0),
    markup_pct      numeric(5,2) CHECK (markup_pct IS NULL OR markup_pct >= 0),
    gst_inclusive   boolean       NOT NULL DEFAULT true,
    fair_price_id   uuid          REFERENCES fair_prices (id),
    effective_from  date          NOT NULL,
    effective_to    date,
    set_by          uuid          NOT NULL REFERENCES users (id),
    created_at      timestamptz   NOT NULL DEFAULT now(),
    updated_at      timestamptz,
    CONSTRAINT retail_prices_range_chk CHECK (effective_to IS NULL OR effective_to > effective_from),
    CONSTRAINT retail_prices_unique UNIQUE (crop_id, grade, effective_from)
);

CREATE INDEX idx_retail_prices_crop_id       ON retail_prices (crop_id);
CREATE INDEX idx_retail_prices_fair_price_id ON retail_prices (fair_price_id);
CREATE INDEX idx_retail_prices_set_by        ON retail_prices (set_by);
CREATE INDEX idx_retail_prices_lookup        ON retail_prices (crop_id, grade, effective_from DESC);

COMMENT ON TABLE retail_prices IS
    'Customer-facing price. BR-09: MUST NOT exceed the ceiling in force on '
    'effective_from; fair_price_id records the ceiling row it was checked against '
    'so BR-09b can list affected rows when a ceiling is later lowered. '
    'gst_inclusive is true for retail, false for B2B (Assumption 10).';

-- -----------------------------------------------------------------------------
-- produce_listings — BR-07, BR-16, BR-29
-- -----------------------------------------------------------------------------
CREATE TABLE produce_listings (
    id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_number        text          NOT NULL UNIQUE,
    farmer_id             uuid          NOT NULL REFERENCES farmers (id) ON DELETE RESTRICT,
    farm_id               uuid          REFERENCES farms (id),
    farm_crop_id          uuid          REFERENCES farm_crops (id),
    crop_id               uuid          NOT NULL REFERENCES crop_master (id),
    grade                 produce_grade NOT NULL,
    quantity_kg           numeric(12,3) NOT NULL CHECK (quantity_kg > 0),
    price_per_kg          numeric(12,2) NOT NULL CHECK (price_per_kg > 0),
    fair_price_id         uuid          NOT NULL REFERENCES fair_prices (id),
    status                listing_status NOT NULL DEFAULT 'DRAFT',
    available_from        date,
    photo_keys            text[],

    -- BR-09 / BR-02: the badges a customer will see are copied in at creation
    -- from the farmer's then-verified certificates and never recomputed. A
    -- certificate expiring later does not silently rewrite a shipped listing,
    -- and a certificate verified later does not retroactively bless one.
    certification_badges  jsonb         NOT NULL DEFAULT '[]'::jsonb,

    approved_by           uuid          REFERENCES users (id),
    approved_at           timestamptz,
    rejected_by           uuid          REFERENCES users (id),
    rejected_at           timestamptz,
    rejection_reason      text,
    final_price_per_kg    numeric(12,2) CHECK (final_price_per_kg IS NULL OR final_price_per_kg > 0),
    final_quantity_kg     numeric(12,3) CHECK (final_quantity_kg  IS NULL OR final_quantity_kg  > 0),

    -- Optimistic lock. Two admins acting on the same listing is the normal case,
    -- not the exotic one, once auto-routing (BR-29b) puts it in two queues.
    version               integer       NOT NULL DEFAULT 1 CHECK (version > 0),

    created_at            timestamptz   NOT NULL DEFAULT now(),
    updated_at            timestamptz,
    deleted_at            timestamptz,

    CONSTRAINT produce_listings_badges_is_array_chk
        CHECK (jsonb_typeof(certification_badges) = 'array'),
    CONSTRAINT produce_listings_rejection_reason_chk
        CHECK (status <> 'REJECTED' OR rejection_reason IS NOT NULL),
    CONSTRAINT produce_listings_approval_pair_chk
        CHECK ((approved_by IS NULL) = (approved_at IS NULL))
);

CREATE INDEX idx_produce_listings_farmer_id     ON produce_listings (farmer_id);
CREATE INDEX idx_produce_listings_farm_id       ON produce_listings (farm_id);
CREATE INDEX idx_produce_listings_farm_crop_id  ON produce_listings (farm_crop_id);
CREATE INDEX idx_produce_listings_crop_id       ON produce_listings (crop_id);
CREATE INDEX idx_produce_listings_fair_price_id ON produce_listings (fair_price_id);
CREATE INDEX idx_produce_listings_approved_by   ON produce_listings (approved_by);
CREATE INDEX idx_produce_listings_rejected_by   ON produce_listings (rejected_by);
CREATE INDEX idx_produce_listings_queue
    ON produce_listings (status, created_at)
    WHERE status IN ('PENDING_APPROVAL', 'COUNTER_OFFERED');

COMMENT ON TABLE produce_listings IS
    'Farmer produce listings. BR-07: price_per_kg <= the ceiling in fair_price_id, '
    'validated server-side on create and update; the ceiling row is stored so '
    'BR-07c holds. BR-29: approved_by must never be the listing owner or their '
    'linked Farmer Admin account — violations auto-route via listing_routing. '
    'BR-16: farmer_id and farm_id must never reach a customer-facing serializer.';
COMMENT ON COLUMN produce_listings.certification_badges IS
    'Frozen at creation (BR-09). JSON array of badge objects derived from the '
    'certificates verified at that moment. Immutable — enforced by '
    'trg_produce_listings_freeze_badges.';
COMMENT ON COLUMN produce_listings.version IS
    'Optimistic lock. Every mutation must pass the version it read; a mismatch is '
    'a 409, not a silent last-writer-wins.';

-- BR-09: the badge set is history, not state.
CREATE OR REPLACE FUNCTION app_produce_listings_freeze_badges() RETURNS trigger
LANGUAGE plpgsql AS $fn$
BEGIN
    IF NEW.certification_badges IS DISTINCT FROM OLD.certification_badges THEN
        RAISE EXCEPTION
            'certification_badges is frozen at creation (BR-09); listing %', OLD.id
            USING ERRCODE = '23514', HINT = 'code: BADGES_IMMUTABLE';
    END IF;
    RETURN NEW;
END
$fn$;

CREATE TRIGGER trg_produce_listings_freeze_badges
    BEFORE UPDATE ON produce_listings
    FOR EACH ROW EXECUTE FUNCTION app_produce_listings_freeze_badges();

-- -----------------------------------------------------------------------------
-- counter_offers — BR-10, BR-11
-- -----------------------------------------------------------------------------
CREATE TABLE counter_offers (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id     uuid          NOT NULL REFERENCES produce_listings (id) ON DELETE CASCADE,
    round          smallint      NOT NULL CHECK (round BETWEEN 1 AND 4),
    actor          counter_actor NOT NULL,
    actor_user_id  uuid          NOT NULL REFERENCES users (id),
    price_per_kg   numeric(12,2) NOT NULL CHECK (price_per_kg > 0),
    quantity_kg    numeric(12,3) NOT NULL CHECK (quantity_kg > 0),
    message        text,
    status         counter_offer_status NOT NULL DEFAULT 'PENDING',
    expires_at     timestamptz   NOT NULL,
    responded_at   timestamptz,
    responded_by   uuid          REFERENCES users (id),
    created_at     timestamptz   NOT NULL DEFAULT now(),
    updated_at     timestamptz,
    CONSTRAINT counter_offers_round_unique UNIQUE (listing_id, round),
    CONSTRAINT counter_offers_expiry_after_creation_chk CHECK (expires_at > created_at),
    CONSTRAINT counter_offers_responded_pair_chk
        CHECK ((responded_at IS NULL) = (responded_by IS NULL))
);

CREATE INDEX idx_counter_offers_listing_id    ON counter_offers (listing_id);
CREATE INDEX idx_counter_offers_actor_user_id ON counter_offers (actor_user_id);
CREATE INDEX idx_counter_offers_responded_by  ON counter_offers (responded_by);
-- Drives the expiry job (BR-10b): the set of offers that have run out of clock.
CREATE INDEX idx_counter_offers_expiry
    ON counter_offers (expires_at) WHERE status = 'PENDING';

COMMENT ON TABLE counter_offers IS
$doc$Price negotiation on a listing.

BR-10 — the 24-hour window. expires_at is set to created_at + 24h (the window
length is read from system_config.counter_offer_window_hours, never a literal).
Once the clock runs out NEITHER party may act: the expiry job moves the row to
LAPSED and the listing returns to its prior state. An expiry LAPSES the offer —
it is not a rejection by the farmer, it is not an acceptance by silence, and it
must not be reported as either. Responding at expires_at + 1s is a 409
COUNTER_OFFER_EXPIRED (BR-10a). The job is idempotent (BR-10b).

BR-11 — the 3-round cap. Round 1 is the admin's opening counter; the farmer may
counter back at most 3 times, so rounds run 1..4 and the CHECK enforces the
ceiling. UNIQUE(listing_id, round) is what makes a concurrent double-submit
impossible rather than merely unlikely (BR-11b). On the 4th farmer attempt the
service returns 409 COUNTER_LIMIT_REACHED and the farmer must accept or reject.

BR-29 — an admin-actor row may never be written by the listing owner's own
Farmer Admin account; that path is denied and auto-routed instead.$doc$;

-- -----------------------------------------------------------------------------
-- listing_routing — BR-29b, the Farmer-Admin auto-route
-- -----------------------------------------------------------------------------
CREATE TABLE listing_routing (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id         uuid        NOT NULL REFERENCES produce_listings (id) ON DELETE CASCADE,
    routed_from_user_id uuid       REFERENCES users (id),
    routed_to_user_id  uuid        REFERENCES users (id),
    routed_to_role_id  uuid        REFERENCES roles (id),
    routed_reason      text        NOT NULL DEFAULT 'self_approval'
                                   CHECK (routed_reason IN ('self_approval', 'own_zone',
                                                            'unavailable', 'escalation')),
    attempted_action   text        CHECK (attempted_action IN ('approve', 'reject', 'counter_offer')),
    routed_at          timestamptz NOT NULL DEFAULT now(),
    resolved_at        timestamptz,
    created_at         timestamptz NOT NULL DEFAULT now(),
    updated_at         timestamptz
);

CREATE INDEX idx_listing_routing_listing_id          ON listing_routing (listing_id);
CREATE INDEX idx_listing_routing_routed_from_user_id ON listing_routing (routed_from_user_id);
CREATE INDEX idx_listing_routing_routed_to_user_id   ON listing_routing (routed_to_user_id);
CREATE INDEX idx_listing_routing_routed_to_role_id   ON listing_routing (routed_to_role_id);
CREATE INDEX idx_listing_routing_open
    ON listing_routing (routed_to_user_id, routed_at) WHERE resolved_at IS NULL;

COMMENT ON TABLE listing_routing IS
    'BR-29b: when a FARMER_ADMIN encounters their own listing the request is denied '
    '(403 SELF_APPROVAL_FORBIDDEN) AND a row is written here so the listing surfaces '
    'in another eligible admin queue with routed_reason = self_approval. Hiding the '
    'listing is not enough — it must be visibly reassigned, which is why this is a '
    'table and not a filtered query.';

SELECT app_attach_updated_at_triggers();

-- +migrate Down

DROP TABLE IF EXISTS listing_routing;
DROP TABLE IF EXISTS counter_offers;
DROP TRIGGER IF EXISTS trg_produce_listings_freeze_badges ON produce_listings;
DROP FUNCTION IF EXISTS app_produce_listings_freeze_badges();
DROP TABLE IF EXISTS produce_listings;
DROP TABLE IF EXISTS retail_prices;
DROP TABLE IF EXISTS fair_prices;
DROP TABLE IF EXISTS farm_crops;
DROP TABLE IF EXISTS crop_master;
DROP TABLE IF EXISTS grades;
DROP TABLE IF EXISTS categories;
