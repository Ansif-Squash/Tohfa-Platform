# TOHFA Platform — instructions for AI agents

You are building the TOHFA platform: a farm-to-consumer system connecting certified organic
farmers in the Nilgiris directly with customers, through three applications (Farmer mobile,
Customer mobile, Admin web) on one backend.

**Read this file completely before you write a single line of code.** Then read the file for
the app you are working in (`apps/*/CLAUDE.md`).

---

## 1. The four ground-truth files

These are not documentation. They are the specification. When they disagree with a prompt, a
comment, or your own instinct, **they win**. When you believe one of them is wrong, say so and
stop — do not silently deviate.

| File | What it governs |
|---|---|
| `docs/rbac.json` | Every authorization decision. Roles, permissions, scopes, predicates. |
| `docs/rules.md` | Every business rule, with an ID (`BR-01`…`BR-38`) and a test contract. |
| `docs/openapi.yaml` | Every HTTP contract. Paths, schemas, status codes, error codes. |
| `packages/design-tokens/src/tokens.json` | Every colour, size, spacing and radius. |

If your task needs a rule, permission, endpoint or colour that is not in these files, **that is
a specification gap**. Add it to the relevant file as part of your change, and call it out in
your summary. Never invent one inline.

---

## 2. The rules that are not negotiable

### 2.1 Authorization is server-side, always
A hidden button is not a permission. Every route carries `requirePermission('<code>')` with a
code that exists in `docs/rbac.json`. If you write `if (user.role === 'SUPER_ADMIN')` inside a
handler, you have made a mistake — that fact belongs in `rbac.json`.

Cross-scope reads return an **empty result set, not 403**. A 403 leaks the existence of the
row. See the long comment at the top of `apps/api/src/rbac/requirePermission.ts`.

### 2.2 Money is never a float
Use the `Money` type from `@tohfa/shared-types`. It is a branded string backed by integer
paise. `0.1 + 0.2 !== 0.3` will eventually cost this client real money.

### 2.3 Ledgers are append-only
`wallet_transactions`, `stock_ledger`, `order_status_history` and `audit_log` reject UPDATE and
DELETE **at the database level**. Balances (`wallets.balance`, `inventory_batches.qty_available`)
are trigger-maintained caches derived from the ledger. Never write to a balance column directly.

### 2.4 Money-moving writes are idempotent
Every endpoint that moves money requires an `Idempotency-Key` header and must be safe to replay.
Replaying a key moves money once.

### 2.5 The customer view is farm-anonymous
No `farmerId`, farm name, farm location, GPS or FMB data may ever reach a customer response.
The catalog serializer is an **allow-list**, not a deny-list, so that adding a field to an
internal model cannot leak it. Uploaded images have EXIF stripped — a produce photo carrying
farm GPS is the same breach. This is `BR-16`.

### 2.6 Every business rule gets a named test
When your task touches a rule in `docs/rules.md`, write the test **first**, name it with the
rule ID, and watch it fail before you implement:

```ts
it('BR-07: rejects a listing priced above the fair price ceiling', async () => { ... });
```

A rule without a failing-first test is not implemented, it is asserted.

### 2.7 No hard-coded values
No hex colours, no spacing numbers, no user-facing English strings in components. Colours and
spacing come from `@tohfa/design-tokens`. Strings come from the i18n catalogue. Business
thresholds (the Rs 10,000 cap, the 24-hour window, the 70/10/10/10 split) come from
`system_config`, never from a constant in a service.

---

## 3. Repository map

```
docs/                    the four ground-truth files
db/migrations/           numbered SQL, up + `-- +migrate Down`
db/seed/                 001 reference data, 002 permissions synced from rbac.json
packages/shared-types/   enums, ErrorCode, Problem, Money
packages/design-tokens/  tokens.json + typed export + CSS custom property emitter
apps/api/                Node + Express + TypeScript. The backbone.
apps/admin-web/          Angular 17, standalone components
apps/farmer-mobile/      React Native 0.74
apps/customer-mobile/    React Native 0.74
scripts/                 rbac drift check, module scaffolder
```

---

## 4. How to add an API module

**Do not improvise the structure.** Run the scaffolder, or copy
`apps/api/src/modules/_example/` (the warehouses module), which exists solely as the pattern:

```bash
pnpm exec tsx scripts/new-module.ts <module-name>
```

Every module is four files plus a test:

| File | Responsibility |
|---|---|
| `<name>.routes.ts` | Express wiring only. `requireAuth` → `requirePermission` → `validate` → handler. No logic. |
| `<name>.schema.ts` | Zod schemas for request and response, matching `docs/openapi.yaml` exactly. |
| `<name>.service.ts` | All business logic. Takes a `ResolvedScope`, never a `Request`. Evaluates predicates. Throws `AppError` with a domain `ErrorCode`. |
| `<name>.repo.ts` | SQL only. Accepts an `Executor` so it can join the caller's transaction. |
| `<name>.test.ts` | Unit tests against a mocked repo, plus integration tests when `DATABASE_URL` is set. |

Services take a scope rather than a request so they remain callable from a job, a script, or a
test. Repos take an `Executor` so a service can wrap several of them in one transaction.

---

## 5. Errors

Throw `AppError` with a code from `packages/shared-types/src/errors.ts`. The error middleware
renders RFC 9457 `application/problem+json` with a correlation ID. Never return an error shape
from a service; never `res.status(400).json({ error: ... })` in a handler.

If you need a new error code, add it to `errors.ts` **and** to the `Problem` schema description
in `docs/openapi.yaml`.

---

## 6. Definition of done

A task is finished when **all** of these hold. Report honestly against this list; a partial
result described accurately is far more useful than a complete-sounding one that is not.

- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm test` passes, and the new tests failed before the implementation existed
- [ ] Every business rule touched has a test named with its `BR-xx` ID
- [ ] Every new route has a `requirePermission` code that exists in `docs/rbac.json`
- [ ] `docs/openapi.yaml` matches the implementation (`pnpm spec:lint` passes)
- [ ] Mutating admin actions write an `audit_log` row inside the same transaction
- [ ] No hard-coded colours, spacing, strings or business thresholds
- [ ] `pnpm rbac:check` passes if you changed `rbac.json`

---

## 7. When you are unsure

Stop and say so. Specifically:

- **A requirement is ambiguous** → check `docs/rules.md` § "Open contradictions". If it is
  listed there, implement the stated default and note it. If it is not, ask.
- **Two source documents disagree** → `docs/rbac.json` `conflictPrecedence` says the
  Requirements Document Chapter 6 wins. Follow it and flag the conflict.
- **The task seems to need a schema change** → write the migration, never an ad-hoc `ALTER` in
  application code, and never modify an existing migration that has already run.
- **You cannot make a test pass** → leave it failing and say why. Do not delete it, skip it, or
  weaken its assertion to go green. A weakened test is worse than no test, because it reports
  safety that does not exist.

---

## 8. Working style

- Small, complete changes. One story per session.
- Read the existing code before adding to it. This repo has a pattern; follow it.
- Prefer boring, explicit code. This will be maintained by people who did not write it.
- Comment the *why*, not the *what*. The interesting comments in this codebase are all about
  why something is enforced where it is.
