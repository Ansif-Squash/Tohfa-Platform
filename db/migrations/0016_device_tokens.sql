-- =============================================================================
-- 0016_device_tokens.sql
-- S-50: Device token registry for push notifications.
-- =============================================================================

-- +migrate Up
CREATE TABLE device_tokens (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token       text NOT NULL UNIQUE,
    platform    text NOT NULL CHECK (platform IN ('android', 'ios', 'web')),
    app         text NOT NULL CHECK (app IN ('farmer-mobile', 'customer-mobile', 'admin-web')),
    locale      text NOT NULL DEFAULT 'en' CHECK (locale IN ('en', 'ta')),
    last_seen   timestamptz NOT NULL DEFAULT now(),
    revoked     boolean NOT NULL DEFAULT false,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz
);

CREATE INDEX idx_device_tokens_user_id ON device_tokens (user_id) WHERE NOT revoked;
CREATE INDEX idx_device_tokens_token ON device_tokens (token);

COMMENT ON TABLE device_tokens IS
    'FCM device token registry for push notifications across mobile and web apps (S-50).';

SELECT app_attach_updated_at_triggers();

-- +migrate Down
DROP TABLE IF EXISTS device_tokens;
