-- =============================================================================
-- 0008_platform.sql
-- Notifications, announcements, support, configuration, uploads, the job
-- registry (BR-38b) and the APPEND-ONLY system audit trail (BR-35).
-- =============================================================================

-- +migrate Up

-- -----------------------------------------------------------------------------
-- notification_templates / notifications
-- -----------------------------------------------------------------------------
CREATE TABLE notification_templates (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code           text                 NOT NULL,
    channel        notification_channel NOT NULL,
    locale         text                 NOT NULL DEFAULT 'en' CHECK (locale IN ('en', 'ta')),
    subject        text,
    body_template  text                 NOT NULL,
    is_active      boolean              NOT NULL DEFAULT true,
    updated_by     uuid REFERENCES users (id),
    created_at     timestamptz          NOT NULL DEFAULT now(),
    updated_at     timestamptz,
    CONSTRAINT notification_templates_unique UNIQUE (code, channel, locale)
);

CREATE INDEX idx_notification_templates_updated_by ON notification_templates (updated_by);

COMMENT ON TABLE notification_templates IS
    'Message templates per code/channel/locale (en, ta). SUPER_ADMIN managed. '
    'BR-38a: templates are transactional — the advisory content FR-F06/FR-F07 '
    'describes is blocked on contradiction 2 and none is seeded.';

CREATE TABLE notifications (
    id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id              uuid                 NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    template_id          uuid                 REFERENCES notification_templates (id),
    channel              notification_channel NOT NULL,
    title                text,
    body                 text                 NOT NULL,
    locale               text                 NOT NULL DEFAULT 'en' CHECK (locale IN ('en', 'ta')),
    data                 jsonb                NOT NULL DEFAULT '{}'::jsonb,
    status               text                 NOT NULL DEFAULT 'QUEUED'
                                              CHECK (status IN ('QUEUED', 'SENT', 'DELIVERED',
                                                                'FAILED', 'READ')),
    provider_message_id  text,
    error                text,
    sent_at              timestamptz,
    read_at              timestamptz,
    created_at           timestamptz          NOT NULL DEFAULT now(),
    updated_at           timestamptz
);

CREATE INDEX idx_notifications_user_id     ON notifications (user_id, created_at DESC);
CREATE INDEX idx_notifications_template_id ON notifications (template_id);
CREATE INDEX idx_notifications_unread      ON notifications (user_id, created_at DESC)
    WHERE read_at IS NULL;
CREATE INDEX idx_notifications_pending     ON notifications (created_at) WHERE status = 'QUEUED';

COMMENT ON TABLE notifications IS
    'Outbound message log. BR-18c: the SMS row for a cash top-up records dispatch '
    'outcome independently, so a failed send never rolls back the wallet credit.';

-- -----------------------------------------------------------------------------
-- announcements
-- -----------------------------------------------------------------------------
CREATE TABLE announcements (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    scope         text        NOT NULL DEFAULT 'SYSTEM_WIDE'
                              CHECK (scope IN ('SYSTEM_WIDE', 'WAREHOUSE', 'ZONE', 'ROLE')),
    warehouse_id  uuid        REFERENCES warehouses (id),
    zone_id       uuid        REFERENCES zones (id),
    role_id       uuid        REFERENCES roles (id),
    title         text        NOT NULL,
    body          text        NOT NULL,
    locale        text        NOT NULL DEFAULT 'en' CHECK (locale IN ('en', 'ta')),
    starts_at     timestamptz NOT NULL DEFAULT now(),
    ends_at       timestamptz,
    created_by    uuid        NOT NULL REFERENCES users (id),
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz,
    deleted_at    timestamptz,
    CONSTRAINT announcements_window_chk CHECK (ends_at IS NULL OR ends_at > starts_at),
    CONSTRAINT announcements_scope_target_chk
        CHECK ((scope = 'WAREHOUSE' AND warehouse_id IS NOT NULL)
            OR (scope = 'ZONE'      AND zone_id      IS NOT NULL)
            OR (scope = 'ROLE'      AND role_id      IS NOT NULL)
            OR (scope = 'SYSTEM_WIDE'))
);

CREATE INDEX idx_announcements_warehouse_id ON announcements (warehouse_id);
CREATE INDEX idx_announcements_zone_id      ON announcements (zone_id);
CREATE INDEX idx_announcements_role_id      ON announcements (role_id);
CREATE INDEX idx_announcements_created_by   ON announcements (created_by);
CREATE INDEX idx_announcements_live         ON announcements (starts_at, ends_at)
    WHERE deleted_at IS NULL;

COMMENT ON TABLE announcements IS
    'Broadcast messages, optionally scoped to a warehouse, zone or role. The '
    'scope CHECK stops a "warehouse" announcement with no warehouse quietly '
    'going to everyone.';

-- -----------------------------------------------------------------------------
-- support_tickets / support_messages
-- -----------------------------------------------------------------------------
CREATE TABLE support_tickets (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number  text        NOT NULL UNIQUE,
    customer_id    uuid        REFERENCES customers (id) ON DELETE CASCADE,
    farmer_id      uuid        REFERENCES farmers (id)   ON DELETE CASCADE,
    order_id       uuid        REFERENCES orders (id),
    category       text        NOT NULL DEFAULT 'OTHER'
                               CHECK (category IN ('QUALITY', 'QUANTITY', 'MISSING', 'WRONG_ITEM',
                                                   'DAMAGED', 'LATE', 'PAYMENT', 'OTHER')),
    subject        text        NOT NULL,
    description    text,
    photo_keys     text[],
    status         text        NOT NULL DEFAULT 'OPEN'
                               CHECK (status IN ('OPEN', 'INVESTIGATING', 'RESOLVED', 'CLOSED')),
    priority       text        NOT NULL DEFAULT 'NORMAL'
                               CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
    assigned_to    uuid        REFERENCES users (id),
    resolution     text,
    resolved_at    timestamptz,
    created_at     timestamptz NOT NULL DEFAULT now(),
    updated_at     timestamptz,
    -- A ticket belongs to exactly one reporter; BR-36 scoping depends on it.
    CONSTRAINT support_tickets_one_reporter_chk
        CHECK (num_nonnulls(customer_id, farmer_id) = 1)
);

CREATE INDEX idx_support_tickets_customer_id ON support_tickets (customer_id);
CREATE INDEX idx_support_tickets_farmer_id   ON support_tickets (farmer_id);
CREATE INDEX idx_support_tickets_order_id    ON support_tickets (order_id);
CREATE INDEX idx_support_tickets_assigned_to ON support_tickets (assigned_to);
CREATE INDEX idx_support_tickets_open        ON support_tickets (status, created_at)
    WHERE status IN ('OPEN', 'INVESTIGATING');

COMMENT ON TABLE support_tickets IS
    'TKT-YYYY-XXXXX tickets raised by a customer or a farmer. BR-36: a reporter '
    'sees only their own tickets. BR-16: a customer support thread must not leak '
    'farm identity, so any admin note naming a farmer stays out of the customer view.';

CREATE TABLE support_messages (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id       uuid        NOT NULL REFERENCES support_tickets (id) ON DELETE CASCADE,
    sender_user_id  uuid        NOT NULL REFERENCES users (id),
    body            text        NOT NULL,
    attachment_key  text,
    is_internal     boolean     NOT NULL DEFAULT false,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz
);

CREATE INDEX idx_support_messages_ticket_id      ON support_messages (ticket_id, created_at);
CREATE INDEX idx_support_messages_sender_user_id ON support_messages (sender_user_id);

COMMENT ON TABLE support_messages IS
    'Thread messages. is_internal marks admin-only notes that BR-16 keeps out of '
    'the customer-facing thread.';

-- -----------------------------------------------------------------------------
-- audit_log — APPEND ONLY (BR-35)
-- -----------------------------------------------------------------------------
CREATE TABLE audit_log (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id        uuid             REFERENCES users (id),
    actor_type      audit_actor_type NOT NULL DEFAULT 'USER',
    actor_role      text,
    action_code     text             NOT NULL,
    entity_type     text             NOT NULL,
    entity_id       uuid,
    warehouse_id    uuid             REFERENCES warehouses (id),
    outcome         text             NOT NULL DEFAULT 'ALLOWED'
                                     CHECK (outcome IN ('ALLOWED', 'DENIED', 'ERROR')),
    before          jsonb,
    after           jsonb,
    changed_fields  text[],
    ip              inet,
    user_agent      text,
    correlation_id  uuid,
    created_at      timestamptz      NOT NULL DEFAULT now()
    -- No updated_at, no deleted_at. This table has no revisions.
);

CREATE INDEX idx_audit_log_actor_id     ON audit_log (actor_id, created_at DESC);
CREATE INDEX idx_audit_log_entity       ON audit_log (entity_type, entity_id, created_at DESC);
CREATE INDEX idx_audit_log_warehouse_id ON audit_log (warehouse_id, created_at DESC);
CREATE INDEX idx_audit_log_correlation  ON audit_log (correlation_id);
CREATE INDEX idx_audit_log_action_code  ON audit_log (action_code, created_at DESC);
CREATE INDEX idx_audit_log_denied       ON audit_log (created_at DESC) WHERE outcome = 'DENIED';

COMMENT ON TABLE audit_log IS
$doc$APPEND-ONLY. The system audit trail (distinct from farm audits).

BR-35  — every mutating action writes a row: actor, actor role, action code,
         target, before/after and timestamp. No role, SUPER_ADMIN included, may
         edit or delete a row. SUPER_ADMIN may read and export.
BR-35a — UPDATE/DELETE/TRUNCATE are blocked by trigger and revoked from the
         tohfa_app role, so a direct statement fails on permissions.
BR-35b — a DENIED request still writes a row (outcome = 'DENIED'). BR-28b
         depends on this: the Main Warehouse Admin who tried to mint a Super
         Admin is recorded, not merely refused.

warehouse_id exists so the Main Warehouse Admin `own` scope of Ch.6.4 can be
served without disclosing other warehouses (contradiction 4).

Every other rule in docs/rules.md becomes unprovable if this table is editable.$doc$;

SELECT app_make_append_only('audit_log');

-- -----------------------------------------------------------------------------
-- system_config
-- -----------------------------------------------------------------------------
CREATE TABLE system_config (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    key          text        NOT NULL UNIQUE,
    value        jsonb       NOT NULL,
    data_type    text        NOT NULL DEFAULT 'string'
                             CHECK (data_type IN ('string', 'number', 'boolean', 'json')),
    description  text,
    is_secret    boolean     NOT NULL DEFAULT false,
    updated_by   uuid        REFERENCES users (id),
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz
);

CREATE INDEX idx_system_config_updated_by ON system_config (updated_by);

COMMENT ON TABLE system_config IS
    'Every threshold that a rule says must not be a literal lives here: the cash '
    'top-up cap (BR-19), counter-offer window and round limit (BR-10, BR-11), '
    'allocation percentages (BR-12), subscription fee and period (BR-14a), cart '
    'lock hours (BR-22), payout dual-approval threshold (BR-31) and the rating '
    'tier scale switch (BR-04a). BR-14b: the free-tier listing limit ships as a '
    'named key so the check exists, but its value is the clients to set.';

-- -----------------------------------------------------------------------------
-- uploads
-- -----------------------------------------------------------------------------
CREATE TABLE uploads (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    storage_key   text        NOT NULL UNIQUE,
    bucket        text        NOT NULL,
    mime_type     text        NOT NULL,
    size_bytes    bigint      NOT NULL CHECK (size_bytes > 0),
    checksum      text,
    entity_type   text,
    entity_id     uuid,
    is_public     boolean     NOT NULL DEFAULT false,
    uploaded_by   uuid        REFERENCES users (id),
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz,
    deleted_at    timestamptz
);

CREATE INDEX idx_uploads_uploaded_by ON uploads (uploaded_by);
CREATE INDEX idx_uploads_entity      ON uploads (entity_type, entity_id);

COMMENT ON TABLE uploads IS
    'Object-storage metadata behind a single adapter (contradiction 13: the vendor '
    'is unresolved, so no SDK type appears in domain code). BR-16: is_public must '
    'stay false for any asset that could carry farm identity.';

-- -----------------------------------------------------------------------------
-- job_runs — BR-38b
-- -----------------------------------------------------------------------------
CREATE TABLE job_runs (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    job_name         text        NOT NULL,
    status           text        NOT NULL DEFAULT 'RUNNING'
                                 CHECK (status IN ('RUNNING', 'SUCCEEDED', 'FAILED')),
    started_at       timestamptz NOT NULL DEFAULT now(),
    finished_at      timestamptz,
    items_scanned    integer     NOT NULL DEFAULT 0 CHECK (items_scanned >= 0),
    items_processed  integer     NOT NULL DEFAULT 0 CHECK (items_processed >= 0),
    error            text,
    correlation_id   uuid,
    created_at       timestamptz NOT NULL DEFAULT now(),
    updated_at       timestamptz,
    CONSTRAINT job_runs_finished_pair_chk
        CHECK (status = 'RUNNING' OR finished_at IS NOT NULL)
);

CREATE INDEX idx_job_runs_name    ON job_runs (job_name, started_at DESC);
CREATE INDEX idx_job_runs_running ON job_runs (started_at) WHERE status = 'RUNNING';

COMMENT ON TABLE job_runs IS
    'The job registry and run log. BR-38b: Track 1 has exactly three scheduled '
    'jobs — the BR-01 certificate expiry sweep, the BR-10 counter-offer expiry and '
    'the BR-22 cart reservation release. These are rule ENFORCEMENT, not the '
    'advisory automation blocked by contradiction 2. BR-38a: no job writes '
    'farmer-facing advisory content. Each job must be idempotent; this table is '
    'how a re-run proves it (BR-10b, BR-22b).';

SELECT app_attach_updated_at_triggers();

-- +migrate Down

DROP TABLE IF EXISTS job_runs;
DROP TABLE IF EXISTS uploads;
DROP TABLE IF EXISTS system_config;
DROP TABLE IF EXISTS audit_log;
DROP TABLE IF EXISTS support_messages;
DROP TABLE IF EXISTS support_tickets;
DROP TABLE IF EXISTS announcements;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS notification_templates;
