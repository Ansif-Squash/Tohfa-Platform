-- =============================================================================
-- 0007_money.sql
-- Wallets and the APPEND-ONLY wallet ledger (BR-17), cash top-ups with the
-- fiscal cash tag and the Rs 10,000 cap (BR-18/BR-19), farmer payouts with
-- dual approval that a single actor cannot fake (BR-31), invoicing and expenses.
-- =============================================================================

-- +migrate Up

-- -----------------------------------------------------------------------------
-- wallets
-- -----------------------------------------------------------------------------
CREATE TABLE wallets (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_type   wallet_owner_type NOT NULL,
    customer_id  uuid REFERENCES customers (id) ON DELETE RESTRICT,
    farmer_id    uuid REFERENCES farmers (id)   ON DELETE RESTRICT,
    -- Derived cache of wallet_transactions. Written only by trg_wallet_txn_apply.
    balance      numeric(12,2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
    currency     char(3)       NOT NULL DEFAULT 'INR',
    status       text          NOT NULL DEFAULT 'ACTIVE'
                               CHECK (status IN ('ACTIVE', 'FROZEN', 'CLOSED')),
    version      integer       NOT NULL DEFAULT 1 CHECK (version > 0),
    created_at   timestamptz   NOT NULL DEFAULT now(),
    updated_at   timestamptz,
    -- Exactly one owner. A polymorphic owner_id with no FK is how orphaned money
    -- happens; two nullable FKs and a CHECK keep the referential guarantee.
    CONSTRAINT wallets_exactly_one_owner_chk
        CHECK (num_nonnulls(customer_id, farmer_id) = 1),
    CONSTRAINT wallets_owner_type_matches_chk
        CHECK ((owner_type = 'CUSTOMER' AND customer_id IS NOT NULL)
            OR (owner_type = 'FARMER'   AND farmer_id   IS NOT NULL))
);

CREATE UNIQUE INDEX uq_wallets_customer ON wallets (customer_id) WHERE customer_id IS NOT NULL;
CREATE UNIQUE INDEX uq_wallets_farmer   ON wallets (farmer_id)   WHERE farmer_id   IS NOT NULL;
CREATE INDEX idx_wallets_owner_type ON wallets (owner_type);

COMMENT ON TABLE wallets IS
    'One wallet per customer or farmer. BR-17: the wallet is the primary payment '
    'method and checkout debits it first. balance is a CACHE of wallet_transactions '
    'maintained by trigger — the ledger is the truth, and CHECK (balance >= 0) '
    'means an overdrawn wallet is a failed transaction, not a negative number.';
COMMENT ON COLUMN wallets.balance IS
    'Derived from the append-only wallet_transactions. Written exclusively by '
    'trg_wallet_txn_apply; any direct UPDATE of this column is a bug.';

-- -----------------------------------------------------------------------------
-- wallet_transactions — APPEND ONLY
-- -----------------------------------------------------------------------------
CREATE TABLE wallet_transactions (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id        uuid                 NOT NULL REFERENCES wallets (id),
    idempotency_key  text                 NOT NULL UNIQUE,
    direction        wallet_txn_direction NOT NULL,
    type             wallet_txn_type      NOT NULL,
    amount           numeric(12,2)        NOT NULL CHECK (amount > 0),
    balance_after    numeric(12,2)        NOT NULL CHECK (balance_after >= 0),
    ref_type         text,
    ref_id           uuid,
    remarks          text,
    created_by       uuid                 REFERENCES users (id),
    created_at       timestamptz          NOT NULL DEFAULT now()
    -- No updated_at, no deleted_at. Money that moved, moved.
);

CREATE INDEX idx_wallet_transactions_wallet_id  ON wallet_transactions (wallet_id, created_at DESC);
CREATE INDEX idx_wallet_transactions_created_by ON wallet_transactions (created_by);
CREATE INDEX idx_wallet_transactions_ref        ON wallet_transactions (ref_type, ref_id);

COMMENT ON TABLE wallet_transactions IS
$doc$APPEND-ONLY. The real balance; wallets.balance is only a cache of it.

amount is always positive and direction carries the sign, so a debit written as
a negative credit is not expressible.

BR-17b — a successful checkout writes exactly ONE debit row. idempotency_key is
         UNIQUE and NOT NULL, so a retried request collides instead of
         double-charging. Callers must derive the key from the request, not from
         a random value, or the guarantee is decorative.
BR-18   — a cash top-up credit records the acting admin (created_by) and, via
         topups, the warehouse. Neither is optional.
BR-18c  — an SMS failure after this row exists does not roll it back.
BR-35   — UPDATE, DELETE and TRUNCATE are blocked by trigger and revoked from
         the tohfa_app role. A reversal is a new opposing row.$doc$;
COMMENT ON COLUMN wallet_transactions.idempotency_key IS
    'BR-17b: UNIQUE NOT NULL. The retry guard for every money movement.';

-- Computes balance_after under a row lock on the wallet.
CREATE OR REPLACE FUNCTION app_wallet_txn_balance() RETURNS trigger
LANGUAGE plpgsql AS $fn$
DECLARE
    v_balance numeric(12,2);
    v_status  text;
    v_signed  numeric(12,2);
BEGIN
    SELECT balance, status INTO v_balance, v_status
      FROM wallets WHERE id = NEW.wallet_id FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'unknown wallet_id %', NEW.wallet_id USING ERRCODE = '23503';
    END IF;

    IF v_status <> 'ACTIVE' THEN
        RAISE EXCEPTION 'wallet % is %, no movement permitted', NEW.wallet_id, v_status
            USING ERRCODE = '23514', HINT = 'code: WALLET_NOT_ACTIVE';
    END IF;

    v_signed := CASE WHEN NEW.direction = 'CREDIT' THEN NEW.amount ELSE -NEW.amount END;
    NEW.balance_after := v_balance + v_signed;

    IF NEW.balance_after < 0 THEN
        RAISE EXCEPTION
            'BR-17: insufficient wallet balance — have %, need %', v_balance, NEW.amount
            USING ERRCODE = '23514', HINT = 'code: WALLET_INSUFFICIENT';
    END IF;

    RETURN NEW;
END
$fn$;

CREATE TRIGGER trg_wallet_txn_balance
    BEFORE INSERT ON wallet_transactions
    FOR EACH ROW EXECUTE FUNCTION app_wallet_txn_balance();

CREATE OR REPLACE FUNCTION app_wallet_txn_apply() RETURNS trigger
LANGUAGE plpgsql AS $fn$
BEGIN
    UPDATE wallets
       SET balance    = NEW.balance_after,
           version    = version + 1,
           updated_at = now()
     WHERE id = NEW.wallet_id;
    RETURN NULL;
END
$fn$;

CREATE TRIGGER trg_wallet_txn_apply
    AFTER INSERT ON wallet_transactions
    FOR EACH ROW EXECUTE FUNCTION app_wallet_txn_apply();

SELECT app_make_append_only('wallet_transactions');

-- -----------------------------------------------------------------------------
-- payments — gateway records (Razorpay)
-- -----------------------------------------------------------------------------
CREATE TABLE payments (
    id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    gateway              text          NOT NULL DEFAULT 'razorpay',
    gateway_order_id     text,
    gateway_payment_id   text UNIQUE,
    gateway_signature    text,
    amount               numeric(12,2) NOT NULL CHECK (amount > 0),
    currency             char(3)       NOT NULL DEFAULT 'INR',
    method               payment_method,
    status               text          NOT NULL DEFAULT 'CREATED'
                                       CHECK (status IN ('CREATED', 'AUTHORIZED', 'CAPTURED',
                                                         'FAILED', 'REFUNDED')),
    ref_type             text,
    ref_id               uuid,
    raw_payload          jsonb,
    captured_at          timestamptz,
    created_at           timestamptz   NOT NULL DEFAULT now(),
    updated_at           timestamptz
);

CREATE INDEX idx_payments_ref    ON payments (ref_type, ref_id);
CREATE INDEX idx_payments_status ON payments (status, created_at DESC);

COMMENT ON TABLE payments IS
    'Gateway payment records. gateway_payment_id is UNIQUE so a replayed webhook '
    'cannot create a second payment for the same charge.';

ALTER TABLE farmer_subscriptions
    ADD CONSTRAINT farmer_subscriptions_payment_id_fkey
    FOREIGN KEY (payment_id) REFERENCES payments (id);

-- -----------------------------------------------------------------------------
-- topups — BR-18, BR-19
-- -----------------------------------------------------------------------------
CREATE TABLE topups (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id         uuid          NOT NULL REFERENCES wallets (id),
    customer_id       uuid          REFERENCES customers (id),
    channel           topup_channel NOT NULL,
    amount            numeric(12,2) NOT NULL CHECK (amount > 0),
    fiscal_cash_tag   text,
    warehouse_id      uuid          REFERENCES warehouses (id),
    processed_by      uuid          REFERENCES users (id),
    payment_id        uuid          REFERENCES payments (id),
    wallet_txn_id     uuid          REFERENCES wallet_transactions (id),
    status            text          NOT NULL DEFAULT 'PENDING'
                                    CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED')),
    sms_sent_at       timestamptz,
    sms_error         text,
    created_at        timestamptz   NOT NULL DEFAULT now(),
    updated_at        timestamptz,

    -- BR-19: a single cash top-up must not exceed Rs 10,000. Rs 10,000 exactly is
    -- accepted; the boundary is "> 10000". No per-day or per-customer cap exists
    -- because neither source document defines one and BR-19 forbids inventing it.
    CONSTRAINT topups_cash_cap_chk
        CHECK (channel <> 'CASH' OR amount <= 10000.00),

    -- BR-18a: no fiscal cash tag, no credit.
    CONSTRAINT topups_cash_needs_fiscal_tag_chk
        CHECK (channel <> 'CASH' OR fiscal_cash_tag IS NOT NULL),

    -- BR-18b: the credit records the acting admin and the warehouse; both are
    -- non-nullable for cash.
    CONSTRAINT topups_cash_needs_warehouse_chk
        CHECK (channel <> 'CASH' OR warehouse_id IS NOT NULL),
    CONSTRAINT topups_cash_needs_processor_chk
        CHECK (channel <> 'CASH' OR processed_by IS NOT NULL),

    -- A fiscal cash tag on a digital top-up is a category error.
    CONSTRAINT topups_fiscal_tag_is_cash_only_chk
        CHECK (fiscal_cash_tag IS NULL OR channel = 'CASH')
);

CREATE UNIQUE INDEX uq_topups_fiscal_cash_tag
    ON topups (fiscal_cash_tag) WHERE fiscal_cash_tag IS NOT NULL;
CREATE INDEX idx_topups_wallet_id     ON topups (wallet_id);
CREATE INDEX idx_topups_customer_id   ON topups (customer_id);
CREATE INDEX idx_topups_warehouse_id  ON topups (warehouse_id);
CREATE INDEX idx_topups_processed_by  ON topups (processed_by);
CREATE INDEX idx_topups_payment_id    ON topups (payment_id);
CREATE INDEX idx_topups_wallet_txn_id ON topups (wallet_txn_id);

COMMENT ON TABLE topups IS
$doc$Wallet top-ups, cash and digital.

BR-18  — for CASH the sequence is: customer hands over cash, admin marks the
         fiscal cash tag, THEN the server credits the wallet and sends the SMS.
         The client app never asserts the credit. The tag is unique, so the same
         physical receipt cannot fund two credits.
BR-18b — warehouse_id and processed_by are required for cash (CHECK), because a
         credit nobody is accountable for is the fraud route this rule closes.
BR-18c — sms_sent_at/sms_error record dispatch outcome; an SMS failure never
         rolls back a completed credit.
BR-19  — CHECK caps a single cash top-up at Rs 10,000. Rs 10,000.01 is rejected,
         Rs 10,000 is accepted, and two consecutive Rs 10,000 top-ups both pass.$doc$;

-- -----------------------------------------------------------------------------
-- farmer_bank_accounts
-- -----------------------------------------------------------------------------
CREATE TABLE farmer_bank_accounts (
    id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id             uuid        NOT NULL REFERENCES farmers (id) ON DELETE CASCADE,
    account_holder_name   text        NOT NULL,
    account_number_last4  char(4)     CHECK (account_number_last4 IS NULL
                                             OR account_number_last4 ~ '^[0-9]{4}$'),
    account_number_token  text,
    ifsc                  text        CHECK (ifsc IS NULL OR ifsc ~ '^[A-Z]{4}0[A-Z0-9]{6}$'),
    bank_name             text,
    upi_vpa               text,
    is_verified           boolean     NOT NULL DEFAULT false,
    verified_by           uuid        REFERENCES users (id),
    verified_at           timestamptz,
    is_default            boolean     NOT NULL DEFAULT false,
    created_at            timestamptz NOT NULL DEFAULT now(),
    updated_at            timestamptz,
    deleted_at            timestamptz,
    CONSTRAINT farmer_bank_accounts_verified_pair_chk
        CHECK (is_verified = false OR (verified_by IS NOT NULL AND verified_at IS NOT NULL))
);

CREATE INDEX idx_farmer_bank_accounts_farmer_id   ON farmer_bank_accounts (farmer_id);
CREATE INDEX idx_farmer_bank_accounts_verified_by ON farmer_bank_accounts (verified_by);
CREATE UNIQUE INDEX uq_farmer_bank_accounts_default
    ON farmer_bank_accounts (farmer_id) WHERE is_default AND deleted_at IS NULL;

COMMENT ON TABLE farmer_bank_accounts IS
    'Payout destinations. Like Aadhaar, the full account number is NOT stored: '
    'last 4 for human confirmation plus an opaque provider token.';
COMMENT ON COLUMN farmer_bank_accounts.account_number_token IS
    'Opaque token from the payout provider. The full account number is never '
    'stored in this database and never returned in an API response.';

-- -----------------------------------------------------------------------------
-- payouts / payout_approvals — BR-31
-- -----------------------------------------------------------------------------
CREATE TABLE payouts (
    id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    payout_number           text          NOT NULL UNIQUE,
    farmer_id               uuid          NOT NULL REFERENCES farmers (id) ON DELETE RESTRICT,
    wallet_id               uuid          REFERENCES wallets (id),
    bank_account_id         uuid          REFERENCES farmer_bank_accounts (id),
    amount                  numeric(12,2) NOT NULL CHECK (amount > 0),
    mode                    text          NOT NULL DEFAULT 'IMPS'
                                          CHECK (mode IN ('UPI', 'IMPS', 'NEFT')),
    status                  payout_status NOT NULL DEFAULT 'REQUESTED',
    -- BR-31c: the boundary is strictly greater than 10,000. Rs 10,000 exactly
    -- follows the single-approval path.
    requires_dual_approval  boolean       GENERATED ALWAYS AS (amount > 10000.00) STORED,
    initiated_by            uuid          NOT NULL REFERENCES users (id),
    released_by             uuid          REFERENCES users (id),
    released_at             timestamptz,
    gateway_payout_id       text,
    failure_reason          text,
    paid_at                 timestamptz,
    wallet_txn_id           uuid          REFERENCES wallet_transactions (id),
    created_at              timestamptz   NOT NULL DEFAULT now(),
    updated_at              timestamptz,
    CONSTRAINT payouts_released_pair_chk
        CHECK ((released_by IS NULL) = (released_at IS NULL)),
    -- BR-31b, belt and braces: the initiator may not be the releaser either.
    CONSTRAINT payouts_releaser_not_initiator_chk
        CHECK (released_by IS NULL OR requires_dual_approval = false
               OR released_by <> initiated_by)
);

CREATE INDEX idx_payouts_farmer_id       ON payouts (farmer_id);
CREATE INDEX idx_payouts_wallet_id       ON payouts (wallet_id);
CREATE INDEX idx_payouts_bank_account_id ON payouts (bank_account_id);
CREATE INDEX idx_payouts_initiated_by    ON payouts (initiated_by);
CREATE INDEX idx_payouts_released_by     ON payouts (released_by);
CREATE INDEX idx_payouts_wallet_txn_id   ON payouts (wallet_txn_id);
CREATE INDEX idx_payouts_awaiting_approval
    ON payouts (created_at) WHERE status = 'PENDING_APPROVAL';

COMMENT ON TABLE payouts IS
    'Farmer settlements. BR-31: <= Rs 10,000 may be initiated and released by '
    'SUPER_ADMIN or TOHFA_ADMIN. Above Rs 10,000 (requires_dual_approval, a '
    'generated column so no caller can lie about it) a second, distinct '
    'SUPER_ADMIN approval is required and TOHFA_ADMIN can only escalate. '
    'BR-31c: the boundary is > 10000, not >=.';

CREATE TABLE payout_approvals (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    payout_id    uuid        NOT NULL REFERENCES payouts (id) ON DELETE CASCADE,
    approver_id  uuid        NOT NULL REFERENCES users (id),
    approver_role_code text,
    approved_at  timestamptz NOT NULL DEFAULT now(),
    note         text,
    created_at   timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT payout_approvals_unique UNIQUE (payout_id, approver_id)
);

CREATE INDEX idx_payout_approvals_payout_id   ON payout_approvals (payout_id);
CREATE INDEX idx_payout_approvals_approver_id ON payout_approvals (approver_id);

COMMENT ON TABLE payout_approvals IS
    'BR-31: one row per distinct approver. UNIQUE(payout_id, approver_id) means '
    'the same person cannot supply both approvals by clicking twice, and the '
    'trigger below rejects an approval by the initiator. Together they are what '
    'makes self-approval impossible in the database rather than only in the UI '
    '(BR-31b: SAME_ACTOR_APPROVAL).';

CREATE OR REPLACE FUNCTION app_payout_approval_guard() RETURNS trigger
LANGUAGE plpgsql AS $fn$
DECLARE
    v_initiated_by uuid;
BEGIN
    SELECT initiated_by INTO v_initiated_by FROM payouts WHERE id = NEW.payout_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'unknown payout_id %', NEW.payout_id USING ERRCODE = '23503';
    END IF;

    IF NEW.approver_id = v_initiated_by THEN
        RAISE EXCEPTION
            'BR-31b: payout % was initiated by % and cannot be approved by the same user',
            NEW.payout_id, NEW.approver_id
            USING ERRCODE = '23514', HINT = 'code: SAME_ACTOR_APPROVAL';
    END IF;

    RETURN NEW;
END
$fn$;

CREATE TRIGGER trg_payout_approval_guard
    BEFORE INSERT OR UPDATE ON payout_approvals
    FOR EACH ROW EXECUTE FUNCTION app_payout_approval_guard();

-- -----------------------------------------------------------------------------
-- invoices / invoice_lines
-- -----------------------------------------------------------------------------
CREATE TABLE invoices (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number     text          NOT NULL UNIQUE,
    invoice_type       invoice_type  NOT NULL,
    customer_id        uuid          REFERENCES customers (id),
    farmer_id          uuid          REFERENCES farmers (id),
    order_id           uuid          REFERENCES orders (id),
    purchase_order_id  uuid          REFERENCES purchase_orders (id),
    payout_id          uuid          REFERENCES payouts (id),
    issue_date         date          NOT NULL DEFAULT CURRENT_DATE,
    fiscal_year        text          NOT NULL,
    taxable_amount     numeric(12,2) NOT NULL DEFAULT 0 CHECK (taxable_amount >= 0),
    cgst               numeric(12,2) NOT NULL DEFAULT 0 CHECK (cgst >= 0),
    sgst               numeric(12,2) NOT NULL DEFAULT 0 CHECK (sgst >= 0),
    igst               numeric(12,2) NOT NULL DEFAULT 0 CHECK (igst >= 0),
    total_amount       numeric(12,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
    gst_inclusive      boolean       NOT NULL DEFAULT true,
    place_of_supply    text,
    pdf_key            text,
    status             text          NOT NULL DEFAULT 'DRAFT'
                                     CHECK (status IN ('DRAFT', 'ISSUED', 'CANCELLED', 'CREDIT_NOTED')),
    issued_by          uuid          REFERENCES users (id),
    created_at         timestamptz   NOT NULL DEFAULT now(),
    updated_at         timestamptz,
    -- Intra-state uses CGST+SGST, inter-state uses IGST. Both at once is wrong.
    CONSTRAINT invoices_gst_split_chk
        CHECK (igst = 0 OR (cgst = 0 AND sgst = 0))
);

CREATE INDEX idx_invoices_customer_id       ON invoices (customer_id);
CREATE INDEX idx_invoices_farmer_id         ON invoices (farmer_id);
CREATE INDEX idx_invoices_order_id          ON invoices (order_id);
CREATE INDEX idx_invoices_purchase_order_id ON invoices (purchase_order_id);
CREATE INDEX idx_invoices_payout_id         ON invoices (payout_id);
CREATE INDEX idx_invoices_issued_by         ON invoices (issued_by);
CREATE INDEX idx_invoices_type_fy           ON invoices (invoice_type, fiscal_year);

COMMENT ON TABLE invoices IS
    'Sales, purchase, payout and subscription invoices. BR-16b: a customer '
    'invoice names TOHFA as the seller — never the farmer — so nothing in the '
    'rendered PDF may resolve farmer_id. GST invoices for B2B/Horeca are '
    'SUPER_ADMIN/TOHFA_ADMIN only.';

CREATE TABLE invoice_lines (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id   uuid          NOT NULL REFERENCES invoices (id) ON DELETE CASCADE,
    line_no      smallint      NOT NULL CHECK (line_no > 0),
    description  text          NOT NULL,
    hsn_code     text,
    qty          numeric(12,3) NOT NULL CHECK (qty > 0),
    unit_price   numeric(12,2) NOT NULL CHECK (unit_price >= 0),
    gst_rate     numeric(5,2)  NOT NULL DEFAULT 0 CHECK (gst_rate >= 0),
    taxable      numeric(12,2) NOT NULL DEFAULT 0 CHECK (taxable >= 0),
    tax          numeric(12,2) NOT NULL DEFAULT 0 CHECK (tax >= 0),
    total        numeric(12,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
    created_at   timestamptz   NOT NULL DEFAULT now(),
    updated_at   timestamptz,
    CONSTRAINT invoice_lines_unique UNIQUE (invoice_id, line_no)
);

CREATE INDEX idx_invoice_lines_invoice_id ON invoice_lines (invoice_id);

COMMENT ON TABLE invoice_lines IS
    'Invoice line items. Descriptions are produce-and-grade only on customer '
    'invoices (BR-16b) — no farm or village names.';

-- -----------------------------------------------------------------------------
-- expenses
-- -----------------------------------------------------------------------------
CREATE TABLE expenses (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_id  uuid          REFERENCES warehouses (id),
    category      text          NOT NULL,
    amount        numeric(12,2) NOT NULL CHECK (amount > 0),
    expense_date  date          NOT NULL DEFAULT CURRENT_DATE,
    vendor        text,
    description   text,
    receipt_key   text,
    status        text          NOT NULL DEFAULT 'RECORDED'
                                CHECK (status IN ('RECORDED', 'APPROVED', 'REJECTED')),
    recorded_by   uuid          NOT NULL REFERENCES users (id),
    approved_by   uuid          REFERENCES users (id),
    approved_at   timestamptz,
    created_at    timestamptz   NOT NULL DEFAULT now(),
    updated_at    timestamptz,
    deleted_at    timestamptz,
    -- The same separation of duties as stock adjustments and payouts.
    CONSTRAINT expenses_no_self_approval_chk
        CHECK (approved_by IS NULL OR approved_by <> recorded_by)
);

CREATE INDEX idx_expenses_warehouse_id ON expenses (warehouse_id, expense_date DESC);
CREATE INDEX idx_expenses_recorded_by  ON expenses (recorded_by);
CREATE INDEX idx_expenses_approved_by  ON expenses (approved_by);

COMMENT ON TABLE expenses IS
    'Warehouse and operational expenses. Recorder and approver must differ — the '
    'same separation of duties BR-31 and BR-37 apply to payouts and stock.';

SELECT app_attach_updated_at_triggers();

-- +migrate Down

DROP TABLE IF EXISTS expenses;
DROP TABLE IF EXISTS invoice_lines;
DROP TABLE IF EXISTS invoices;
DROP TRIGGER IF EXISTS trg_payout_approval_guard ON payout_approvals;
DROP FUNCTION IF EXISTS app_payout_approval_guard();
DROP TABLE IF EXISTS payout_approvals;
DROP TABLE IF EXISTS payouts;
DROP TABLE IF EXISTS farmer_bank_accounts;
DROP TABLE IF EXISTS topups;
ALTER TABLE farmer_subscriptions DROP CONSTRAINT IF EXISTS farmer_subscriptions_payment_id_fkey;
DROP TABLE IF EXISTS payments;
DROP TRIGGER IF EXISTS trg_wallet_txn_apply ON wallet_transactions;
DROP TRIGGER IF EXISTS trg_wallet_txn_balance ON wallet_transactions;
DROP FUNCTION IF EXISTS app_wallet_txn_apply();
DROP FUNCTION IF EXISTS app_wallet_txn_balance();
DROP TABLE IF EXISTS wallet_transactions;
DROP TABLE IF EXISTS wallets;
