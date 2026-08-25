-- =============================================================================
-- 0009_farmer_applications.sql
-- Resumable 5-step farmer registration draft applications, per-step payload
-- storage, and the append-only application status timeline log.
-- Supports BR-33 (Aadhaar & mobile locked fields) and BR-36 (own-data scoping).
-- =============================================================================

-- +migrate Up

-- -----------------------------------------------------------------------------
-- farmer_applications
-- -----------------------------------------------------------------------------
CREATE TABLE farmer_applications (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    mobile             text                 NOT NULL,
    full_name          text                 NOT NULL,
    preferred_locale   text                 NOT NULL DEFAULT 'en' CHECK (preferred_locale IN ('en', 'ta')),
    status             application_status   NOT NULL DEFAULT 'SUBMITTED',
    is_draft           boolean              NOT NULL DEFAULT true,
    current_step       smallint             NOT NULL DEFAULT 1 CHECK (current_step BETWEEN 1 AND 5),
    completed_steps    smallint[]           NOT NULL DEFAULT '{}',
    step1_personal     jsonb                NOT NULL DEFAULT '{}'::jsonb,
    step2_farm_details jsonb                NOT NULL DEFAULT '{}'::jsonb,
    step3_location     jsonb                NOT NULL DEFAULT '{}'::jsonb,
    step4_documents    jsonb                NOT NULL DEFAULT '{}'::jsonb,
    user_id            uuid                 REFERENCES users (id) ON DELETE SET NULL,
    farmer_id          uuid                 REFERENCES farmers (id) ON DELETE SET NULL,
    submitted_at       timestamptz,
    created_at         timestamptz          NOT NULL DEFAULT now(),
    updated_at         timestamptz,
    deleted_at         timestamptz,
    CONSTRAINT farmer_applications_mobile_chk CHECK (mobile ~ '^\+[1-9][0-9]{7,14}$')
);

-- At most one non-terminal application per mobile number.
-- Approved or Rejected applications do not block re-application.
CREATE UNIQUE INDEX uq_farmer_applications_live_mobile
    ON farmer_applications (mobile)
    WHERE status NOT IN ('APPROVED', 'REJECTED') AND deleted_at IS NULL;

CREATE INDEX idx_farmer_applications_user_id   ON farmer_applications (user_id);
CREATE INDEX idx_farmer_applications_farmer_id ON farmer_applications (farmer_id);
CREATE INDEX idx_farmer_applications_status    ON farmer_applications (status) WHERE deleted_at IS NULL;

COMMENT ON TABLE farmer_applications IS
    'Resumable 5-step draft farmer applications. Supports BR-33 (mobile/Aadhaar locked), '
    'BR-36 (own-data scoping), and single active application per mobile.';

-- -----------------------------------------------------------------------------
-- farmer_application_status_history
-- -----------------------------------------------------------------------------
CREATE TABLE farmer_application_status_history (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id  uuid                 NOT NULL REFERENCES farmer_applications (id) ON DELETE CASCADE,
    from_status     application_status,
    to_status       application_status   NOT NULL,
    actor_id        uuid                 REFERENCES users (id),
    note            text,
    created_at      timestamptz          NOT NULL DEFAULT now()
);

CREATE INDEX idx_fash_application_id ON farmer_application_status_history (application_id, created_at ASC);
CREATE INDEX idx_fash_actor_id       ON farmer_application_status_history (actor_id);

COMMENT ON TABLE farmer_application_status_history IS
    'Append-only log of status transitions for a farmer application timeline.';

-- +migrate Down

DROP TABLE IF EXISTS farmer_application_status_history;
DROP TABLE IF EXISTS farmer_applications;
