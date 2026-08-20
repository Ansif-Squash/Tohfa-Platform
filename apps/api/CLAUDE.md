# apps/api — instructions

Node 20 · Express 4 · TypeScript 5 (strict) · PostgreSQL 16 · Redis · BullMQ · Zod · Vitest.

Read the root `CLAUDE.md` first. This file only covers what is specific to the API.

## Layering — do not blur it

```
routes    wiring only          requireAuth → requirePermission → validate → handler
schema    Zod in/out           must match docs/openapi.yaml exactly
service   all business logic   takes ResolvedScope, throws AppError, never sees a Request
repo      SQL only             takes an Executor so it can join a caller's transaction
```

`apps/api/src/modules/_example/` is the canonical implementation of all four. Read it before
writing a new module; copy it rather than inventing a variant.

## Authorization

`requirePermission(code)` resolves the actor's highest scope and attaches `req.scope`.

- `all` → no filter
- `own` / `view` → the handler **must** narrow the query with `scopedWhere(req, {...})`
- `conditional` → the service must call `assertPredicate(...)` **after** loading the target row,
  because the middleware cannot evaluate a predicate against a row it has not seen
- `none` → 403, never reaches the handler

Cross-scope reads return empty, not 403.

## Transactions

Multi-statement writes go through `withTransaction`. The audit row is written with the **same**
client, inside the same transaction — an action that rolls back must not leave an audit trail
claiming it happened.

```ts
await withTransaction(async (tx) => {
  const row = await repo.update(tx, id, patch);
  await writeAuditLog(tx, { actor, actionCode: 'listing.approve', entityId: id, before, after });
  return row;
});
```

## Money and stock

Never `UPDATE wallets SET balance = ...` or `UPDATE inventory_batches SET qty_available = ...`.
Insert into `wallet_transactions` / `stock_ledger`; the trigger maintains the cache. The
database rejects a movement that would push a balance below zero — let it, and translate the
error into `WALLET_INSUFFICIENT` or `STOCK_UNAVAILABLE`.

Every money-moving endpoint requires an `Idempotency-Key` header. Store it on the ledger row
(it is `UNIQUE`), catch the conflict, and return the original result.

## Jobs

Scheduled work belongs in `src/jobs/`, registered in the worker's job registry, never in a
`setInterval` inside a service. Current jobs: certificate expiry sweep, counter-offer expiry,
cart lock release, daily cash reconciliation.

Jobs must be idempotent — they will run twice.

## Tests

- Unit: service with a mocked repo. Fast, no database.
- Integration: real pool, gated on `DATABASE_URL`, wrapped in a transaction that rolls back.
- Rule tests: named `BR-xx: <what it prevents>`. Write them first.

`src/rbac/rbac.test.ts` is table-driven over `docs/rbac.json`. When you add permissions, add
rows there — it is the only thing standing between a typo and a privilege escalation.
