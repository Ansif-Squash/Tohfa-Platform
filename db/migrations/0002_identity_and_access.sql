-- =============================================================================
-- 0002_identity_and_access.sql
-- Users, the RBAC tables that mirror docs/rbac.json, and the session/OTP
-- primitives behind BR-32.
--
-- The authorization model is deliberately data, not code: roles, permissions
-- and role_permissions are seeded from docs/rbac.json by db/seed/002_permissions.js
-- so that the permission list exists in exactly one place.
-- =============================================================================

-- +migrate Up

-- -----------------------------------------------------------------------------
-- users
-- -----------------------------------------------------------------------------
CREATE TABLE users (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    mobile            text        NOT NULL,
    email             text,
    password_hash     text,
    full_name         text        NOT NULL,
    preferred_locale  text        NOT NULL DEFAULT 'en'
                                  CHECK (preferred_locale IN ('en', 'ta')),
    user_type         user_type   NOT NULL,
    status            text        NOT NULL DEFAULT 'PENDING'
                                  CHECK (status IN ('PENDING', 'ACTIVE', 'DISABLED')),
    mfa_enabled       boolean     NOT NULL DEFAULT false,
    last_login_at     timestamptz,
    disabled_at       timestamptz,
    disabled_by       uuid REFERENCES users (id),
    disabled_reason   text,
    reactivated_at    timestamptz,
    reactivated_by    uuid REFERENCES users (id),
    created_at        timestamptz NOT NULL DEFAULT now(),
    updated_at        timestamptz,
    deleted_at        timestamptz,
    CONSTRAINT users_mobile_e164_chk CHECK (mobile ~ '^\+[1-9][0-9]{7,14}$')
);

-- Mobile is the login identifier and is unique among live rows only, so a
-- soft-deleted account does not permanently burn a phone number.
CREATE UNIQUE INDEX uq_users_mobile_live ON users (mobile) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX uq_users_email_live  ON users (lower(email)) WHERE email IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_users_active            ON users (id) WHERE status = 'ACTIVE' AND deleted_at IS NULL;
CREATE INDEX idx_users_user_type         ON users (user_type);
CREATE INDEX idx_users_disabled_by       ON users (disabled_by);
CREATE INDEX idx_users_reactivated_by    ON users (reactivated_by);

COMMENT ON TABLE users IS
    'One row per human of any type. Supports BR-32 (OTP-hardened auth), BR-33 '
    '(mobile is a locked field — SUPER_ADMIN only), BR-34 (disable/reactivate '
    'asymmetry is recorded via disabled_by / reactivated_by).';
COMMENT ON COLUMN users.mobile IS
    'E.164. LOCKED FIELD (BR-33): mutable only by SUPER_ADMIN, and the change is audit-logged.';
COMMENT ON COLUMN users.reactivated_by IS
    'BR-34: only a SUPER_ADMIN may reactivate; the asymmetry with disabled_by is deliberate.';

-- -----------------------------------------------------------------------------
-- roles / permissions / role_permissions
-- -----------------------------------------------------------------------------
CREATE TABLE roles (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code             text        NOT NULL UNIQUE,
    name             text        NOT NULL,
    hierarchy_level  smallint    NOT NULL CHECK (hierarchy_level BETWEEN 1 AND 9),
    scope_dimension  text        CHECK (scope_dimension IN ('warehouse_id', 'zone_id',
                                                            'farmer_id', 'customer_id')),
    brand_color_hex  char(7)     CHECK (brand_color_hex ~ '^#[0-9A-Fa-f]{6}$'),
    summary          text,
    is_assignable    boolean     NOT NULL DEFAULT true,
    created_at       timestamptz NOT NULL DEFAULT now(),
    updated_at       timestamptz
);

COMMENT ON TABLE roles IS
    'The 7 roles of docs/rbac.json. hierarchy_level drives BR-28 (admin creation '
    'is strictly hierarchical) and the LOWER_ROLES_ONLY predicate.';
COMMENT ON COLUMN roles.scope_dimension IS
    'The column every query for this role must be filtered by: BR-30 (SUB_WH_ADMIN '
    '-> warehouse_id), BR-36 (FARMER -> farmer_id, CUSTOMER -> customer_id).';

CREATE TABLE permissions (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code         text        NOT NULL UNIQUE,
    module       text        NOT NULL,
    description  text        NOT NULL,
    predicate    text,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz
);

CREATE INDEX idx_permissions_module ON permissions (module);

COMMENT ON TABLE permissions IS
    'Permission codes, generated from docs/rbac.json by db/seed/002_permissions.js. '
    'Never hand-edit: CI runs that script with --check and fails on drift.';
COMMENT ON COLUMN permissions.predicate IS
    'Named predicate from rbac.json (NOT_OWN_LISTING -> BR-29, OWN_ZONE_ONLY, '
    'SUPPORT_ONLY, LOWER_ROLES_ONLY -> BR-28). NULL means no extra predicate.';

CREATE TABLE role_permissions (
    role_id        uuid NOT NULL REFERENCES roles (id) ON DELETE CASCADE,
    permission_id  uuid NOT NULL REFERENCES permissions (id) ON DELETE CASCADE,
    scope          text        NOT NULL
                               CHECK (scope IN ('all', 'own', 'view', 'conditional', 'none')),
    predicate      text,
    created_at     timestamptz NOT NULL DEFAULT now(),
    updated_at     timestamptz,
    PRIMARY KEY (role_id, permission_id),
    -- A `conditional` grant without a predicate is a grant of `all` wearing a
    -- disguise, which is how BR-29 gets quietly lost.
    CONSTRAINT role_permissions_conditional_needs_predicate_chk
        CHECK (scope <> 'conditional' OR predicate IS NOT NULL)
);

CREATE INDEX idx_role_permissions_permission_id ON role_permissions (permission_id);
CREATE INDEX idx_role_permissions_role_id       ON role_permissions (role_id);

COMMENT ON TABLE role_permissions IS
    'The Ch.6 grant matrix as data. scope encodes all/own/view/conditional/none; '
    'predicate carries the rbac.json predicate name for conditional grants. '
    'Supports BR-08, BR-26, BR-28, BR-29, BR-31, BR-34, BR-37.';

-- -----------------------------------------------------------------------------
-- user_roles — BR-25, BR-30
-- -----------------------------------------------------------------------------
CREATE TABLE user_roles (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       uuid        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    role_id       uuid        NOT NULL REFERENCES roles (id),
    -- Denormalised from roles.code so that the warehouse rule below can be a
    -- real CHECK constraint. Maintained by trg_user_roles_scope_guard.
    role_code     text        NOT NULL,
    warehouse_id  uuid,       -- FK added in 0005 once warehouses exists
    zone_id       uuid,       -- FK added in 0003 once zones exists
    assigned_by   uuid REFERENCES users (id),
    valid_from    timestamptz NOT NULL DEFAULT now(),
    valid_to      timestamptz,
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz,
    CONSTRAINT user_roles_validity_chk
        CHECK (valid_to IS NULL OR valid_to > valid_from),
    -- BR-25: a Sub Warehouse Admin assignment MUST name exactly one warehouse.
    CONSTRAINT user_roles_sub_wh_needs_warehouse_chk
        CHECK (role_code <> 'SUB_WH_ADMIN' OR warehouse_id IS NOT NULL),
    -- Only warehouse-scoped roles may carry a warehouse.
    CONSTRAINT user_roles_warehouse_only_for_wh_roles_chk
        CHECK (warehouse_id IS NULL OR role_code IN ('SUB_WH_ADMIN', 'MAIN_WH_ADMIN')),
    -- Only the elected Farmer Admin is zone-scoped (OWN_ZONE_ONLY).
    CONSTRAINT user_roles_zone_only_for_farmer_admin_chk
        CHECK (zone_id IS NULL OR role_code = 'FARMER_ADMIN')
);

-- One live assignment per (user, role, warehouse). NULL warehouse is folded to
-- the nil uuid so that two null-warehouse assignments still collide.
CREATE UNIQUE INDEX uq_user_roles_active
    ON user_roles (user_id, role_id,
                   COALESCE(warehouse_id, '00000000-0000-0000-0000-000000000000'::uuid))
    WHERE valid_to IS NULL;

CREATE INDEX idx_user_roles_user_id      ON user_roles (user_id);
CREATE INDEX idx_user_roles_role_id      ON user_roles (role_id);
CREATE INDEX idx_user_roles_warehouse_id ON user_roles (warehouse_id);
CREATE INDEX idx_user_roles_zone_id      ON user_roles (zone_id);
CREATE INDEX idx_user_roles_assigned_by  ON user_roles (assigned_by);

COMMENT ON TABLE user_roles IS
    'Role assignments. BR-25: SUB_WH_ADMIN requires warehouse_id (CHECK + trigger). '
    'BR-30: warehouse_id is the scope predicate injected into every SUB_WH_ADMIN query. '
    'BR-28: assigned_by records who created the assignment.';
COMMENT ON COLUMN user_roles.role_code IS
    'Denormalised roles.code. Populated and re-validated by trg_user_roles_scope_guard; '
    'it exists solely so BR-25 can be a declarative CHECK rather than trigger-only logic.';

-- The trigger half of BR-25: fills role_code from roles and refuses a
-- SUB_WH_ADMIN row with no warehouse even if role_code were tampered with.
CREATE OR REPLACE FUNCTION app_user_roles_scope_guard() RETURNS trigger
LANGUAGE plpgsql AS $fn$
DECLARE
    v_code text;
BEGIN
    SELECT code INTO v_code FROM roles WHERE id = NEW.role_id;
    IF v_code IS NULL THEN
        RAISE EXCEPTION 'unknown role_id %', NEW.role_id USING ERRCODE = '23503';
    END IF;
    NEW.role_code := v_code;

    IF v_code = 'SUB_WH_ADMIN' AND NEW.warehouse_id IS NULL THEN
        RAISE EXCEPTION 'BR-25: SUB_WH_ADMIN assignment requires warehouse_id'
            USING ERRCODE = '23514', HINT = 'code: WAREHOUSE_REQUIRED';
    END IF;

    RETURN NEW;
END
$fn$;

CREATE TRIGGER trg_user_roles_scope_guard
    BEFORE INSERT OR UPDATE ON user_roles
    FOR EACH ROW EXECUTE FUNCTION app_user_roles_scope_guard();

-- -----------------------------------------------------------------------------
-- admin_profiles
-- -----------------------------------------------------------------------------
CREATE TABLE admin_profiles (
    user_id     uuid PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
    admin_code  text        NOT NULL UNIQUE,
    is_standby  boolean     NOT NULL DEFAULT false,
    designation text,
    created_by  uuid REFERENCES users (id),
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz,
    deleted_at  timestamptz
);

CREATE INDEX idx_admin_profiles_created_by ON admin_profiles (created_by);

COMMENT ON TABLE admin_profiles IS
    'Admin-only attributes. created_by is the accountable creator required by '
    'BR-28 (admin creation is strictly hierarchical). is_standby covers the '
    '5th standby warehouse admin (Assumption 1).';

-- -----------------------------------------------------------------------------
-- otp_verifications — BR-32, BR-20
-- -----------------------------------------------------------------------------
CREATE TABLE otp_verifications (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       uuid REFERENCES users (id) ON DELETE CASCADE,
    mobile        text        NOT NULL,
    purpose       text        NOT NULL
                              CHECK (purpose IN ('REGISTRATION', 'LOGIN', 'PASSWORD_RESET',
                                                 'MOBILE_CHANGE', 'DELIVERY', 'PICKUP')),
    code_hash     text        NOT NULL,
    attempts      smallint    NOT NULL DEFAULT 0 CHECK (attempts >= 0),
    max_attempts  smallint    NOT NULL DEFAULT 3 CHECK (max_attempts > 0),
    locked_at     timestamptz,
    expires_at    timestamptz NOT NULL,
    consumed_at   timestamptz,
    resend_count  smallint    NOT NULL DEFAULT 0 CHECK (resend_count >= 0),
    last_sent_at  timestamptz NOT NULL DEFAULT now(),
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz
);

CREATE INDEX idx_otp_verifications_user_id ON otp_verifications (user_id);
CREATE INDEX idx_otp_verifications_lookup
    ON otp_verifications (mobile, purpose, created_at DESC);
CREATE INDEX idx_otp_verifications_live
    ON otp_verifications (expires_at)
    WHERE consumed_at IS NULL AND locked_at IS NULL;

COMMENT ON TABLE otp_verifications IS
    'BR-32: 6-digit codes, 60s resend floor (last_sent_at), 3-attempt lockout '
    '(attempts vs max_attempts, then locked_at). The code itself is only ever '
    'stored as code_hash — see BR-20b, the plaintext is never returned or logged.';
COMMENT ON COLUMN otp_verifications.code_hash IS
    'Hash of the OTP. NEVER store or return the plaintext code (BR-20b, BR-32).';
COMMENT ON COLUMN otp_verifications.last_sent_at IS
    'BR-32b: a resend inside 60 seconds of this timestamp is rejected with OTP_RESEND_TOO_SOON.';

-- -----------------------------------------------------------------------------
-- sessions / refresh_tokens
-- -----------------------------------------------------------------------------
CREATE TABLE sessions (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        uuid        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    device_id      text,
    platform       text        CHECK (platform IN ('ios', 'android', 'web')),
    fcm_token      text,
    user_agent     text,
    last_seen_ip   inet,
    issued_at      timestamptz NOT NULL DEFAULT now(),
    expires_at     timestamptz NOT NULL,
    last_seen_at   timestamptz,
    revoked_at     timestamptz,
    revoked_by     uuid REFERENCES users (id),
    revoke_reason  text,
    created_at     timestamptz NOT NULL DEFAULT now(),
    updated_at     timestamptz
);

CREATE INDEX idx_sessions_user_id    ON sessions (user_id);
CREATE INDEX idx_sessions_revoked_by ON sessions (revoked_by);
CREATE INDEX idx_sessions_live       ON sessions (user_id, expires_at) WHERE revoked_at IS NULL;

COMMENT ON TABLE sessions IS
    'Active login sessions. revoked_by supports auth.session.terminate_other, '
    'which rbac.json grants to SUPER_ADMIN alone.';

CREATE TABLE refresh_tokens (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id   uuid        NOT NULL REFERENCES sessions (id) ON DELETE CASCADE,
    user_id      uuid        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token_hash   text        NOT NULL UNIQUE,
    issued_at    timestamptz NOT NULL DEFAULT now(),
    expires_at   timestamptz NOT NULL,
    used_at      timestamptz,
    revoked_at   timestamptz,
    replaced_by  uuid REFERENCES refresh_tokens (id),
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz
);

CREATE INDEX idx_refresh_tokens_session_id  ON refresh_tokens (session_id);
CREATE INDEX idx_refresh_tokens_user_id     ON refresh_tokens (user_id);
CREATE INDEX idx_refresh_tokens_replaced_by ON refresh_tokens (replaced_by);

COMMENT ON TABLE refresh_tokens IS
    'Rotating refresh tokens, stored hashed. replaced_by makes reuse of a rotated '
    'token detectable, which is what turns a stolen token into a revocable event.';

SELECT app_attach_updated_at_triggers();

-- +migrate Down

DROP TABLE IF EXISTS refresh_tokens;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS otp_verifications;
DROP TABLE IF EXISTS admin_profiles;
DROP TRIGGER IF EXISTS trg_user_roles_scope_guard ON user_roles;
DROP FUNCTION IF EXISTS app_user_roles_scope_guard();
DROP TABLE IF EXISTS user_roles;
DROP TABLE IF EXISTS role_permissions;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS users;
