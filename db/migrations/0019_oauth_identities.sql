-- =============================================================================
-- 0019_oauth_identities.sql
--
-- BR-39: OAuth (Google/Facebook) is an alternate login method for an
-- already mobile-verified account, or a data-prefill convenience during
-- first-time registration — never a way to create or activate an account
-- without proving a real phone number via mobile+OTP. See docs/rules.md
-- BR-39 and apps/api/src/modules/auth/auth.service.ts.
-- =============================================================================

-- +migrate Up

CREATE TABLE oauth_identities (
    id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id              uuid        NOT NULL REFERENCES users (id),
    provider             text        NOT NULL CHECK (provider IN ('GOOGLE', 'FACEBOOK')),
    -- The provider's stable subject identifier: Google's `sub` claim, or
    -- Facebook's numeric user id from the Graph API `/me` response.
    provider_subject_id  text        NOT NULL,
    email                text,
    linked_at            timestamptz NOT NULL DEFAULT now(),
    created_at           timestamptz NOT NULL DEFAULT now(),
    -- One provider identity can only ever link to one TOHFA account (BR-39).
    CONSTRAINT uq_oauth_identities_provider_subject UNIQUE (provider, provider_subject_id),
    -- Implementation decision beyond the BR-39 brief: an account may hold at
    -- most one identity per provider, so `DELETE /auth/me/oauth/{provider}`
    -- has an unambiguous single row to remove. Flagged in the PR description
    -- as a call worth a product sign-off if a farmer/customer ever needs two
    -- Google accounts linked to one TOHFA account.
    CONSTRAINT uq_oauth_identities_user_provider UNIQUE (user_id, provider)
);

CREATE INDEX idx_oauth_identities_user_id ON oauth_identities (user_id);

COMMENT ON TABLE oauth_identities IS
    'BR-39: one Google/Facebook identity maps to exactly one user account. '
    'Login/link-only — never bypasses mobile+OTP verification. A row is '
    'created either via POST /auth/me/oauth/link (already-authenticated '
    'self-service) or atomically alongside account creation/lookup inside '
    'POST /auth/otp/verify when a signed, short-lived linkToken is presented.';

-- +migrate Down

DROP TABLE IF EXISTS oauth_identities;
