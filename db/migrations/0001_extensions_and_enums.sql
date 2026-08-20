-- =============================================================================
-- 0001_extensions_and_enums.sql
-- TOHFA platform — PostgreSQL 16
--
-- Extensions, every shared ENUM type in the schema, and the cross-cutting
-- trigger utilities (updated_at touch, append-only guard) that later
-- migrations depend on.
--
-- Conventions used by every migration in this directory:
--   id          uuid PRIMARY KEY DEFAULT gen_random_uuid()   (pgcrypto)
--   created_at  timestamptz NOT NULL DEFAULT now()
--   updated_at  timestamptz                                   (auto-touched)
--   deleted_at  timestamptz                                   (soft delete)
--   money       numeric(12,2)
--   quantity    numeric(12,3)   -- kilograms
-- Every foreign key is indexed. Every table carries a COMMENT naming the
-- business rules (BR-xx, see docs/rules.md) it exists to make enforceable.
-- =============================================================================

-- +migrate Up

-- -----------------------------------------------------------------------------
-- Extensions
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid(), digest()
CREATE EXTENSION IF NOT EXISTS postgis;    -- FMB farm boundaries, warehouse points

-- -----------------------------------------------------------------------------
-- Enumerated types
--
-- Naming: UPPER_SNAKE label values, singular type names. Values are stable
-- wire identifiers — renaming one is a breaking API change, adding one is not.
-- -----------------------------------------------------------------------------

-- Identity ---------------------------------------------------------------------
CREATE TYPE user_type AS ENUM (
    'FARMER',
    'CUSTOMER',
    'ADMIN',
    'DELIVERY_PARTNER'   -- modelled only; contradiction 3 / BR-21 blocks the feature
);

-- Farmer onboarding ------------------------------------------------------------
CREATE TYPE application_status AS ENUM (
    'SUBMITTED',
    'DOCS_REVIEW',
    'FARM_VERIFICATION',
    'AUDIT',
    'APPROVED',
    'REJECTED'
);

CREATE TYPE kyc_status AS ENUM (
    'PENDING',
    'VERIFIED',
    'REJECTED'
);

-- Certification (BR-01, BR-02) --------------------------------------------------
CREATE TYPE certification_type AS ENUM (
    'PGS',
    'NPOP'
);

CREATE TYPE verification_status AS ENUM (
    'UNVERIFIED',   -- default; only a human admin may move a row off this value
    'VERIFIED',
    'REJECTED'
);

-- Produce ----------------------------------------------------------------------
CREATE TYPE produce_grade AS ENUM (
    'GRADE_1',
    'GRADE_2',
    'GRADE_3',
    'REJECT'
);

CREATE TYPE listing_status AS ENUM (
    'DRAFT',
    'PENDING_APPROVAL',
    'COUNTER_OFFERED',
    'ACCEPTED',
    'REJECTED',
    'EXPIRED',
    'FULFILLED',
    'CANCELLED'
);

CREATE TYPE counter_offer_status AS ENUM (
    'PENDING',
    'ACCEPTED',
    'REJECTED',
    'COUNTERED',
    'LAPSED'        -- set by the 24h expiry job (BR-10); NOT a party's action
);

CREATE TYPE counter_actor AS ENUM (
    'ADMIN',
    'FARMER'
);

-- Purchasing & goods receipt ----------------------------------------------------
CREATE TYPE po_status AS ENUM (
    'ISSUED',
    'PARTIALLY_RECEIVED',
    'RECEIVED',
    'CANCELLED'
);

CREATE TYPE grn_status AS ENUM (
    'DRAFT',
    'RECEIVED',
    'QC_PENDING',
    'QC_DONE',
    'REJECTED'
);

CREATE TYPE qc_result AS ENUM (
    'ACCEPTED',
    'PARTIALLY_ACCEPTED',
    'REJECTED'
);

-- Inventory (BR-24, BR-37) -------------------------------------------------------
CREATE TYPE stock_movement_type AS ENUM (
    'RECEIPT',
    'SALE',
    'TRANSFER_OUT',
    'TRANSFER_IN',
    'ADJUSTMENT',
    'WASTAGE',
    'RETURN_IN',
    'RESERVATION',
    'RELEASE'
);

-- Allocation (BR-12). Deliberately has no B2B/HORECA bucket — BR-13 is unresolved.
CREATE TYPE allocation_channel AS ENUM (
    'ONLINE',
    'LIVE_MARKET',
    'RESERVE',
    'BUFFER'
);

-- Orders & fulfilment (BR-20, BR-21) ---------------------------------------------
CREATE TYPE order_status AS ENUM (
    'PENDING_PAYMENT',
    'CONFIRMED',
    'PACKED',
    'READY_FOR_PICKUP',
    'OUT_FOR_DELIVERY',   -- modelled, never reached in Track 1 (BR-21b)
    'DELIVERED',
    'PICKED_UP',
    'CANCELLED',
    'RETURNED'
);

CREATE TYPE fulfilment_type AS ENUM (
    'PICKUP',
    'DELIVERY'            -- modelled, not routed in Track 1 (contradiction 3)
);

CREATE TYPE delivery_slot AS ENUM (
    'MORNING_8_12',
    'AFTERNOON_12_4',
    'EVENING_4_8'
);

CREATE TYPE payment_method AS ENUM (
    'WALLET',
    'UPI',
    'CARD',
    'NETBANKING',
    'CASH'
);

-- Money (BR-17, BR-18, BR-19, BR-31) ---------------------------------------------
CREATE TYPE wallet_owner_type AS ENUM (
    'CUSTOMER',
    'FARMER'
);

CREATE TYPE wallet_txn_type AS ENUM (
    'TOPUP_CASH',
    'TOPUP_DIGITAL',
    'ORDER_DEBIT',
    'ORDER_REFUND',
    'PAYOUT_DEBIT',
    'SALE_CREDIT',
    'SUBSCRIPTION_DEBIT',
    'ADJUSTMENT'
);

CREATE TYPE wallet_txn_direction AS ENUM (
    'CREDIT',
    'DEBIT'
);

CREATE TYPE topup_channel AS ENUM (
    'CASH',
    'UPI',
    'CARD',
    'NETBANKING'
);

CREATE TYPE payout_status AS ENUM (
    'REQUESTED',
    'PENDING_APPROVAL',
    'APPROVED',
    'PROCESSING',
    'PAID',
    'FAILED',
    'REVERSED'
);

CREATE TYPE invoice_type AS ENUM (
    'SALE_RETAIL',
    'SALE_B2B',
    'PURCHASE_FARMER',
    'PAYOUT',
    'SUBSCRIPTION'
);

-- Platform ------------------------------------------------------------------------
CREATE TYPE notification_channel AS ENUM (
    'PUSH',
    'SMS',
    'EMAIL',
    'IN_APP'
);

CREATE TYPE audit_actor_type AS ENUM (
    'USER',
    'SYSTEM',
    'JOB',
    'ANONYMOUS'
);

-- -----------------------------------------------------------------------------
-- Shared trigger utilities
-- -----------------------------------------------------------------------------

-- Keeps updated_at honest without every service remembering to set it.
CREATE OR REPLACE FUNCTION app_touch_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $fn$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END
$fn$;

-- Attaches the touch trigger to every public table that has an updated_at column
-- and does not already have one. Each migration calls this once at its end.
CREATE OR REPLACE FUNCTION app_attach_updated_at_triggers() RETURNS void
LANGUAGE plpgsql AS $fn$
DECLARE
    r record;
BEGIN
    FOR r IN
        SELECT c.relname AS tbl
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        JOIN pg_attribute a ON a.attrelid = c.oid
        WHERE n.nspname = 'public'
          AND c.relkind = 'r'
          AND a.attname = 'updated_at'
          AND a.attnum > 0
          AND NOT a.attisdropped
          AND NOT EXISTS (
              SELECT 1 FROM pg_trigger t
              WHERE t.tgrelid = c.oid
                AND t.tgname = 'trg_' || c.relname || '_touch_updated_at'
          )
    LOOP
        EXECUTE format(
            'CREATE TRIGGER trg_%1$s_touch_updated_at BEFORE UPDATE ON public.%1$I '
            'FOR EACH ROW EXECUTE FUNCTION app_touch_updated_at()', r.tbl);
    END LOOP;
END
$fn$;

-- The append-only guard (BR-35, BR-37).
-- Raises unconditionally. Statement-level so that even a zero-row UPDATE fails
-- loudly rather than succeeding silently and teaching anyone the wrong lesson.
CREATE OR REPLACE FUNCTION app_deny_mutation() RETURNS trigger
LANGUAGE plpgsql AS $fn$
BEGIN
    RAISE EXCEPTION
        'append-only table %.% — % is not permitted; write a compensating row instead',
        TG_TABLE_SCHEMA, TG_TABLE_NAME, TG_OP
        USING ERRCODE = '23514',
              HINT = 'See db/README.md, "The append-only invariant".';
END
$fn$;

-- Makes a table append-only: DB triggers plus a privilege revoke for the
-- application role. The triggers are the guarantee; the REVOKE is defence in
-- depth so that a superuser-owned trigger is not the only thing standing
-- between a bad migration and the audit trail (BR-35a).
--
-- REVOKE statement template (executed below when the role exists):
--     REVOKE UPDATE, DELETE, TRUNCATE ON public.<table> FROM tohfa_app;
CREATE OR REPLACE FUNCTION app_make_append_only(p_table text) RETURNS void
LANGUAGE plpgsql AS $fn$
BEGIN
    EXECUTE format(
        'CREATE TRIGGER trg_%1$s_append_only BEFORE UPDATE OR DELETE ON public.%1$I '
        'FOR EACH STATEMENT EXECUTE FUNCTION app_deny_mutation()', p_table);
    EXECUTE format(
        'CREATE TRIGGER trg_%1$s_no_truncate BEFORE TRUNCATE ON public.%1$I '
        'FOR EACH STATEMENT EXECUTE FUNCTION app_deny_mutation()', p_table);

    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'tohfa_app') THEN
        EXECUTE format('REVOKE UPDATE, DELETE, TRUNCATE ON public.%I FROM tohfa_app', p_table);
    END IF;
END
$fn$;

COMMENT ON FUNCTION app_make_append_only(text) IS
    'Applies the append-only invariant (BR-35, BR-37) to a table: statement-level '
    'UPDATE/DELETE/TRUNCATE guards plus a REVOKE for the tohfa_app role.';

-- +migrate Down

DROP FUNCTION IF EXISTS app_make_append_only(text);
DROP FUNCTION IF EXISTS app_deny_mutation();
DROP FUNCTION IF EXISTS app_attach_updated_at_triggers();
DROP FUNCTION IF EXISTS app_touch_updated_at();

DROP TYPE IF EXISTS audit_actor_type;
DROP TYPE IF EXISTS notification_channel;
DROP TYPE IF EXISTS invoice_type;
DROP TYPE IF EXISTS payout_status;
DROP TYPE IF EXISTS topup_channel;
DROP TYPE IF EXISTS wallet_txn_direction;
DROP TYPE IF EXISTS wallet_txn_type;
DROP TYPE IF EXISTS wallet_owner_type;
DROP TYPE IF EXISTS payment_method;
DROP TYPE IF EXISTS delivery_slot;
DROP TYPE IF EXISTS fulfilment_type;
DROP TYPE IF EXISTS order_status;
DROP TYPE IF EXISTS allocation_channel;
DROP TYPE IF EXISTS stock_movement_type;
DROP TYPE IF EXISTS qc_result;
DROP TYPE IF EXISTS grn_status;
DROP TYPE IF EXISTS po_status;
DROP TYPE IF EXISTS counter_actor;
DROP TYPE IF EXISTS counter_offer_status;
DROP TYPE IF EXISTS listing_status;
DROP TYPE IF EXISTS produce_grade;
DROP TYPE IF EXISTS verification_status;
DROP TYPE IF EXISTS certification_type;
DROP TYPE IF EXISTS kyc_status;
DROP TYPE IF EXISTS application_status;
DROP TYPE IF EXISTS user_type;

-- Extensions are intentionally NOT dropped: other schemas in the same database
-- may depend on them, and dropping postgis is not a reversible operation in
-- practice. Drop them by hand if this really is a throwaway database.
