# TOHFA database

PostgreSQL 16. Extensions: `pgcrypto` (UUIDs) and `postgis` (FMB farm
boundaries, warehouse and address points).

```
db/
  migrations/   0001..0008, plain SQL, applied in filename order
  seed/         001_reference.sql, 002_permissions.js
```

## Running migrations

Migrations are plain SQL in node-pg-migrate style numbering. Each file has an
up section and a down section separated by a single delimiter line:

```sql
-- +migrate Up
...
-- +migrate Down
...
```

The runner applies everything above `-- +migrate Down` when migrating up and
everything below it when rolling back. **`psql -f` on a whole file would run
both halves and leave you with an empty database** — always go through the
runner, or strip the down section first.

```bash
# up
npm run migrate:up            # applies pending migrations in order

# down, one step
npm run migrate:down
```

Applying them by hand, in order, without the runner:

```bash
for f in db/migrations/*.sql; do
  awk '/^-- \+migrate Down/{exit} {print}' "$f" |
    psql -v ON_ERROR_STOP=1 -d "$DATABASE_URL"
done
```

The up sections run top to bottom on an empty database with no errors, and the
down sections run in reverse to leave the schema empty again (bar PostGIS's
`spatial_ref_sys`). Both directions are part of the contract; if you add a
migration, add its rollback.

## Running seeds

Order matters — `002` needs the roles that `001` creates.

```bash
psql -v ON_ERROR_STOP=1 -d "$DATABASE_URL" -f db/seed/001_reference.sql
node db/seed/002_permissions.js
```

**`001_reference.sql`** — roles, the four warehouses (BR-23), categories,
grades, the 10 rating categories (BR-06), rating tier thresholds (BR-04),
allocation percentages (BR-12) and the crop catalogue. Fully idempotent: every
insert has an `ON CONFLICT` and re-running it is the intended way to update
reference data. It ends with assertions — if it produced 3 warehouses instead
of 4 it aborts rather than leaving warehouse scoping quietly broken. The whole
file is one transaction because `allocation_config` carries a deferred
constraint that checks the 100% sum at `COMMIT`.

**`002_permissions.js`** — projects `docs/rbac.json` into `permissions` and
`role_permissions`. The permission list is never written by hand. It upserts
what the file describes, deletes grants and permissions the file no longer
describes, and validates the file first (unknown role, invalid scope, a
`conditional` grant with no predicate, a permission with no verdict for some
role — all hard errors).

```bash
node db/seed/002_permissions.js            # apply
node db/seed/002_permissions.js --check    # exit 1 on drift; run this in CI
node db/seed/002_permissions.js --verbose  # print every change
```

`--check` is the CI gate. If someone edits `role_permissions` in the database
or edits `rbac.json` without re-running the seed, the build fails with a diff.

## The append-only invariant

Four tables are append-only:

| Table | Why |
|---|---|
| `stock_ledger` | Stock quantity is derived from it (BR-37) |
| `wallet_transactions` | Wallet balance is derived from it (BR-17) |
| `order_status_history` | The delivery timeline is evidence (BR-20) |
| `audit_log` | Every other rule is proved from it (BR-35) |

Each is protected two ways, by `app_make_append_only()` in `0001`:

1. Statement-level `BEFORE UPDATE OR DELETE` and `BEFORE TRUNCATE` triggers
   that raise unconditionally. Statement-level, so even a zero-row `UPDATE`
   fails loudly instead of succeeding silently and teaching the wrong lesson.
2. `REVOKE UPDATE, DELETE, TRUNCATE ... FROM tohfa_app` — applied automatically
   when that role exists. Defence in depth: the triggers are owned by the
   schema, and a bad migration should not be the only thing between an
   application bug and the audit trail.

`inventory_batches.qty_available` and `wallets.balance` are **caches**. They
are written only by the `AFTER INSERT` triggers on the two ledgers, under a row
lock taken in the matching `BEFORE INSERT` trigger that computes
`balance_after`. Nothing else may update those two columns. If a number looks
wrong, the ledger is right and the cache is the bug.

### Why it matters

Every control the client signed off is retrospective. Dual approval on payouts,
the block on a Farmer Admin approving their own listing, warehouse scoping,
cash top-ups that require a fiscal tag — none of them can be *demonstrated*
after the fact unless the record of what happened is untouchable. An editable
audit log is not a weaker audit log; it is not an audit log. The same is true
of money and stock: an in-place balance update loses the reason a number
changed, and reconciliation becomes permanently manual.

### The rule

> **Never write a migration that alters an append-only table's history.**

No `UPDATE`, no `DELETE`, no backfill, no "just this once to fix the data", no
`ALTER TABLE ... USING` that rewrites existing values. Adding a nullable column
or an index is fine. Changing what a past row says is not.

A wrong ledger row is corrected by inserting the compensating row that says so
— a reversing stock movement, an opposing wallet transaction — leaving both the
mistake and the correction visible. That pair *is* the audit trail. Collapsing
it into one tidy correct-looking row destroys the only evidence that anything
happened.

If you genuinely believe a migration must rewrite history, that is a
conversation with the client about their signed-off controls, not a pull
request.

## Conventions

- `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`
- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz`, maintained by a trigger attached automatically to
  every table that has the column (`app_attach_updated_at_triggers()`, called
  at the end of each migration)
- `deleted_at timestamptz` where soft delete makes sense; unique indexes are
  partial on `deleted_at IS NULL` so a deleted row does not permanently burn a
  natural key
- money `numeric(12,2)`, quantity/weight `numeric(12,3)` kilograms
- every foreign key has an index
- every table has a `COMMENT ON TABLE` naming the BR IDs it supports; that
  comment is the link back to `docs/rules.md` and is expected to stay accurate

Enum labels are `UPPER_SNAKE` and are wire identifiers: adding one is safe,
renaming one is a breaking API change. The exception is `role_permissions.scope`,
which is lowercase `all|own|view|conditional|none` to match `rbac.json`
verbatim.

## What the schema deliberately does not do

The schema enforces what can be enforced declaratively. It does not pretend to
enforce authorization — that is the service layer reading `role_permissions`,
and a hidden button is not a permission.

Some things are modelled but unused on purpose, because the source documents
contradict each other and `docs/rules.md` forbids resolving it in code:
delivery slots and the delivery fulfilment path (contradiction 3), the
`DELIVERY_PARTNER` user type, the B2B/Horeca channels on `orders` (there is
deliberately **no** B2B bucket in `allocation_channel`, contradiction 10),
`rating_tier_config` (contradiction 1, seeded as data with no scoring logic),
and `farms.boundary` (FMB capture is deferred). The columns exist so these
capabilities are not retrofitted onto live data later; nothing populates them
in Track 1.
