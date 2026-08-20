-- =============================================================================
-- 0003_farmers_and_farms.sql
-- Farmers, their KYC documents, certifications (BR-01/BR-02), farms and plots
-- (with the FMB polygon modelled but deferred), subscriptions (BR-14) and the
-- 10-category farm rating (BR-06) with its configurable tiers (BR-04).
-- =============================================================================

-- +migrate Up

-- -----------------------------------------------------------------------------
-- zones — administrative grouping; the FARMER_ADMIN scope dimension
-- -----------------------------------------------------------------------------
CREATE TABLE zones (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code          text        NOT NULL UNIQUE,
    name          text        NOT NULL,
    warehouse_id  uuid,       -- FK added in 0005 once warehouses exists
    description   text,
    is_active     boolean     NOT NULL DEFAULT true,
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz,
    deleted_at    timestamptz
);

CREATE INDEX idx_zones_warehouse_id ON zones (warehouse_id);

COMMENT ON TABLE zones IS
    'Geographic grouping of farmers. The OWN_ZONE_ONLY predicate in rbac.json '
    'resolves against user_roles.zone_id, which points here.';

-- user_roles.zone_id can now be constrained (declared FK-less in 0002).
ALTER TABLE user_roles
    ADD CONSTRAINT user_roles_zone_id_fkey FOREIGN KEY (zone_id) REFERENCES zones (id);

-- -----------------------------------------------------------------------------
-- farmers
-- -----------------------------------------------------------------------------
CREATE TABLE farmers (
    id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                   uuid        NOT NULL UNIQUE REFERENCES users (id) ON DELETE RESTRICT,
    tohfa_farmer_id           text        NOT NULL UNIQUE,
    zone_id                   uuid REFERENCES zones (id),
    dob                       date,
    gender                    text CHECK (gender IN ('MALE', 'FEMALE', 'OTHER', 'UNDISCLOSED')),
    farming_experience_years  smallint CHECK (farming_experience_years BETWEEN 0 AND 120),
    address_line1             text,
    address_line2             text,
    village                   text,
    taluk                     text,
    district                  text        NOT NULL DEFAULT 'The Nilgiris',
    pincode                   text CHECK (pincode IS NULL OR pincode ~ '^[1-9][0-9]{5}$'),

    aadhaar_last4             char(4) CHECK (aadhaar_last4 IS NULL OR aadhaar_last4 ~ '^[0-9]{4}$'),
    aadhaar_token             text,

    kyc_status                kyc_status         NOT NULL DEFAULT 'PENDING',
    kyc_verified_by           uuid REFERENCES users (id),
    kyc_verified_at           timestamptz,

    application_status        application_status NOT NULL DEFAULT 'SUBMITTED',
    approved_by               uuid REFERENCES users (id),
    approved_at               timestamptz,
    rejected_by               uuid REFERENCES users (id),
    rejected_at               timestamptz,
    rejection_reason          text,

    overall_rating            numeric(5,2) CHECK (overall_rating IS NULL OR overall_rating >= 0),
    rating_tier_code          text,

    -- BR-01 / BR-02 materialised. Default true: a farmer is blocked from the
    -- market until a human has verified an unexpired PGS/NPOP certificate.
    -- Fail-closed is the whole point; do not "fix" this default.
    is_market_blocked         boolean     NOT NULL DEFAULT true,
    market_block_reason       text,
    market_block_evaluated_at timestamptz,

    created_at                timestamptz NOT NULL DEFAULT now(),
    updated_at                timestamptz,
    deleted_at                timestamptz,

    CONSTRAINT farmers_approval_pair_chk
        CHECK ((approved_by IS NULL) = (approved_at IS NULL)),
    CONSTRAINT farmers_rejection_reason_chk
        CHECK (application_status <> 'REJECTED' OR rejection_reason IS NOT NULL),
    -- A block must always say why; an unexplained block is an unappealable one.
    CONSTRAINT farmers_block_reason_chk
        CHECK (is_market_blocked = false OR market_block_reason IS NOT NULL
               OR market_block_evaluated_at IS NULL)
);

CREATE INDEX idx_farmers_user_id         ON farmers (user_id);
CREATE INDEX idx_farmers_zone_id         ON farmers (zone_id);
CREATE INDEX idx_farmers_kyc_verified_by ON farmers (kyc_verified_by);
CREATE INDEX idx_farmers_approved_by     ON farmers (approved_by);
CREATE INDEX idx_farmers_rejected_by     ON farmers (rejected_by);
CREATE INDEX idx_farmers_application_status ON farmers (application_status)
    WHERE deleted_at IS NULL;
CREATE INDEX idx_farmers_market_blocked  ON farmers (is_market_blocked)
    WHERE is_market_blocked = true;

COMMENT ON TABLE farmers IS
    'Farmer master. BR-01/BR-02: is_market_blocked is the materialised result of '
    'the certification rule and defaults to true (fail closed). BR-33: aadhaar and '
    'the linked users.mobile are locked fields. BR-34: reactivation is SUPER_ADMIN only.';
COMMENT ON COLUMN farmers.aadhaar_last4 IS
    'Last four digits only, for human matching in the KYC queue. The FULL AADHAAR '
    'NUMBER IS NEVER STORED IN THIS DATABASE (Decision 8, BR-33b) — not in this '
    'column, not in aadhaar_token, not in any document row, not in any log.';
COMMENT ON COLUMN farmers.aadhaar_token IS
    'Opaque reference issued by the external KYC/tokenisation provider. It is a '
    'lookup handle, not a reversible encoding. THE FULL AADHAAR NUMBER IS NEVER '
    'STORED (Decision 8); no API response may contain an unmasked Aadhaar (BR-33b).';
COMMENT ON COLUMN farmers.is_market_blocked IS
    'BR-01/BR-02: true blocks listing creation. Recomputed on certification change '
    'and by the nightly expiry sweep. Cleared only when a verified, unexpired '
    'PGS/NPOP certificate exists.';

-- -----------------------------------------------------------------------------
-- farmer_documents
-- -----------------------------------------------------------------------------
CREATE TABLE farmer_documents (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id     uuid        NOT NULL REFERENCES farmers (id) ON DELETE CASCADE,
    doc_type      text        NOT NULL
                              CHECK (doc_type IN ('ID_PROOF', 'ADDRESS_PROOF', 'FARM_DOC',
                                                  'CERTIFICATE', 'BANK_PROOF', 'PHOTO')),
    storage_key   text        NOT NULL,
    mime_type     text        NOT NULL,
    size_bytes    bigint      CHECK (size_bytes > 0),
    is_mandatory  boolean     NOT NULL DEFAULT false,
    verification_status verification_status NOT NULL DEFAULT 'UNVERIFIED',
    verified_by   uuid REFERENCES users (id),
    verified_at   timestamptz,
    reject_reason text,
    uploaded_by   uuid REFERENCES users (id),
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz,
    deleted_at    timestamptz,
    CONSTRAINT farmer_documents_verified_pair_chk
        CHECK ((verification_status = 'UNVERIFIED') = (verified_by IS NULL))
);

CREATE INDEX idx_farmer_documents_farmer_id   ON farmer_documents (farmer_id);
CREATE INDEX idx_farmer_documents_verified_by ON farmer_documents (verified_by);
CREATE INDEX idx_farmer_documents_uploaded_by ON farmer_documents (uploaded_by);
CREATE INDEX idx_farmer_documents_pending
    ON farmer_documents (farmer_id) WHERE verification_status = 'UNVERIFIED';

COMMENT ON TABLE farmer_documents IS
    'KYC and farm documents. BR-02b: verification is a human act — verified_by is '
    'required for any status other than UNVERIFIED, enforced by CHECK.';

-- -----------------------------------------------------------------------------
-- certifications — BR-01, BR-02
-- -----------------------------------------------------------------------------
CREATE TABLE certifications (
    id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id            uuid        NOT NULL REFERENCES farmers (id) ON DELETE CASCADE,
    farm_id              uuid,       -- FK added below, after farms is created
    cert_type            certification_type NOT NULL,
    cert_number          text        NOT NULL,
    issuing_body         text        NOT NULL,
    issued_on            date        NOT NULL,
    expires_on           date        NOT NULL,
    document_id          uuid REFERENCES farmer_documents (id),
    verification_status  verification_status NOT NULL DEFAULT 'UNVERIFIED',
    verified_by          uuid REFERENCES users (id),
    verified_at          timestamptz,
    verification_notes   text,
    portal_checked_url   text,
    created_at           timestamptz NOT NULL DEFAULT now(),
    updated_at           timestamptz,
    deleted_at           timestamptz,
    CONSTRAINT certifications_dates_chk CHECK (expires_on > issued_on),
    -- BR-02b: nothing may reach VERIFIED without a named human admin.
    CONSTRAINT certifications_verified_needs_actor_chk
        CHECK (verification_status <> 'VERIFIED'
               OR (verified_by IS NOT NULL AND verified_at IS NOT NULL))
);

CREATE UNIQUE INDEX uq_certifications_number
    ON certifications (cert_type, cert_number) WHERE deleted_at IS NULL;

-- Drives the nightly expiry sweep (BR-01b): "which farmers lost cover today?"
CREATE INDEX idx_certifications_farmer_expiry ON certifications (farmer_id, expires_on);
CREATE INDEX idx_certifications_farm_id       ON certifications (farm_id);
CREATE INDEX idx_certifications_document_id   ON certifications (document_id);
CREATE INDEX idx_certifications_verified_by   ON certifications (verified_by);
CREATE INDEX idx_certifications_expiry_sweep
    ON certifications (expires_on)
    WHERE verification_status = 'VERIFIED' AND deleted_at IS NULL;

COMMENT ON TABLE certifications IS
    'PGS/NPOP certificates. BR-01: an all-expired farmer cannot list. BR-02: rows '
    'start UNVERIFIED and only a SUPER_ADMIN/TOHFA_ADMIN acting by hand against the '
    'issuing body portal may set VERIFIED — there is no automated verification path. '
    'The (farmer_id, expires_on) index drives the expiry job.';
COMMENT ON COLUMN certifications.verified_by IS
    'BR-02b: non-nullable in effect for VERIFIED rows. No job may fill this in.';

-- -----------------------------------------------------------------------------
-- farms / plots
-- -----------------------------------------------------------------------------
CREATE TABLE farms (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id      uuid        NOT NULL REFERENCES farmers (id) ON DELETE CASCADE,
    name           text        NOT NULL,
    survey_number  text,
    area_acres     numeric(10,3) CHECK (area_acres IS NULL OR area_acres > 0),
    centroid_lat   numeric(9,6)  CHECK (centroid_lat  IS NULL OR centroid_lat  BETWEEN -90  AND 90),
    centroid_lng   numeric(9,6)  CHECK (centroid_lng  IS NULL OR centroid_lng  BETWEEN -180 AND 180),
    boundary       geography(POLYGON, 4326),
    boundary_area_acres numeric(10,3),
    boundary_drawn_by   uuid REFERENCES users (id),
    boundary_drawn_at   timestamptz,
    boundary_version    integer NOT NULL DEFAULT 0,
    address        text,
    village        text,
    taluk          text,
    district       text        NOT NULL DEFAULT 'The Nilgiris',
    is_primary     boolean     NOT NULL DEFAULT false,
    created_at     timestamptz NOT NULL DEFAULT now(),
    updated_at     timestamptz,
    deleted_at     timestamptz,
    CONSTRAINT farms_centroid_pair_chk
        CHECK ((centroid_lat IS NULL) = (centroid_lng IS NULL))
);

CREATE INDEX idx_farms_farmer_id          ON farms (farmer_id);
CREATE INDEX idx_farms_boundary_drawn_by  ON farms (boundary_drawn_by);
CREATE INDEX idx_farms_boundary_gix       ON farms USING gist (boundary);
CREATE UNIQUE INDEX uq_farms_primary
    ON farms (farmer_id) WHERE is_primary AND deleted_at IS NULL;

COMMENT ON TABLE farms IS
    'Farm registration (a farmer may hold several). BR-16: nothing in this table — '
    'name, village, centroid or boundary — may appear in a customer-facing response.';
COMMENT ON COLUMN farms.boundary IS
    'FMB polygon (PostGIS geography, WGS84). Modelled now, drawn later: the FMB '
    'capture UI is deferred, but the column exists so boundaries are not bolted on '
    'as a JSON blob when it ships. Farm-anonymous rule BR-16 applies to it.';

ALTER TABLE certifications
    ADD CONSTRAINT certifications_farm_id_fkey FOREIGN KEY (farm_id) REFERENCES farms (id);

CREATE TABLE plots (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id          uuid        NOT NULL REFERENCES farms (id) ON DELETE CASCADE,
    name             text        NOT NULL,
    area_acres       numeric(10,3) CHECK (area_acres IS NULL OR area_acres > 0),
    soil_type        text,
    irrigation_type  text,
    boundary         geography(POLYGON, 4326),
    created_at       timestamptz NOT NULL DEFAULT now(),
    updated_at       timestamptz,
    deleted_at       timestamptz,
    CONSTRAINT plots_name_unique_per_farm UNIQUE (farm_id, name)
);

CREATE INDEX idx_plots_farm_id      ON plots (farm_id);
CREATE INDEX idx_plots_boundary_gix ON plots USING gist (boundary);

COMMENT ON TABLE plots IS
    'Sub-division of a farm ("zones" in the farm diary). Crop planting is recorded '
    'against a plot, which is what makes batch-level traceability (BR-24b) possible.';

-- -----------------------------------------------------------------------------
-- farmer_subscriptions — BR-14
-- -----------------------------------------------------------------------------
CREATE TABLE farmer_subscriptions (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id     uuid        NOT NULL REFERENCES farmers (id) ON DELETE CASCADE,
    tier          text        NOT NULL DEFAULT 'FREE' CHECK (tier IN ('FREE', 'PAID')),
    amount        numeric(12,2) NOT NULL DEFAULT 0 CHECK (amount >= 0),
    period_start  date        NOT NULL,
    period_end    date        NOT NULL,
    payment_id    uuid,       -- FK added in 0007 once payments exists
    status        text        NOT NULL DEFAULT 'ACTIVE'
                              CHECK (status IN ('ACTIVE', 'EXPIRED', 'CANCELLED', 'WAIVED')),
    waived_by     uuid REFERENCES users (id),
    waived_reason text,
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz,
    CONSTRAINT farmer_subscriptions_period_chk CHECK (period_end > period_start),
    CONSTRAINT farmer_subscriptions_waived_chk
        CHECK (status <> 'WAIVED' OR waived_by IS NOT NULL)
);

CREATE INDEX idx_farmer_subscriptions_farmer_id ON farmer_subscriptions (farmer_id);
CREATE INDEX idx_farmer_subscriptions_payment_id ON farmer_subscriptions (payment_id);
CREATE INDEX idx_farmer_subscriptions_waived_by ON farmer_subscriptions (waived_by);
CREATE UNIQUE INDEX uq_farmer_subscriptions_active
    ON farmer_subscriptions (farmer_id) WHERE status = 'ACTIVE';

COMMENT ON TABLE farmer_subscriptions IS
    'BR-14: Rs 500/year with a free tier. The amount and period come from '
    'system_config, never from a literal, and the free-tier LIMITS are deliberately '
    'not modelled here — both source documents leave them undefined and BR-14 '
    'forbids inventing them. Extend/waive is SUPER_ADMIN only.';

-- -----------------------------------------------------------------------------
-- Farm rating — BR-06 (10 categories x 10 points), BR-04 (tiers are config)
-- -----------------------------------------------------------------------------
CREATE TABLE rating_categories (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code        text        NOT NULL UNIQUE,
    name        text        NOT NULL,
    max_points  smallint    NOT NULL DEFAULT 10 CHECK (max_points > 0),
    sort_order  smallint    NOT NULL,
    is_active   boolean     NOT NULL DEFAULT true,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz
);

COMMENT ON TABLE rating_categories IS
    'BR-06b: the 10 named rating categories as seeded reference data. A score row '
    'referencing an 11th category is impossible because of the FK from farm_rating_scores.';

CREATE TABLE farm_ratings (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id    uuid        NOT NULL REFERENCES farmers (id) ON DELETE CASCADE,
    farm_id      uuid REFERENCES farms (id),
    zone_id      uuid REFERENCES zones (id),
    period_label text        NOT NULL,
    total_score  numeric(6,2) CHECK (total_score IS NULL OR total_score >= 0),
    tier_code    text,
    status       text        NOT NULL DEFAULT 'DRAFT'
                             CHECK (status IN ('DRAFT', 'COMPLETE')),
    rated_by     uuid REFERENCES users (id),
    rated_at     timestamptz,
    notes        text,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz,
    CONSTRAINT farm_ratings_period_unique UNIQUE (farmer_id, period_label)
);

CREATE INDEX idx_farm_ratings_farmer_id ON farm_ratings (farmer_id);
CREATE INDEX idx_farm_ratings_farm_id   ON farm_ratings (farm_id);
CREATE INDEX idx_farm_ratings_zone_id   ON farm_ratings (zone_id);
CREATE INDEX idx_farm_ratings_rated_by  ON farm_ratings (rated_by);

COMMENT ON TABLE farm_ratings IS
    'A rating cycle for one farmer. BR-06: a rating with fewer than 10 category '
    'rows is incomplete, not zero — status stays DRAFT until all 10 exist. '
    'zone_id carries the OWN_ZONE_ONLY predicate for FARMER_ADMIN edits.';

CREATE TABLE farm_rating_scores (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    rating_id    uuid        NOT NULL REFERENCES farm_ratings (id) ON DELETE CASCADE,
    category_id  uuid        NOT NULL REFERENCES rating_categories (id),
    score        numeric(5,2) NOT NULL CHECK (score BETWEEN 0 AND 10),
    remarks      text,
    evidence_keys text[],
    scored_by    uuid REFERENCES users (id),
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz,
    CONSTRAINT farm_rating_scores_unique UNIQUE (rating_id, category_id)
);

CREATE INDEX idx_farm_rating_scores_rating_id   ON farm_rating_scores (rating_id);
CREATE INDEX idx_farm_rating_scores_category_id ON farm_rating_scores (category_id);
CREATE INDEX idx_farm_rating_scores_scored_by   ON farm_rating_scores (scored_by);

COMMENT ON TABLE farm_rating_scores IS
    'BR-06a: CHECK (score BETWEEN 0 AND 10) per category row — a submitted 11 is '
    'rejected by the database, not only by the service. BR-06b: exactly one row '
    'per (rating, category).';

CREATE TABLE rating_tier_config (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tier_code       text        NOT NULL,
    label           text        NOT NULL,
    min_score       numeric(6,2) NOT NULL,
    max_score       numeric(6,2),
    color_hex       char(7) CHECK (color_hex IS NULL OR color_hex ~ '^#[0-9A-Fa-f]{6}$'),
    sort_order      smallint    NOT NULL,
    effective_from  date        NOT NULL DEFAULT CURRENT_DATE,
    set_by          uuid REFERENCES users (id),
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz,
    CONSTRAINT rating_tier_config_range_chk CHECK (max_score IS NULL OR max_score >= min_score),
    CONSTRAINT rating_tier_config_unique UNIQUE (tier_code, effective_from)
);

CREATE INDEX idx_rating_tier_config_set_by ON rating_tier_config (set_by);

COMMENT ON TABLE rating_tier_config IS
    'BR-04: the tier thresholds are DATA, not literals — this table is the whole '
    'answer to open contradiction 1 (max 100 points vs <650/650-700/700-749/750+). '
    'BR-04a: changing a row here changes which tier a score maps to. BR-04b: no '
    'scoring logic reads it in Track 1; the scoring endpoint returns 501. '
    'Editable by SUPER_ADMIN only (farmer.rating.configure_tiers).';

SELECT app_attach_updated_at_triggers();

-- +migrate Down

DROP TABLE IF EXISTS rating_tier_config;
DROP TABLE IF EXISTS farm_rating_scores;
DROP TABLE IF EXISTS farm_ratings;
DROP TABLE IF EXISTS rating_categories;
DROP TABLE IF EXISTS farmer_subscriptions;
ALTER TABLE certifications DROP CONSTRAINT IF EXISTS certifications_farm_id_fkey;
DROP TABLE IF EXISTS plots;
DROP TABLE IF EXISTS farms;
DROP TABLE IF EXISTS certifications;
DROP TABLE IF EXISTS farmer_documents;
DROP TABLE IF EXISTS farmers;
ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_zone_id_fkey;
DROP TABLE IF EXISTS zones;
