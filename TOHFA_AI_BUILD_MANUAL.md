# TOHFA — AI Build Manual

**47 stories · 146 hours · 25 working days · 1 developer + AI**

Every story below is a work order. The developer copies the prompt into the AI agent, runs the verify commands, checks the done list, and moves on. The developer does not write application code.

---

## How to run a story

1. `git checkout -b story/S-xx-short-name`
2. Open the AI agent **in the repo root** so it reads `CLAUDE.md` automatically.
3. Paste the story's **Prompt** verbatim. Change nothing.
4. When it reports done, run every command under **Verify**.
5. Check every box under **Done**.
6. Read the **Watch for** line, then review that specific thing in the diff.
7. Merge. CI deploys to staging.

**Rules for the developer**

- One story per agent session. A fresh session per story keeps context clean and prevents drift.
- Never edit the prompt to make a failure go away. If a story is wrong, fix the story, then re-run it.
- If the agent says a rule in `docs/` is ambiguous or wrong, it is doing the right thing. Resolve it in `docs/`, then continue.
- Never let a test be deleted, skipped or weakened to go green. A weakened test reports safety that does not exist.

---

## The four ground-truth files

The agent reads these instead of re-deriving requirements. They are the specification.

| File | Governs | Guarded by |
|---|---|---|
| `docs/rbac.json` | 150 permissions × 7 roles, scopes, predicates | `pnpm rbac:check`, `pnpm spec:drift` |
| `docs/rules.md` | 38 business rules `BR-01`…`BR-38`, each with a test contract | `pnpm spec:drift` |
| `docs/openapi.yaml` | 90 operations, schemas, error codes | `pnpm spec:lint`, `pnpm spec:drift` |
| `packages/design-tokens/src/tokens.json` | Every colour, size, spacing, radius | lint rule on hex literals |

`pnpm spec:drift` fails the build if a permission code, `BR-xx` ID or error code referenced anywhere stops existing. That is what stops the four files diverging over 25 days.

---

## Milestones

| Week | Days | Milestone | Stories | Hours |
|---|---|---|---|---|
| **Week 0** | 0–0 | Setup | 4 | 9.5 |
| **Week 1** | 1–5 | Identity, onboarding and pricing | 10 | 28.0 |
| **Week 2** | 6–10 | Trade and supply chain | 10 | 30.0 |
| **Week 3** | 11–15 | Money, orders, and shipping Track 1 | 10 | 31.5 |
| **Week 4** | 16–20 | Farmer mobile app | 6 | 22.5 |
| **Week 5** | 21–25 | Customer app and launch | 7 | 24.0 |
| | | **Total** | **47** | **146** |

At 6 hours of ticket execution per day this is 25 working days — five calendar weeks at five days, four at six. The pace assumes review, meetings and bug-fix time are *outside* these hours, not inside them.

### Milestone exit criteria

**Week 0 — Setup.** Nothing is built. Decisions are locked, accounts exist, the base repo runs green, and the React Native toolchain is proven. Do not start Week 1 until every box here is ticked.

**Week 1 — Identity, onboarding and pricing.** A farmer can register from an API client and be approved by an admin in the console. Certificates block listings. Fair prices exist. Staging is live and CI deploys to it.

**Week 2 — Trade and supply chain.** A farmer lists produce, an admin counter-offers, the farmer accepts, a PO is raised, goods are received and quality-checked, stock enters the ledger, and allocation splits it 70/10/10/10. The customer-facing catalog reads from it, farm-anonymously.

**Week 3 — Money, orders, and shipping Track 1.** Money moves. Wallets, top-ups (card and cash), cart, wallet-first checkout, order fulfilment with OTP, farmer payouts with dual approval, invoices. One automated test proves the whole chain. Track 1 ships.

**Week 4 — Farmer mobile app.** A farmer registers, sees their dashboard, lists produce and responds to a counter-offer — from a phone, on the real API.

**Week 5 — Customer app and launch.** A customer browses farm-anonymously, tops up a wallet, checks out and tracks an order from a phone. Push and SMS work. Both apps are on the internal test tracks.

---

# Week 0 — Setup

*Days 0–0 · 4 stories · 9.5 hours*

| Story | Day | h | App | Title |
|---|---|---|---|---|
| `S-01` | 0 | 3 | ops | Lock the 14 blocking client decisions |
| `S-02` | 0 | 2 | ops | Provision third-party accounts, keys and store secrets |
| `S-03` | 0 | 1.5 | ops | Boot the base repo locally and prove it green |
| `S-04` | 0 | 3 | ops | React Native toolchain spike — Android and iOS both building |

## Day 0

### S-01 — Lock the 14 blocking client decisions

**3h** · `ops` · rules `BR-04`, `BR-08`, `BR-13`, `BR-17`, `BR-20`, `BR-21`, `BR-33`, `BR-38`

**Goal.** Every 'requires client confirmation' row in docs/rules.md has a written client answer, so no sprint day stalls on a question only the client can settle.

**Prompt**

```text
HUMAN TASK — this is a client call plus a write-up, not an AI coding session. Do not build anything.

Open docs/rules.md at 'Open contradictions — DO NOT GUESS'. Twelve of its thirteen rows are still 'requires client confirmation'. Work the client through this checklist and write the answer down in the room:

1. Audit rating scale (contradiction 1, BR-04): 100-point or the 650/700/750 tier scale? `system_config.rating_scale_max` is seeded null until they answer.
2. Automation vs manual entry (contradiction 2, BR-38): are auto-reminders, suggested treatments, weather risk and automatic B2B allocation in or out?
3. Fulfilment model (contradiction 3, BR-21): warehouse pickup only, or home delivery with slots and drivers?
4. Audit-log scope for Main Warehouse Admin (contradiction 4): own rows or all rows?
5. Warehouse capacity authority (contradiction 5): SA only, or SA+TA+MW?
6. PRIORITY — wallet write authority for MW/SW (contradiction 6): who may manually credit or debit customer money?
7. Bank refunds for MW/SW (contradiction 7).
8. Integration keys and raw DB export in-app or infra-only (contradiction 8).
9. COD vs wallet-first (contradiction 9, BR-17).
10. B2B/Horeca allocation source (contradiction 10, BR-13).
11. Pickup OTP disclosure (contradiction 11, BR-20): customer-held only, or shared with warehouse staff?
12. Object storage vendor (contradiction 13): Azure Blob is assumed by .env.example — confirm it.
13. Aadhaar masking (BR-33): last-4 visible or hidden entirely, and who may change a locked field.
14. Brand colours for TOHFA_ADMIN and FARMER_ADMIN (docs/rbac.json roles[].colorHex are marked placeholders), plus the two placeholder thresholds: fair price update frequency, daily or weekly (BR-08), and the free-tier listing limit (`free_tier_listing_limit`, currently disabled).

After the call, record each answer in the contradictions table — replace 'requires client confirmation' with 'RESOLVED <date>: <decision>'. A decision that changes a grant goes into docs/rbac.json and must survive `pnpm rbac:check`; a decision that changes a number goes into `system_config` in db/seed/001_reference.sql, never into a constant.

Traps: do not accept 'both' or 'we'll see' on items 2, 3 and 6 — each blocks a whole week of build. Do not resolve any of these yourself in code; an assumption recorded as a decision is worse than an open row.

Report against the Definition of Done in CLAUDE.md §6. If a rule in docs/ is ambiguous or wrong, stop and say so rather than guessing.
```

**Verify**

```bash
grep -c 'requires client confirmation' docs/rules.md   # expect 0
grep -n 'RESOLVED' docs/rules.md | wc -l   # expect 14 rows touched
pnpm rbac:check
git diff --stat docs/rules.md docs/rbac.json db/seed/001_reference.sql
```

**Done**

- [ ] All 14 items have a one-line written answer signed off by the client (email or minutes attached).
- [ ] docs/rules.md 'Open contradictions' table shows no row still reading 'requires client confirmation'.
- [ ] Any grant change landed in docs/rbac.json and `pnpm rbac:check` passes.
- [ ] Any threshold change landed in db/seed/001_reference.sql system_config with the BR id in its description.
- [ ] Decisions that were deferred are listed explicitly as deferred, with the sprint day they will block.

> **Watch for.** The temptation to 'unblock' by picking a sensible default — an undocumented assumption here surfaces as rework in week 4, not on day 1.

---

### S-02 — Provision third-party accounts, keys and store secrets

**2h** · `ops`

**Goal.** Every environment variable in .env.example has a real value or a deliberate mock, and the long-lead-time vendor approvals are already running.

**Prompt**

```text
HUMAN TASK — account signup and secret handling. No code.

Provision, in this order, because three of them have multi-day approval queues:
1. Apple Developer Program (organisation enrolment needs a D-U-N-S number; allow up to a week) and Google Play Console.
2. MSG91 or Twilio, plus Indian DLT sender-id and template registration for transactional OTP SMS — the template approval, not the account, is the slow part.
3. Razorpay test account and RazorpayX (payouts) — RazorpayX needs business KYC before test payouts work.
4. Firebase project + FCM server key, one app entry each for the farmer and customer bundle ids.
5. Azure: subscription, resource group, Blob storage account + container `tohfa-media`, Postgres Flexible Server (16, PostGIS), Azure Cache for Redis, Key Vault.

Then `cp .env.example .env` and fill every key listed there: DATABASE_URL, REDIS_URL, JWT_SECRET (>=32 random chars, unique per environment), AZURE_STORAGE_CONNECTION_STRING, AZURE_BLOB_CONTAINER, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET, RAZORPAYX_ACCOUNT, MSG91_AUTH_KEY, FCM_SERVER_KEY, SENTRY_DSN. apps/api/src/config.ts validates all of them at boot with Zod and fails fast, so a blank required value is caught immediately.

Keep PAYMENT_PROVIDER=mock and SMS_PROVIDER=mock for local development and CI — the mock adapters keep tests offline and deterministic, and real vendor keys must never be a test dependency.

Secret handling: real values live in Azure Key Vault and GitHub Actions secrets. .env is git-ignored and stays on the machine. Never paste a live key into a chat, a ticket or docs/.

Traps: the Razorpay test key and the RazorpayX account number are different credentials for different products; FCM server keys issued under the legacy API are deprecated — take the V1 service account; an Apple enrolment started in week 3 delays the TestFlight build, not the code.

Report against the Definition of Done in CLAUDE.md §6. If a rule in docs/ is ambiguous or wrong, stop and say so rather than guessing.
```

**Verify**

```bash
test -f .env && grep -c '=$' .env   # expect 0 for required keys
git check-ignore -v .env
az storage container show --name tohfa-media --account-name <acct> -o table
pnpm dev:api   # config.ts must boot without an 'Invalid environment configuration' error
```

**Done**

- [ ] Apple, Google Play, MSG91/Twilio (with DLT template submitted), Razorpay + RazorpayX, Firebase and Azure accounts all exist and are recorded in the project credential store.
- [ ] .env exists locally, is git-ignored, and every non-mock key has a value.
- [ ] Azure Key Vault holds the same secrets under the names the staging deploy will read.
- [ ] PAYMENT_PROVIDER and SMS_PROVIDER remain `mock` in .env and in .github/workflows/ci.yml.
- [ ] The two long-lead items (Apple enrolment, DLT template) have a ticket number and an expected approval date.

> **Watch for.** A live Razorpay or MSG91 key committed in .env, or CI switched off `mock` — either turns the test suite into a billable, flaky integration test.

---

### S-03 — Boot the base repo locally and prove it green

**1.5h** · `ops` · after `S-02`

**Goal.** The untouched base repo runs on this machine — migrations applied, seeds loaded, typecheck/lint/test green, API answering on :3000 — so any later red is caused by the story, not the setup.

**Prompt**

```text
MIXED HUMAN + AI TASK. Bring the base repo up on this machine and prove it green before any feature work starts. Change nothing except .env.

Sequence:
1. Node 20.11 or newer but below 21 (root package.json `engines`), pnpm 9.12.3 (`packageManager`). Use corepack, not a global pnpm.
2. `pnpm install --frozen-lockfile`.
3. `docker compose up -d` — postgis/postgis:16-3.4-alpine on 5432 and redis:7-alpine on 6379, both with healthchecks (docker-compose.yml). Wait for healthy, not for 'started'.
4. `cp .env.example .env` if it does not exist; DATABASE_URL and REDIS_URL must match the compose ports.
5. `pnpm db:reset` — rolls everything down, re-runs db/migrations/0001..0008 and both seeds. db/seed/002_permissions.js projects docs/rbac.json into permissions + role_permissions.
6. `pnpm typecheck && pnpm lint && pnpm test`.
7. `pnpm rbac:check` and `pnpm spec:lint` — the two drift guards CI runs.
8. `pnpm dev` (API + Angular admin) and `pnpm dev:worker` in a second shell; hit the health probes.

Record, in the project log, the exact versions of node, pnpm, docker and psql that produced green, plus the wall-clock time of a cold `pnpm test`.

Traps: a stale `tohfa-pgdata` volume from a previous project makes migrations fail in a way that looks like a code bug — `docker compose down -v` and re-reset; the E2E suite (`pnpm test:e2e`) is a separate script and needs DATABASE_URL set; integration tests silently skip when DATABASE_URL is empty (see `describeIfDatabase` in apps/api/src/test/factories.ts), so 'all green' with no database is a false green — check the skip count.

Report against the Definition of Done in CLAUDE.md §6. If a rule in docs/ is ambiguous or wrong, stop and say so rather than guessing.
```

**Verify**

```bash
docker compose ps   # postgres and redis both (healthy)
pnpm db:reset
pnpm typecheck && pnpm lint && pnpm test
pnpm rbac:check && pnpm spec:lint
curl -s localhost:3000/healthz | jq
curl -s localhost:3000/readyz | jq   # db and redis both true
```

**Done**

- [ ] `pnpm install --frozen-lockfile` completes with no engine warnings.
- [ ] `pnpm db:reset` applies migrations 0001-0008 and both seeds with no error.
- [ ] typecheck, lint, test, rbac:check and spec:lint all pass on the untouched repo.
- [ ] /healthz and /readyz return 200 with database and redis true.
- [ ] Integration tests reported as run, not skipped (DATABASE_URL is set in the shell that runs the tests).
- [ ] Toolchain versions and cold-test duration recorded in the project log.

> **Watch for.** A green test run that actually skipped every database-backed test because DATABASE_URL was unset in that shell.

---

### S-04 — React Native toolchain spike — Android and iOS both building

**3h** · `ops` · after `S-02`

**Goal.** Both React Native apps launch on an Android emulator and an iOS simulator from a clean checkout, with signing configured and the Azure CLI authenticated.

**Prompt**

```text
HUMAN TASK — environment spike. Do this on day 0. It is not a feature and must never be attempted inside a sprint day.

apps/farmer-mobile and apps/customer-mobile are React Native 0.74.5 workspaces with src/ and index.js but NO native `ios/` or `android/` directories. Generating them is the substance of this task.

Steps:
1. Install the toolchain: JDK 17, Android Studio with SDK 34 + build-tools + one AVD (Pixel 6, API 34); on macOS, Xcode 15 with command line tools, an iOS 17 simulator, CocoaPods, and Ruby via rbenv rather than system Ruby.
2. Generate the native projects for each app at the pinned version — `npx @react-native-community/cli@latest init TohfaFarmer --version 0.74.5` in a scratch directory, then copy the produced `ios/` and `android/` into apps/farmer-mobile, rewriting the bundle id (`in.tohfa.farmer`, `in.tohfa.customer`), display name and app icon. Keep the app entry pointing at the existing src/App.tsx and index.js. Repeat for customer-mobile.
3. Metro must resolve the pnpm workspace packages @tohfa/shared-types and @tohfa/design-tokens — pnpm's symlinked node_modules is the usual failure; add the workspace roots to `watchFolders` and disable hierarchical lookup in metro.config.js if needed.
4. Run each app on the emulator and the simulator. Register the Apple bundle ids and set up automatic signing with the team from S-02.
5. `az login` and confirm the subscription and resource group from S-02 are reachable.

Traps: an Android build that works only because a global gradle cache already had the artifacts; a simulator build that never touched signing; Metro resolving a hoisted duplicate React copy and failing with an invalid-hook error at runtime.

Report against the Definition of Done in CLAUDE.md §6. If a rule in docs/ is ambiguous or wrong, stop and say so rather than guessing.
```

**Verify**

```bash
pnpm --filter @tohfa/farmer-mobile typecheck && pnpm --filter @tohfa/customer-mobile typecheck
cd apps/farmer-mobile && npx react-native doctor
cd apps/farmer-mobile && npx react-native run-android
cd apps/farmer-mobile && npx react-native run-ios --simulator 'iPhone 15'
cd apps/customer-mobile && npx react-native run-android
az account show -o table
```

**Done**

- [ ] apps/farmer-mobile/ios, apps/farmer-mobile/android, apps/customer-mobile/ios and apps/customer-mobile/android exist and are committed.
- [ ] Both apps launch on an Android emulator and render the existing src/App.tsx.
- [ ] Both apps launch on an iOS simulator with automatic signing against the real Apple team id.
- [ ] Metro resolves @tohfa/shared-types and @tohfa/design-tokens from the pnpm workspace with no duplicate React.
- [ ] `az account show` returns the project subscription.
- [ ] Total elapsed time recorded — if it exceeded 3 hours, note where, so week 5 estimates can absorb it.

> **Watch for.** This is the single most common solo-dev time sink in the whole project; if it is still unfinished at the end of day 0, stop and reschedule it rather than letting it eat day 1.

---

# Week 1 — Identity, onboarding and pricing

*Days 1–5 · 10 stories · 28.0 hours*

| Story | Day | h | App | Title |
|---|---|---|---|---|
| `S-11` | 1 | 4 | api | Authentication endpoints: register, OTP, login, refresh, sessions |
| `S-12` | 1 | 2.5 | api | Azure Blob upload signing with mandatory EXIF/GPS stripping |
| `S-13` | 2 | 3 | api | Farmer registration: 5-step resumable application and status timeline |
| `S-14` | 2 | 2 | api | Certifications, manual admin verification, and the expiry-block job |
| `S-15` | 3 | 2 | api | Domain event bus and in-app notification centre |
| `S-16` | 3 | 3.5 | admin-web | Admin shell hardening and the farmer applications queue |
| `S-17` | 4 | 3 | api | Fair price ceilings, bulk update, retail price and history |
| `S-18` | 4 | 2.5 | admin-web | Admin screens for fair price, bulk update, retail price and history |
| `S-19` | 5 | 3 | api | Azure staging environment and the GitHub Actions deploy pipeline |
| `S-20` | 5 | 2.5 | api | Week 1 hardening: rate limits, correlation ids, Sentry and a contract test |

## Day 1

### S-11 — Authentication endpoints: register, OTP, login, refresh, sessions

**4h** · `api` · after `S-02`, `S-03` · rules `BR-32`

**Goal.** A working identity surface: a customer can self-register, receive and verify an OTP, log in by password or OTP, rotate a refresh token, reset a password and read GET /auth/me.

**Permissions.** `auth.session.login`, `auth.otp.request`, `auth.password.change_own`, `auth.session.terminate_other`, `customer.self_register`

**Prompt**

```text
Create the auth module with `pnpm new:module auth`, producing apps/api/src/modules/auth/{auth.routes.ts,auth.schema.ts,auth.service.ts,auth.repo.ts,auth.test.ts}. Follow apps/api/src/modules/_example/ exactly — routes wire only, schemas mirror docs/openapi.yaml, service takes a ResolvedScope, repo takes an Executor. Mount at /v1/auth in apps/api/src/app.ts.

Implement the ten operations already specified in docs/openapi.yaml: POST /auth/register/customer, /auth/otp/send, /auth/otp/verify, /auth/login, /auth/refresh, /auth/logout, /auth/forgot-password, /auth/reset-password, POST /auth/sessions/{id}/terminate, GET /auth/me.

Reuse the primitives — do not reimplement them: apps/api/src/auth/jwt.ts (signTokenPair, verifyRefreshToken), apps/api/src/auth/requireAuth.ts, apps/api/src/rbac/requirePermission.ts. Persist to the existing tables users, sessions, refresh_tokens, otp_verifications from db/migrations/0002_identity_and_access.sql; no new migration should be needed.

Write the failing tests first, named `BR-32a: ...` and `BR-32b: ...` from the test contract in docs/rules.md BR-32.

Traps:
- OTP thresholds come from `system_config` (`otp_length`, `otp_resend_seconds`, `otp_max_attempts`, seeded in db/seed/001_reference.sql). apps/api/src/config.ts defaults OTP_MAX_ATTEMPTS=5 and OTP_RESEND_SECONDS=30, which contradict BR-32. rules.md wins; fix the defaults and .env.example and say so.
- Store only a hash of the code (Redis for the live challenge, otp_verifications for the trail). Never log or return the code outside a non-production SMS_PROVIDER=mock path.
- Refresh rotation: mark the presented token `used_at`/`replaced_by` in the same transaction; presenting an already-used token revokes the whole session (theft detection), it does not just 401.
- /auth/forgot-password always answers 202 — no account enumeration. Reset revokes every session.
- terminate is `auth.session.terminate_other` (SUPER_ADMIN only in docs/rbac.json); logout is the actor's own session and is a different path.
- docs/openapi.yaml x-permission values `auth.session.revoke_own` and `auth.me.read` do NOT exist in docs/rbac.json, and its x-business-rules tag these routes BR-19 where rules.md means BR-32. That is a specification gap: fix it per CLAUDE.md §1, add any new permission to docs/rbac.json with grants for all seven roles plus a row in apps/api/src/rbac/rbac.test.ts, and re-run `pnpm rbac:check`.
- OTP_LOCKED and OTP_RESEND_TOO_SOON are named in BR-32 but missing from packages/shared-types/src/errors.ts — add them and to the Problem schema in docs/openapi.yaml.
- Hash passwords with argon2id (or bcrypt cost >= 12); add the dependency to apps/api/package.json.

Report against the Definition of Done in CLAUDE.md §6. If a rule in docs/ is ambiguous or wrong, stop and say so rather than guessing.
```

**Verify**

```bash
pnpm typecheck && pnpm lint
pnpm test -- auth
pnpm rbac:check && pnpm spec:lint
curl -s -X POST localhost:3000/v1/auth/otp/send -H 'content-type: application/json' -d '{"mobile":"+919000000001","purpose":"LOGIN"}' | jq
curl -s -X POST localhost:3000/v1/auth/otp/verify -H 'content-type: application/json' -d '{"challengeId":"<id>","code":"000000"}' -i | head -1   # repeat 4x, 4th must be 429 OTP_LOCKED
curl -s localhost:3000/v1/auth/me -H 'authorization: Bearer <token>' | jq
```

**Done**

- [ ] All ten /auth operations from docs/openapi.yaml exist and match their schemas.
- [ ] Tests named BR-32a and BR-32b exist, and both failed before the implementation.
- [ ] The 4th wrong OTP attempt returns 429 OTP_LOCKED and the challenge stays dead for the correct code.
- [ ] A resend at 59s returns 429 OTP_RESEND_TOO_SOON; at 61s it is accepted.
- [ ] Reusing a rotated refresh token revokes the session, and the test proves it.
- [ ] OTP codes appear nowhere in logs or responses in a production config.
- [ ] Every route's requirePermission code exists in docs/rbac.json and `pnpm rbac:check` passes.
- [ ] Any permission or error code added is listed in the summary as a spec-gap fix.

> **Watch for.** Reading OTP limits from config.ts env defaults (5 attempts / 30s) instead of system_config — the tests pass against the wrong numbers and BR-32 is quietly unenforced.

---

### S-12 — Azure Blob upload signing with mandatory EXIF/GPS stripping

**2.5h** · `api` · after `S-02`, `S-11` · rules `BR-16`

**Goal.** POST /uploads/sign issues a short-lived signed URL behind a storage adapter, and every stored image has its EXIF (including GPS) removed before any client can read it.

**Prompt**

```text
Create apps/api/src/modules/uploads/{uploads.routes.ts,uploads.schema.ts,uploads.service.ts,uploads.repo.ts,uploads.test.ts} following apps/api/src/modules/_example/. Mount at /v1/uploads.

Implement POST /uploads/sign exactly as specified in docs/openapi.yaml: the eight `purpose` values, contentType, sizeBytes (max 26214400), optional fileName; response uploadUrl, fileUrl, method, headers, expiresAt, resumable. Record every signed target as a row in the existing `uploads` table (db/migrations/0008_platform.sql) with storage_key, bucket, mime_type, size_bytes and uploaded_by.

Put the vendor behind one adapter interface at apps/api/src/storage/blobStorage.ts with two implementations: an Azure Blob SAS implementation reading AZURE_STORAGE_CONNECTION_STRING and AZURE_BLOB_CONTAINER from apps/api/src/config.ts, and an in-memory/local implementation used when the connection string is empty so tests and CI stay offline. docs/rules.md contradiction 13 leaves the vendor unconfirmed — the adapter is what keeps that decision cheap; no Azure SDK type may appear in a service or repo signature.

EXIF stripping is the point of this story, not a nicety. docs/rules.md BR-16 and CLAUDE.md §2.5: a produce photo carrying farm GPS is the same breach as printing the farm name. Every image accepted for a customer-visible purpose is re-encoded server-side (sharp, `.rotate()` then re-encode with no metadata), resized to the catalogue and thumbnail sizes, and the original bytes are discarded — not kept 'just in case'. Write the failing test first, named `BR-16: uploaded image has no EXIF or GPS after processing`, using a fixture JPEG that genuinely carries GPS tags, and assert on the parsed metadata of the stored object, not on file size.

Traps: an allow-list of MIME types (image/jpeg, image/png, image/webp, application/pdf), validated against the sniffed bytes and not the client-declared contentType; a SAS with write-only permission and a lifetime of minutes, scoped to one blob path, never a container-wide token; a storage_key derived server-side from a uuid, never from the client fileName (path traversal); PDFs are not re-encoded, so a certificate PDF must never be served on a customer surface.

Chunked resumable upload is explicitly deferred: return `resumable: false` and note the deferral in the summary.

docs/openapi.yaml gives this operation x-permission `upload.sign`, which does not exist in docs/rbac.json. Resolve that gap per CLAUDE.md §1 — add the permission with grants for all seven roles, a row in apps/api/src/rbac/rbac.test.ts, and re-run `pnpm rbac:check`.

Report against the Definition of Done in CLAUDE.md §6. If a rule in docs/ is ambiguous or wrong, stop and say so rather than guessing.
```

**Verify**

```bash
pnpm typecheck && pnpm lint
pnpm test -- uploads
pnpm rbac:check && pnpm spec:lint
curl -s -X POST localhost:3000/v1/uploads/sign -H 'authorization: Bearer <token>' -H 'content-type: application/json' -d '{"purpose":"CERTIFICATE","contentType":"application/pdf","sizeBytes":481203,"fileName":"npop.pdf"}' | jq
exiftool <(curl -s <fileUrl>) | grep -i gps   # expect no output
```

**Done**

- [ ] POST /uploads/sign matches docs/openapi.yaml field for field and writes an `uploads` row.
- [ ] A test named with BR-16 proves a GPS-tagged JPEG comes back with no EXIF and no GPS, and it failed first.
- [ ] Storage sits behind apps/api/src/storage/blobStorage.ts; no @azure/* type leaks into a service or repo signature.
- [ ] MIME type is validated against sniffed bytes, size against the 25 MiB ceiling.
- [ ] The SAS is write-only, single-blob and expires in minutes; storage_key is server-generated.
- [ ] `resumable: false` is returned and the deferral is stated in the summary.
- [ ] `upload.sign` exists in docs/rbac.json with an rbac.test.ts row and rbac:check passes.

> **Watch for.** Stripping EXIF on the client, or only for LISTING_PHOTO — the rule is server-side and applies to every image that can reach a customer surface.

---

## Day 2

### S-13 — Farmer registration: 5-step resumable application and status timeline

**3h** · `api` · after `S-11`, `S-12` · rules `BR-33`, `BR-36`

**Goal.** A farmer can create a draft application, fill its five steps in any order across sessions, attach documents, submit it, and watch a real status timeline.

**Permissions.** `farmer.profile.edit`, `farmer.document.view`

**Prompt**

```text
Create apps/api/src/modules/farmer-applications/ following apps/api/src/modules/_example/, mounted at /v1/farmers/applications and /v1/farmers/me.

Implement the operations in docs/openapi.yaml: POST /farmers/applications (public draft creation), PATCH /farmers/applications/{id}/steps/{step} for steps 1-5 (1 personal, 2 farm details, 3 location, 4 documents, 5 review), POST /farmers/applications/{id}/submit, GET /farmers/applications/{id}/status, GET /farmers/me.

There is no farmer_applications table. db/migrations/0003_farmers_and_farms.sql carries `farmers.application_status` (SUBMITTED, DOCS_REVIEW, FARM_VERIFICATION, AUDIT, APPROVED, REJECTED), farms, plots and farmer_documents, but nothing holds a partially-filled draft or the timeline. Add db/migrations/0009_farmer_applications.sql with an up and a `-- +migrate Down` for the draft (per-step payload plus a completed-steps marker) and an append-only status-history table. Do not edit an existing migration.

Each step validates independently on save; cross-step validation runs at submit. Step 3 takes GPS coordinates with a manual lat/lng fallback when capture fails, and the optional FMB polygon. A farmer may declare multiple farms. Submit requires ID proof and a farm document (farmer_documents.doc_type ID_PROOF and FARM_DOC, is_mandatory true); a certificate is optional here — listings stay blocked by BR-01/BR-02 regardless. Submit issues nothing yet; the TOHFA-F-YYYY-XXXX id in `farmers.tohfa_farmer_id` is allocated at approval, from a per-year sequence, generated inside the transaction so two concurrent approvals cannot collide.

Model the status timeline as an explicit transition table: SUBMITTED→DOCS_REVIEW→FARM_VERIFICATION→AUDIT→APPROVED, with REJECTED reachable from any non-terminal state. Any other move throws AppError INVALID_STATE_TRANSITION. Write that test first.

Traps: mobile and Aadhaar are locked fields (docs/rules.md BR-33) — after approval only SUPER_ADMIN may change them and no response may contain an unmasked Aadhaar; store `aadhaar_last4` plus the token column, never the raw number. Ownership: a farmer reads and writes only their own application (BR-36) — enforce with scopedWhere, and a cross-owner read returns empty, not 403. One non-terminal application per mobile number, enforced by a partial unique index, not by a service-side SELECT-then-INSERT. Documents arrive as fileUrl values produced by POST /uploads/sign; never accept raw bytes here.

docs/openapi.yaml uses x-permission codes `farmer.application.write_own`, `farmer.application.submit_own`, `farmer.application.read_own` and `farmer.profile.read_own`, none of which exist in docs/rbac.json. Close that gap per CLAUDE.md §1 with grants, rbac.test.ts rows and a passing `pnpm rbac:check`.

Report against the Definition of Done in CLAUDE.md §6. If a rule in docs/ is ambiguous or wrong, stop and say so rather than guessing.
```

**Verify**

```bash
pnpm typecheck && pnpm lint
pnpm test -- farmer-applications
pnpm db:reset && pnpm db:migrate
pnpm rbac:check && pnpm spec:lint
curl -s -X POST localhost:3000/v1/farmers/applications -H 'content-type: application/json' -d '{"mobile":"+919812345678","fullName":"Murugan S","preferredLocale":"ta"}' | jq
curl -s localhost:3000/v1/farmers/applications/<id>/status -H 'authorization: Bearer <token>' | jq '.steps'
```

**Done**

- [ ] Migration 0009 exists with a working Down, and `pnpm db:reset` runs clean.
- [ ] All five steps save independently and survive a logout/login; submit runs cross-step validation.
- [ ] Submit is refused without ID proof and a farm document; certificate remains optional.
- [ ] Illegal status transitions throw INVALID_STATE_TRANSITION, proven by a failing-first test.
- [ ] A test named with BR-33 shows mobile/Aadhaar cannot be patched by the farmer and no response carries an unmasked Aadhaar.
- [ ] A test named with BR-36 shows another farmer's application id returns empty, not 403.
- [ ] A second non-terminal application for the same mobile is rejected by a database constraint.
- [ ] TOHFA-F-YYYY-XXXX allocation is transactional and collision-proof under two concurrent approvals.

> **Watch for.** Uniqueness or id allocation implemented as a read-then-write in the service — it passes single-threaded tests and produces duplicate farmer ids the first time two approvals overlap.

---

### S-14 — Certifications, manual admin verification, and the expiry-block job

**2h** · `api` · after `S-12`, `S-13` · rules `BR-01`, `BR-02`, `BR-38`

**Goal.** Certification records exist, only a named human admin can verify one, and farmers.is_market_blocked is recomputed both on write and by a repeatable job.

**Permissions.** `certification.manage_own`, `certification.mark_verified`, `certification.verify_via_portal`, `certification.block_listings`

**Prompt**

```text
Create apps/api/src/modules/certifications/ following apps/api/src/modules/_example/, mounted at /v1/farmers/me/certifications and /v1/admin/certifications.

Implement the docs/openapi.yaml operations: GET and POST /farmers/me/certifications, POST /admin/certifications/{id}/verify, POST /admin/certifications/{id}/unverify. The `certifications` table already exists (db/migrations/0003_farmers_and_farms.sql) with verification_status, verified_by, verified_at and a CHECK enforcing that VERIFIED requires a named actor.

Enforce docs/rules.md BR-01 and BR-02. Write both test contracts first, named `BR-01a`, `BR-01b`, `BR-02a`, `BR-02b`. There is NO automatic or portal-API verification path: `certification.verify_via_portal` describes an admin who checked the issuing body's website by hand and typed the reference in. Any code that infers VERIFIED from a document, a file name or an issuer string violates BR-02.

`farmers.is_market_blocked` is a materialised fail-closed cache and defaults to true. Write one recompute function — 'blocked unless this farmer has at least one VERIFIED certificate whose expires_on is today or later' — and call it from exactly two places: an on-write hook inside the same transaction as any certification insert/verify/unverify, and a repeatable BullMQ job. Never let the two implementations diverge, and always set market_block_reason when blocking (a CHECK constraint enforces it).

Replace the stub `certificate-expiry-sweep` handler in apps/api/src/jobs/worker.ts, keeping its registration in JOB_REGISTRY (apps/api/src/jobs/queue.ts, 02:15 Asia/Kolkata). The job must be idempotent — it will run twice — must write a `job_runs` row with items_scanned/items_processed, and must write an audit row for each transition via writeAuditLog inside the same transaction. docs/rules.md BR-38 permits this job as rule enforcement, not automation; do not add advisory or reminder content to it.

Traps: expiry is a date comparison in Asia/Kolkata, not a UTC timestamp — a certificate expiring 'yesterday' must block from the first minute of today, IST. Unverify must re-block immediately and withdraw listings still pending approval. CERT_EXPIRED and CERT_UNVERIFIED already exist in packages/shared-types/src/errors.ts — use them. openapi's x-permission codes `certification.create_own`, `certification.read_own`, `certification.verify` and `certification.unverify` do not exist in docs/rbac.json; map them onto the real codes (certification.manage_own, certification.mark_verified, certification.block_listings) or add them per CLAUDE.md §1, then run `pnpm rbac:check`.

Report against the Definition of Done in CLAUDE.md §6. If a rule in docs/ is ambiguous or wrong, stop and say so rather than guessing.
```

**Verify**

```bash
pnpm typecheck && pnpm lint
pnpm test -- certifications
pnpm rbac:check && pnpm spec:lint
pnpm dev:worker   # certificate-expiry-sweep registers and runs
psql $DATABASE_URL -c "select tohfa_farmer_id, is_market_blocked, market_block_reason from farmers limit 5;"
psql $DATABASE_URL -c "select job_name, status, items_scanned, items_processed from job_runs order by started_at desc limit 3;"
```

**Done**

- [ ] Tests BR-01a, BR-01b, BR-02a and BR-02b exist and all failed before implementation.
- [ ] A certificate expiring yesterday blocks listing creation with 422 CERT_EXPIRED.
- [ ] An uploaded but unverified certificate blocks with 422 CERT_UNVERIFIED.
- [ ] No code path can set verification_status to VERIFIED without a verified_by user id.
- [ ] is_market_blocked is recomputed by one shared function, called from the write hook and the job.
- [ ] Re-verifying clears the block within one job cycle; unverify re-blocks immediately with a reason.
- [ ] The sweep writes a job_runs row and an audit_log row per transition, and re-running it changes nothing.
- [ ] The job registry still contains only the enforcement jobs (BR-38b).

> **Watch for.** Two copies of the block rule — one in the service and one in the job — that drift, so a farmer's block state depends on which path ran last.

---

## Day 3

### S-15 — Domain event bus and in-app notification centre

**2h** · `api` · after `S-11` · rules `BR-38`

**Goal.** Every golden-thread domain event publishes to one bus and lands as a templated in-app notification, so no later story has to invent its own notification path.

**Permissions.** `notification.own.view`, `notification.template.configure`

**Prompt**

```text
Build the notification backbone now so that stories in weeks 2-5 emit events instead of inventing delivery. Create apps/api/src/events/bus.ts (a typed publish/subscribe registry with one union of event names and payloads, the same shape as JobPayloads in apps/api/src/jobs/queue.ts) and apps/api/src/modules/notifications/ following apps/api/src/modules/_example/, mounted at /v1/notifications.

Implement GET /notifications (paged, unreadOnly filter, unreadCount) and POST /notifications/{id}/read from docs/openapi.yaml. Persist to the existing `notifications` and `notification_templates` tables (db/migrations/0008_platform.sql); channel IN_APP only in this story.

Seed one template per golden-thread event, in both `en` and `ta` (notification_templates has a UNIQUE (code, channel, locale) and the locale CHECK allows only those two), extending db/seed/001_reference.sql: farmer application approved, application rejected, more information requested, counter-offer received, counter-offer expiring in 2 hours, goods received, payout released, order confirmed, order dispatched, order delivered, wallet credited. Bodies are templates with named placeholders — no user-facing English in TypeScript (CLAUDE.md §2.7).

FCM and SMS transports are deliberately NOT in this story. Define the transport interface with in-app as the only registered implementation so adding push later is a registration, not a refactor. State that deferral in your summary.

Traps: publishing must not be able to roll a business transaction back — a notification failure is logged, never thrown into the caller's transaction; publish after commit or via the job queue, and say which you chose and why. Delivery must be idempotent under a replayed event (a dedupe key on the notification row). The in-app centre is per-user: GET /notifications is scoped to req.actor and a foreign notification id returns 404, not another user's row. Notification bodies are subject to docs/rules.md BR-16 — a customer-facing notification may never name a farmer or a farm. docs/openapi.yaml's `notification.read_own` and `notification.write_own` do not exist in docs/rbac.json, which has `notification.own.view` and `notification.template.configure`; resolve per CLAUDE.md §1 and run `pnpm rbac:check`.

Report against the Definition of Done in CLAUDE.md §6. If a rule in docs/ is ambiguous or wrong, stop and say so rather than guessing.
```

**Verify**

```bash
pnpm typecheck && pnpm lint
pnpm test -- notifications
pnpm rbac:check && pnpm spec:lint
pnpm db:reset   # templates seed cleanly in en and ta
curl -s 'localhost:3000/v1/notifications?unreadOnly=true' -H 'authorization: Bearer <token>' | jq '.unreadCount'
curl -s -X POST localhost:3000/v1/notifications/<id>/read -H 'authorization: Bearer <token>' -i | head -1
```

**Done**

- [ ] apps/api/src/events/bus.ts exists with a typed event union and no `any`.
- [ ] GET /notifications and POST /notifications/{id}/read match docs/openapi.yaml.
- [ ] Templates for all eleven golden-thread events are seeded in both en and ta.
- [ ] A subscriber that throws does not roll back or fail the publishing business transaction — proven by a test.
- [ ] Replaying the same event twice produces one notification row.
- [ ] Another user's notification id returns 404.
- [ ] The transport interface exists with in-app registered; the FCM/SMS deferral is stated in the summary.
- [ ] No user-facing English string is hard-coded in TypeScript.

> **Watch for.** A notification write joined into the caller's transaction — the first time the template lookup fails, an approved farmer application silently rolls back.

---

### S-16 — Admin shell hardening and the farmer applications queue

**3.5h** · `admin-web` · after `S-13`, `S-15` · rules `BR-33`, `BR-35`

**Goal.** An admin can log in, see a permission-filtered sidebar, work the farmer application queue and approve, reject with a reason, or request more information.

**Permissions.** `farmer.application.list_pending`, `farmer.application.approve`, `farmer.application.reject`, `farmer.profile.view_all`, `farmer.document.view`

**Prompt**

```text
Two parts, both in apps/admin-web (Angular 17, standalone, no NgModules).

Part 1 — shell hardening. Wire the real login against POST /v1/auth/login, store the token pair, and have core/auth.interceptor.ts attach the bearer token and refresh once on 401 without a request storm. On login, call RbacService.setRoles with the roles from GET /v1/auth/me. Extend NAV in src/app/app.routes.ts with the farmer-applications entry; the sidebar in layout/shell.component.ts already renders from NAV filtered through core/rbac.service.ts — do not hard-code a menu and never write `*ngIf="role === 'SUPER_ADMIN'"`. Add a role-selection step for accounts holding more than one role (the login response sets `requiresRoleSelection` and `availableRoles`).

Part 2 — farmer applications. A list screen built on shared/data-table (filter by status and zone, submitted-after, cursor paging) and a detail screen showing the five steps, the documents from farmer.document.view, the location with its FMB polygon, and the status timeline. Actions: approve, reject-with-reason (reasonCode enum plus free text, both required by docs/openapi.yaml) and request-more-info with a message and the step numbers to redo. Each posts to /v1/admin/farmer-applications/{id}/{approve|reject|request-info} with an Idempotency-Key header and a sticky Cancel/Save footer.

Authorization per docs/rbac.json: `farmer.application.list_pending` is `all` for SUPER_ADMIN and TOHFA_ADMIN, `view` for FARMER_ADMIN, `none` for MAIN_WH_ADMIN and SUB_WH_ADMIN. `farmer.application.reject` is `none` for FARMER_ADMIN. So a Farmer Admin sees the queue with every action button absent, and the two warehouse roles see no nav entry at all. Prove it with a test per role, not by eyeballing one login.

Traps: a client-side guard is a courtesy, not a control — the API refuses the same call independently (apps/admin-web/CLAUDE.md); hiding a button while leaving the route reachable by URL is the bug this story is most likely to ship. No hex colours or spacing literals — read tokens.generated.css custom properties. All strings through the i18n catalogue. Aadhaar is displayed masked (docs/rules.md BR-33); if the API returns an unmasked value, that is an API bug — report it, do not mask it in the component. Approve and reject are audit-logged server-side (BR-35), so a failed call must not leave the row looking approved in the UI.

Report against the Definition of Done in CLAUDE.md §6. If a rule in docs/ is ambiguous or wrong, stop and say so rather than guessing.
```

**Verify**

```bash
pnpm --filter @tohfa/admin-web typecheck
pnpm lint
pnpm --filter @tohfa/admin-web test
pnpm dev   # log in as SUPER_ADMIN, TOHFA_ADMIN, FARMER_ADMIN, SUB_WH_ADMIN in turn
Navigate directly to /farmer-applications as SUB_WH_ADMIN   # expect redirect to /forbidden
```

**Done**

- [ ] Login works against the real API, tokens are stored, and the interceptor refreshes once on 401.
- [ ] The sidebar is rendered from NAV + rbac.service; no role literal appears in a template.
- [ ] Multi-role accounts get a role selector and the chosen role drives the nav.
- [ ] The queue uses shared/data-table with status, zone and submitted-after filters and cursor paging.
- [ ] Approve, reject-with-reason and request-more-info all post with an Idempotency-Key and refresh the row.
- [ ] FARMER_ADMIN sees the queue read-only with no action buttons; warehouse roles have no nav entry and are redirected from the URL.
- [ ] Aadhaar renders masked; no hard-coded colour, spacing or English string.

> **Watch for.** A hidden button treated as the permission — check by typing the route URL directly as a Sub Warehouse Admin and by replaying the approve call with that role's token.

---

## Day 4

### S-17 — Fair price ceilings, bulk update, retail price and history

**3h** · `api` · after `S-11` · rules `BR-07`, `BR-08`, `BR-09`

**Goal.** Ceilings can be set only by a Super Admin, in bulk or singly, with non-overlapping effective windows, a full history, and retail prices that cannot exceed the ceiling.

**Permissions.** `pricing.fair_price.view`, `pricing.fair_price.set`, `pricing.fair_price.bulk_update`, `pricing.retail_price.set`

**Prompt**

```text
Create apps/api/src/modules/pricing/ following apps/api/src/modules/_example/, mounted at /v1/fair-prices and /v1/retail-prices.

Implement the docs/openapi.yaml operations: GET /fair-prices, POST /fair-prices, POST /fair-prices/bulk, GET /fair-prices/history, GET /retail-prices, POST /retail-prices. The `fair_prices` and `retail_prices` tables already exist (db/migrations/0004_produce_pricing_marketing.sql) with effective_from/effective_to, set_by and a UNIQUE (crop_id, grade, effective_from).

Enforce docs/rules.md BR-07, BR-08 and BR-09. Write the tests first, named `BR-07a`, `BR-07b`, `BR-07c`, `BR-08a`, `BR-08b`, `BR-09a`, `BR-09b`.

Authorization is the trap this story exists for. In docs/rbac.json `pricing.fair_price.set` and `pricing.fair_price.bulk_update` are `all` for SUPER_ADMIN and `none` for TOHFA_ADMIN — the operational head explicitly may not set the ceiling. `pricing.retail_price.set` is `all` for both. `pricing.fair_price.view` is `all`/`view` for everyone except CUSTOMER. Never encode this with a role check in a handler; it is a requirePermission code and nothing else. Add the missing rows to apps/api/src/rbac/rbac.test.ts.

BR-08b requires non-overlapping windows per (crop_id, grade) enforced by the DATABASE, not only by the service: add db/migrations/0010_fair_price_no_overlap.sql with an EXCLUDE USING gist constraint over (crop_id WITH =, grade WITH =, daterange(effective_from, effective_to, '[)') WITH &&). Posting a new window closes the open one the day before effective_from, inside the same transaction. Rows are never updated in place — the history endpoint is just a query over the retained rows.

Traps: prices are money — use the Money type from @tohfa/shared-types at every boundary and never a JS float; a ceiling of 100 must reject 100.01 and accept exactly 100.00 (BR-07a/BR-07b). Comparisons use the ceiling in force on the target date, in Asia/Kolkata, not now(). Lowering a ceiling must not retroactively invalidate accepted listings (BR-07c) but must surface the affected active retail rows in the response (BR-09b). Bulk update is all-or-nothing in one transaction, reporting per-index failures in Problem.errors, and takes an Idempotency-Key. Every write goes through writeAuditLog in the same transaction. rules.md BR-09a names error code RETAIL_ABOVE_CEILING while docs/openapi.yaml returns PRICE_ABOVE_CEILING and packages/shared-types/src/errors.ts has only the latter — resolve that conflict explicitly and update whichever file is wrong.

Report against the Definition of Done in CLAUDE.md §6. If a rule in docs/ is ambiguous or wrong, stop and say so rather than guessing.
```

**Verify**

```bash
pnpm typecheck && pnpm lint
pnpm test -- pricing
pnpm db:reset && pnpm rbac:check && pnpm spec:lint
curl -s -X POST localhost:3000/v1/fair-prices -H 'authorization: Bearer <TOHFA_ADMIN token>' -H 'content-type: application/json' -H 'Idempotency-Key: k1' -d '{"cropId":"<uuid>","grade":"GRADE_1","ceilingPrice":"52.00","frequency":"WEEKLY","effectiveFrom":"2026-08-24"}' -i | head -1   # expect 403
psql $DATABASE_URL -c "insert into fair_prices (crop_id, grade, ceiling_price, effective_from, set_by) values ('<uuid>','GRADE_1',50,'2026-08-25','<uuid>');"   # expect an overlap constraint error
```

**Done**

- [ ] All seven BR-named tests exist and failed before implementation.
- [ ] TOHFA_ADMIN receives 403 on both ceiling write endpoints; SUPER_ADMIN succeeds.
- [ ] An overlapping ceiling window is rejected by a database constraint, not only by the service.
- [ ] A retail price above the ceiling returns 422 with the agreed error code and the ceiling in Problem.meta.
- [ ] A ceiling lowered after acceptance leaves accepted listings valid and lists affected retail rows.
- [ ] Bulk update is atomic, idempotent, and reports per-index errors.
- [ ] All prices flow through Money; no float arithmetic anywhere in the module.
- [ ] Every write has an audit_log row in the same transaction.

> **Watch for.** Granting TOHFA_ADMIN the ceiling write because it 'obviously' should have it — BR-08 is the one price control reserved to the Super Admin, and the rbac.test.ts row is what keeps it.

---

### S-18 — Admin screens for fair price, bulk update, retail price and history

**2.5h** · `admin-web` · after `S-16`, `S-17` · rules `BR-08`, `BR-09`

**Goal.** A Super Admin can manage ceilings singly and in bulk and read the price history in the admin console, while every other role sees the same data read-only.

**Permissions.** `pricing.fair_price.view`, `pricing.fair_price.set`, `pricing.fair_price.bulk_update`, `pricing.retail_price.set`

**Prompt**

```text
Build the pricing screens in apps/admin-web (Angular 17, standalone components) against the endpoints delivered for /v1/fair-prices, /v1/fair-prices/bulk, /v1/fair-prices/history and /v1/retail-prices.

Screens:
1. Fair price list — shared/data-table with crop, grade, ceiling, frequency and effective range; filters for crop, grade and effective-on date; an inline 'set new ceiling' form with the sticky Cancel/Save footer.
2. Bulk update — paste or upload rows, client-side preview showing each row's current versus proposed ceiling, then one POST to /fair-prices/bulk. The call is all-or-nothing: render the per-index failures from Problem.errors against the offending rows rather than a single toast.
3. Retail pricing — set a retail price per crop and grade, showing the governing ceiling beside the input; a value above the ceiling is refused by the API with 422 and must surface the returned ceiling from Problem.meta in the field error.
4. Price history — history for a crop+grade over a date range, newest first, using the shared data-table.

Add the NAV entries in src/app/app.routes.ts with the permissions from docs/rbac.json — `pricing.fair_price.view` to reach the screens, `pricing.fair_price.set` and `pricing.fair_price.bulk_update` to render the write affordances, `pricing.retail_price.set` for retail. In docs/rbac.json the two ceiling-write permissions are SUPER_ADMIN-only and `none` for TOHFA_ADMIN, so a TOHFA Admin must see ceilings and retail pricing but no ceiling Save button. Use `can('pricing.fair_price.set')` from core/rbac.service.ts; never a role literal.

Traps: render money as the string the API sends and never parse it into a JS number for arithmetic or rounding; a ceiling of '48.00' shown as 48 in one column and 48.0 in another is how a client loses trust in the screen. Dates are effective dates in Asia/Kolkata, not timestamps — do not let the browser timezone shift effectiveFrom by a day. Idempotency-Key must be generated once per user submit, not per retry. No hex colours or spacing literals — use the custom properties from tokens.generated.css; all labels through the i18n catalogue.

Report against the Definition of Done in CLAUDE.md §6. If a rule in docs/ is ambiguous or wrong, stop and say so rather than guessing.
```

**Verify**

```bash
pnpm --filter @tohfa/admin-web typecheck
pnpm lint
pnpm --filter @tohfa/admin-web test
pnpm dev   # as SUPER_ADMIN: set, bulk-update and view history; as TOHFA_ADMIN: read-only ceilings, retail write allowed
grep -rn '#[0-9a-fA-F]\{6\}' apps/admin-web/src/app   # expect no matches
```

**Done**

- [ ] Four screens exist and are reachable from NAV entries guarded by real rbac.json permission codes.
- [ ] TOHFA_ADMIN sees ceilings and history but no ceiling Save or bulk-update affordance; SUPER_ADMIN sees both.
- [ ] Bulk update renders per-row errors from Problem.errors, not a single failure toast.
- [ ] A retail price above the ceiling shows a field-level error carrying the ceiling from the API response.
- [ ] Money strings are displayed verbatim; no client-side arithmetic on prices.
- [ ] Effective dates round-trip unchanged regardless of browser timezone.
- [ ] No hex colours, spacing literals or hard-coded English strings.

> **Watch for.** Timezone drift on effectiveFrom — a date picker that sends an ISO timestamp makes a Monday ceiling take effect on Sunday for anyone east of UTC.

---

## Day 5

### S-19 — Azure staging environment and the GitHub Actions deploy pipeline

**3h** · `api` · after `S-02`, `S-11`

**Goal.** Every merge to main migrates and deploys the API and worker to a real staging environment at https://api-staging.tohfa.in/v1, so 'done' can mean 'running on staging'.

**Prompt**

```text
Stand up staging on Azure and automate the deploy. The Definition of Done in CLAUDE.md §6 is only checkable against a running environment, so this cannot wait until the end of the build.

Infrastructure, in the resource group from the account provisioning: App Service (Linux, Node 20) for the API; a second App Service or a Web App job running `pnpm dev:worker`'s production equivalent (`node dist/jobs/worker.js`) — the worker is a separate process on purpose (see apps/api/src/jobs/worker.ts); Postgres Flexible Server 16 with the PostGIS extension enabled; Azure Cache for Redis; the Blob container `tohfa-media`; Key Vault holding every secret from .env.example. Wire App Service settings to Key Vault references rather than pasting values. Write the definition as infrastructure-as-code (Bicep or Terraform) under infra/ so the environment is reproducible; a portal-clicked environment is not deliverable.

Pipeline: extend .github/workflows/ci.yml or add .github/workflows/deploy-staging.yml, triggered on push to main and gated on the existing verify job (spec:lint, typecheck, lint, test, migrate, seed, rbac:check, test:e2e). Steps in order: build, run `pnpm db:migrate` against the staging database, then deploy the API and the worker. Migrations run BEFORE the new code goes live and the deploy aborts if they fail. Never run `pnpm db:reset` or the down-migration path against staging.

The API server binds PORT from apps/api/src/config.ts; /healthz and /readyz already exist — use /readyz as the App Service health probe so a deployment with an unreachable database or Redis fails to swing traffic. Set NODE_ENV=production, PAYMENT_PROVIDER and SMS_PROVIDER to the real adapters only if the vendor keys are live, otherwise leave them `mock` and say so.

Traps: staging must have its own JWT_SECRET, its own database and its own Redis — sharing any of them with local development lets a local test invalidate staging sessions or flush staging queues; run db/seed/002_permissions.js on staging so `pnpm rbac:check` passes there too; CORS_ORIGINS must list the staging admin origin, not localhost; App Service default Node may not be 20 — pin it.

Report against the Definition of Done in CLAUDE.md §6. If a rule in docs/ is ambiguous or wrong, stop and say so rather than guessing.
```

**Verify**

```bash
pnpm build
gh workflow run deploy-staging.yml && gh run watch
curl -s https://api-staging.tohfa.in/healthz | jq
curl -s https://api-staging.tohfa.in/readyz | jq   # database and redis true
curl -s -X POST https://api-staging.tohfa.in/v1/auth/otp/send -H 'content-type: application/json' -d '{"mobile":"+919000000001","purpose":"LOGIN"}' -i | head -1
az webapp log tail -n <api-app> -g <rg>
```

**Done**

- [ ] infra/ contains the Bicep or Terraform definition of the whole staging environment.
- [ ] App Service (API), the worker process, Postgres 16 + PostGIS, Redis, Blob and Key Vault all exist and are connected via Key Vault references.
- [ ] A push to main runs verify, then migrations, then deploys API and worker; a failing migration aborts the deploy.
- [ ] /readyz is the App Service health probe and reports database and redis true on staging.
- [ ] Staging has its own JWT_SECRET, database and Redis; no value is shared with local development.
- [ ] Seeds have run on staging and `pnpm rbac:check` passes against the staging database.
- [ ] The repeatable jobs register on the staging worker exactly once.

> **Watch for.** Deploying the code before running the migration — the first request against the new build hits a table that does not exist yet, and the rollback is manual.

---

### S-20 — Week 1 hardening: rate limits, correlation ids, Sentry and a contract test

**2.5h** · `api` · after `S-11`, `S-19` · rules `BR-32`

**Goal.** The auth surface is rate-limited, a single correlation id follows a request from client to log to problem response, errors reach Sentry, and CI fails when a route drifts from docs/openapi.yaml.

**Prompt**

```text
Four hardening tasks on the week-1 surface.

1. Rate limiting. Add a Redis-backed limiter (the shared client is apps/api/src/redis.ts) applied to /v1/auth/otp/send, /auth/otp/verify, /auth/login, /auth/register/customer, /auth/forgot-password and /auth/reset-password. Key by mobile number AND by client IP — an IP-only limit is defeated by a mobile network's NAT, a mobile-only limit lets one host enumerate numbers. On rejection throw AppError producing 429 problem+json with Retry-After, matching the TooManyRequests response already declared in docs/openapi.yaml. Limits are configuration, not literals. This is defence in depth on top of docs/rules.md BR-32, which stays enforced per challenge; write the test named with BR-32 and prove the limiter does not weaken the 3-attempt lockout.

2. Correlation ids end to end. apps/api/src/app.ts already honours an inbound x-correlation-id and echoes it. Extend it so the id flows into every log line (runWithContext), into Problem.traceId, into audit_log rows written by writeAuditLog, and into jobs — enqueue carries the id and the worker re-establishes the context so a job log line can be traced back to the request that queued it.

3. Sentry. Wire SENTRY_DSN from apps/api/src/config.ts (already declared, defaults to empty = disabled). Capture unhandled errors from apps/api/src/http/errorHandler.ts and from the BullMQ worker, tagging release, environment and traceId. Never send request bodies, OTP codes, tokens, Aadhaar values or Money amounts — scrub them explicitly and test the scrubber.

4. Contract test. Add a `test:contract` script that loads docs/openapi.yaml, enumerates the routes the Express app actually registers, and asserts: every implemented route+method exists in the spec, every implemented route's declared x-permission exists in docs/rbac.json, and responses for a sample request validate against the declared schema. Fail on drift. Wire it into .github/workflows/ci.yml after `pnpm lint`. Expect it to fail on first run — most x-permission values in the spec do not exist in rbac.json; fix the ones covering implemented routes and list the remainder as known drift rather than weakening the assertion.

Traps: a limiter in front of requireAuth that counts failed logins per user id it does not know yet; a fixed-window counter that lets a burst through at the boundary — use a sliding window; a Sentry init that swallows the original error and reports a wrapper.

Report against the Definition of Done in CLAUDE.md §6. If a rule in docs/ is ambiguous or wrong, stop and say so rather than guessing.
```

**Verify**

```bash
pnpm typecheck && pnpm lint
pnpm test
pnpm test:contract
for i in $(seq 1 30); do curl -s -o /dev/null -w '%{http_code} ' -X POST localhost:3000/v1/auth/login -H 'content-type: application/json' -d '{"mobile":"+919000000001","password":"wrong-password"}'; done   # trailing 429s
curl -s -D- localhost:3000/v1/auth/me -H 'x-correlation-id: test-123' | grep -i 'x-correlation-id'
psql $DATABASE_URL -c "select action_code, correlation_id from audit_log order by created_at desc limit 5;"
```

**Done**

- [ ] Auth routes are rate-limited by mobile and by IP with a sliding window, limits read from configuration.
- [ ] A 429 returns problem+json with Retry-After and matches the spec's TooManyRequests shape.
- [ ] A test named with BR-32 shows the limiter does not weaken or replace the 3-attempt challenge lockout.
- [ ] One correlation id appears in the response header, every log line, Problem.traceId, the audit_log row and the job log for work that request enqueued.
- [ ] Sentry captures API and worker errors with release, environment and traceId, and the scrubber test proves no token, OTP, Aadhaar or request body is transmitted.
- [ ] `pnpm test:contract` exists, runs in CI after lint, and fails when a route or x-permission drifts.
- [ ] Remaining spec drift is listed explicitly rather than hidden by a weakened assertion.

> **Watch for.** A contract test made to pass by narrowing what it checks — it then certifies a spec/implementation agreement that does not exist.

---

# Week 2 — Trade and supply chain

*Days 6–10 · 10 stories · 30.0 hours*

| Story | Day | h | App | Title |
|---|---|---|---|---|
| `S-21` | 6 | 2.5 | api | Produce listing API: create, edit, withdraw with server-side gates |
| `S-22` | 6 | 4.5 | api | Counter-offer state machine: 24h window, 3 rounds, lapse-on-expiry, self-approval auto-route |
| `S-23` | 7 | 2.5 | admin-web | Admin listings queue and counter-offer UI with server-matched countdowns |
| `S-24` | 7 | 2 | api | Purchase order generation from an accepted listing, idempotent and at the negotiated terms |
| `S-25` | 8 | 4 | api + admin-web | Goods receipt, the 5-point quality check, and the quality counter-offer surface |
| `S-26` | 8 | 3 | api | Batch assignment and the ledger-first stock service layer |
| `S-27` | 9 | 3 | api | Allocation engine: the 70/10/10/10 split with exact rounding |
| `S-28` | 9 | 3 | admin-web | Admin warehouse screens: stock ledger, batch detail, allocation dashboard, low stock |
| `S-29` | 10 | 3.5 | api | Farm-anonymous catalog API over consolidated inventory |
| `S-30` | 10 | 2 | api | Week 2 integration checkpoint: the first half of the golden thread |

## Day 6

### S-21 — Produce listing API: create, edit, withdraw with server-side gates

**2.5h** · `api` · after `S-11` · rules `BR-01`, `BR-02`, `BR-07`, `BR-14`

**Goal.** A farmer can create, edit and withdraw a produce listing over HTTP, with the certificate, price-ceiling and free-tier gates enforced server-side and the certification badges frozen onto the row.

**Permissions.** `listing.create_own`, `listing.view_own`, `listing.update_own`, `listing.withdraw_own`

**Prompt**

```text
Scaffold the module with `pnpm exec tsx scripts/new-module.ts listings`, then implement `apps/api/src/modules/listings/listings.{routes,schema,service,repo,test}.ts`. Copy the structure of `apps/api/src/modules/_example/warehouses.*` exactly — routes wire only, service takes a `ResolvedScope`, repo takes an `Executor`.

Endpoints from `docs/openapi.yaml`: `POST /listings`, `GET /listings`, `PATCH /listings/{id}`, `POST /listings/{id}/withdraw`. The table is `produce_listings` in `db/migrations/0004_produce_pricing_marketing.sql`; read that DDL and its COMMENT blocks before writing SQL. No new migration.

Write the failing tests first, named with the sub-test IDs from the test contracts in `docs/rules.md`: `BR-07a`, `BR-07b`, `BR-07c`, `BR-01a`, `BR-02a`, `BR-14a`, `BR-14b`.

Gates, in the service, in this order:
1. BR-01 and BR-02 — certificate state and `farmers.is_market_blocked`, returning `CERT_EXPIRED` / `CERT_UNVERIFIED`.
2. BR-14 — the free-tier concurrent-listing gate. Read `free_tier_listing_limit` and `free_tier_limits_enabled` from `system_config` (seeded in `db/seed/001_reference.sql`). BR-14b forbids inventing a limit in code: do not hard-code 5, do not enable the flag, and make the gate one named check.
3. BR-07 — asking price at or below the ceiling effective on the submission date; persist the `fair_price_id` it was validated against (BR-07b) so a later ceiling change cannot invalidate the row (BR-07c).

`certification_badges` is jsonb frozen at INSERT and guarded by `trg_produce_listings_freeze_badges`; build it from the farmer's then-verified certificates at create time and never include it in an UPDATE statement or the trigger raises `LISTING_NOT_PENDING`.

Every mutation must pass the `version` it read; a mismatch is a 409, not last-writer-wins. `GET /listings` is own-rows-only via `scopedWhere` and carries a sold/unsold rollup by status, which `docs/openapi.yaml` does not define — add it to the response schema and say you did.

Traps: compare prices as integer paise through `Money` from `@tohfa/shared-types`, never as floats. `docs/rbac.json` defines `listing.create_own` but not `listing.view_own`, `listing.update_own` or `listing.withdraw_own`, which `docs/openapi.yaml` names — that is a specification gap: add them to `docs/rbac.json` (FARMER `own`, every other role `none`), add rows to `apps/api/src/rbac/rbac.test.ts`, run `pnpm rbac:check`. The `x-business-rules` IDs on these operations use a different numbering than `docs/rules.md`; `docs/rules.md` wins — correct the spec and flag it. The REJECT-grade block described in the `POST /listings` text has no rule in `docs/rules.md`; implement it and report the gap.

Report against the Definition of Done in CLAUDE.md §6. If a rule in docs/ is ambiguous or wrong, stop and say so rather than guessing.
```

**Verify**

```bash
pnpm typecheck
pnpm lint
pnpm test -- listings
pnpm rbac:check
pnpm spec:lint
curl -s -X POST localhost:3000/v1/listings -H 'content-type: application/json' -H "authorization: Bearer $FARMER_TOKEN" -d '{"farmId":"...","cropId":"...","grade":"GRADE_1","quantityKg":"250.000","askingPricePerKg":"999.00"}' | jq '.code'
```

**Done**

- [ ] Tests named BR-01a, BR-02a, BR-07a, BR-07b, BR-07c, BR-14a, BR-14b exist and failed before the implementation.
- [ ] A listing priced one paisa above the ceiling returns 422 with code PRICE_ABOVE_CEILING; a listing at exactly the ceiling is accepted and stores fair_price_id.
- [ ] Lowering the ceiling afterwards leaves an accepted listing valid (BR-07c asserted, not assumed).
- [ ] No literal 5 anywhere in the code; grep for free_tier_listing_limit shows it read from system_config, and free_tier_limits_enabled ships false.
- [ ] certification_badges is written only on INSERT; an attempted UPDATE of it is covered by a test asserting BADGES_IMMUTABLE.
- [ ] A stale version on PATCH or withdraw returns 409, proven by a test that reads then writes twice.
- [ ] listing.read_own / listing.update_own / listing.withdraw_own added to docs/rbac.json, mirrored in rbac.test.ts, and pnpm rbac:check passes.
- [ ] The summary summary/rollup addition to GET /listings is reflected in docs/openapi.yaml and called out in the report.

> **Watch for.** Someone hard-coding the free-tier cap at 5 instead of reading the disabled system_config flag — BR-14b explicitly forbids inventing the limit, so a working 5-listing cap is a rule violation, not a feature.

---

### S-22 — Counter-offer state machine: 24h window, 3 rounds, lapse-on-expiry, self-approval auto-route

**4.5h** · `api` · after `S-21` · rules `BR-10`, `BR-11`, `BR-29`

**Goal.** A complete, server-authoritative negotiation state machine over produce listings: admin counters, farmer responds, offers lapse on a 24-hour clock, and a Farmer Admin's own listing is auto-routed to another admin instead of being acted on.

**Permissions.** `listing.counter_offer.send`, `listing.counter_offer.respond`, `listing.approve`, `listing.reject`, `listing.approval.auto_route`

**Prompt**

```text
This is the highest-risk logic in the build. Implement the counter-offer state machine in `apps/api/src/modules/listings/` alongside the existing listings module, following the layering in `apps/api/CLAUDE.md`.

Endpoints from `docs/openapi.yaml`: `POST /admin/listings/{id}/counter-offers`, `POST /listings/{id}/counter-offers/{offerId}/accept`, `/reject`, `/counter`, plus `POST /admin/listings/{id}/approve` and `/reject`. Tables are `counter_offers` and `listing_routing` in `db/migrations/0004_produce_pricing_marketing.sql` — read the long COMMENT on `counter_offers`, it states the intended semantics. No new migration.

Write the failing tests first, named `BR-10a`, `BR-10b`, `BR-11a`, `BR-11b`, `BR-29a`, `BR-29b`, `BR-29c` per the test contracts in `docs/rules.md`.

The window length comes from `system_config.counter_offer_window_hours`, never a literal; `expires_at` is computed server-side at insert. Round 1 is the admin's opening counter and the CHECK allows rounds 1..4; `UNIQUE(listing_id, round)` is what makes a concurrent double-submit impossible — rely on the constraint and translate the conflict, do not pre-check with a SELECT.

On expiry the offer becomes `LAPSED` (the enum value exists for this) and the listing returns to `PENDING_APPROVAL`. It is NOT an acceptance by silence and NOT a rejection by the farmer, and no response body may report it as either. Drive expiry from a BullMQ repeatable job: add `counter-offer-expiry-sweep` to `JOB_REGISTRY` in `apps/api/src/jobs/queue.ts` (the TODO placeholder is already there) and a handler in `apps/api/src/jobs/worker.ts`. The job must be idempotent — it will run twice.

BR-29: `listing.approve`, `listing.reject` and `listing.counter_offer.send` carry the `NOT_OWN_LISTING` predicate whose `onViolation` in `docs/rbac.json` is `auto_route_to_other_admin`. `assertPredicate` in `apps/api/src/rbac/requirePermission.ts` only guarantees the state change cannot happen; routing is your job. In the same transaction as the denial, INSERT a `listing_routing` row with `routed_reason = 'self_approval'`, `attempted_action` set, and a `routed_to_user_id` chosen from another eligible admin — rejecting without routing fails BR-29b.

Use `produce_listings.version` as the optimistic lock on every transition and write `audit_log` inside the same transaction.

Demand an exhaustive transition table test covering: double-accept race on one offer, a response one second after `expires_at`, a 4th farmer counter, admin and farmer acting within the same second, and a caller whose device clock is set forward — the countdown is computed from the server, so a client-supplied timestamp must change nothing.

Error codes come from the `ErrorCode` union in `packages/shared-types/src/errors.ts` — `COUNTER_OFFER_EXPIRED` and `COUNTER_LIMIT_REACHED` here. `pnpm spec:drift` fails the build on an invented code.
Report against the Definition of Done in CLAUDE.md §6. If a rule in docs/ is ambiguous or wrong, stop and say so rather than guessing.
```

**Verify**

```bash
pnpm typecheck
pnpm lint
pnpm test -- listings
pnpm spec:lint
pnpm rbac:check
curl -s -X POST localhost:3000/v1/admin/listings/$LISTING_ID/counter-offers -H "authorization: Bearer $FARMER_ADMIN_OWN_LISTING_TOKEN" -H 'content-type: application/json' -d '{"pricePerKg":"75.00","quantityKg":"75.000"}' | jq '.code'
psql "$DATABASE_URL" -c "select routed_reason, attempted_action, routed_to_user_id from listing_routing order by routed_at desc limit 1;"
```

**Done**

- [ ] Tests named BR-10a, BR-10b, BR-11a, BR-11b, BR-29a, BR-29b, BR-29c exist and failed before the implementation.
- [ ] expires_at is derived from system_config.counter_offer_window_hours; no 24 literal exists in the module.
- [ ] An expired offer ends as LAPSED with the listing back in PENDING_APPROVAL, and a test asserts it is reported as neither accepted nor rejected.
- [ ] The expiry job is registered in JOB_REGISTRY, has a handler in worker.ts, and running it twice over the same offers changes nothing the second time.
- [ ] A 4th farmer counter is refused by the service, and the UNIQUE(listing_id, round) constraint is proven to be the backstop under a concurrent double-submit test.
- [ ] A Farmer Admin acting on their own listing gets 403 SELF_APPROVAL_FORBIDDEN, the listing state is unchanged, and a listing_routing row with routed_reason self_approval names another admin.
- [ ] Approve, reject and counter all return the same denial for the owner (BR-29c), not just approve.
- [ ] Every transition is guarded by produce_listings.version and writes audit_log in the same transaction.
- [ ] The exhaustive transition test covers all five named races, including a forward-set client clock.

> **Watch for.** Auto-routing being reduced to a 403 or to hiding the listing from the owner's queue — BR-29b requires a listing_routing row that puts the listing in a different admin's queue, and a filtered query is not that.

---

## Day 7

### S-23 — Admin listings queue and counter-offer UI with server-matched countdowns

**2.5h** · `admin-web` · after `S-22` · rules `BR-10`, `BR-11`, `BR-29`

**Goal.** The admin console has a working listings approval queue with live 24-hour countdowns, an approve/reject/counter dialog on price and quantity, and visibly routed-away rows for a Farmer Admin's own listings.

**Permissions.** `listing.queue.view_pending`, `listing.approve`, `listing.reject`, `listing.counter_offer.send`

**Prompt**

```text
Build the listings queue screen in `apps/admin-web/src/app/features/listings/` as Angular 17 standalone components. Read `apps/admin-web/CLAUDE.md` first. Register the route and its permission in `apps/admin-web/src/app/app.routes.ts` — the `NAV` array already has a `listings` entry, and the same list drives the sidebar, so add the screen there once rather than hard-coding a menu item.

Data comes from `GET /admin/listings`, `POST /admin/listings/{id}/approve`, `POST /admin/listings/{id}/reject` and `POST /admin/listings/{id}/counter-offers` in `docs/openapi.yaml`. Use `apps/admin-web/src/app/shared/data-table/data-table.component.ts` for the list; if it lacks something, extend the shared component rather than building a second table.

Deliverables:
- Queue table with status, crop, grade, quantity, asking price, round number and a live countdown column.
- A counter-offer dialog that takes BOTH a price and a quantity (`CounterOfferCreate` in the spec has both), plus approve and reject actions with the reason codes the spec enumerates.
- Rows the API marks as routed away from the caller render with no action controls and a visible routed-away indicator.

The countdown is the trap. Never compute it from `Date.now()` against a locally parsed date and let it drift: take `expiresAt` from the API, compute the server-client clock offset once from a server-supplied timestamp, and render the remaining time against the corrected clock. After a page refresh the number must agree with the server. Assume nothing about the browser's timezone; `expiresAt` is UTC.

Second trap: hiding a button is not a permission (root `CLAUDE.md` §2.1). Use `core/rbac.service.ts` `can('listing.approve')` for rendering, and additionally prove with a request that the API refuses an approve on a routed-away listing — record that check in the story report. Never write a role comparison in a template.

Third trap: colours and spacing come from `tokens.generated.css` and `@tohfa/design-tokens`, never hex literals. `apps/admin-web` has no i18n catalogue, unlike the mobile apps; root `CLAUDE.md` §2.7 forbids user-facing English strings in components. Do not scatter literals silently — put the screen's strings in one exported constant and report the missing catalogue as a gap.

Report against the Definition of Done in CLAUDE.md §6. If a rule in docs/ is ambiguous or wrong, stop and say so rather than guessing.
```

**Verify**

```bash
pnpm typecheck
pnpm lint
pnpm --filter @tohfa/admin-web build
pnpm --filter @tohfa/admin-web test
pnpm --filter @tohfa/admin-web start  # then load /listings as a Farmer Admin whose own listing is in the queue
```

**Done**

- [ ] The listings screen is registered once in app.routes.ts NAV and appears in the sidebar only for roles granted listing.queue.view_pending.
- [ ] The countdown for a given offer, after a hard refresh, matches the value derived from the API expiresAt to within a second.
- [ ] The counter-offer dialog posts both pricePerKg and quantityKg and surfaces the server error code when rounds are exhausted or the offer has lapsed.
- [ ] A Farmer Admin's own listing renders with a routed-away indicator and no approve/reject/counter controls.
- [ ] A manual request proving the API also refuses that action is recorded in the report — the UI restriction is not the control.
- [ ] No hex colours, no spacing literals, no *ngIf on a role code anywhere in the feature.
- [ ] Screen strings are centralised and the missing admin-web i18n catalogue is reported as a gap.

> **Watch for.** A countdown driven by the device clock — set the machine's clock forward five hours and the timer must not change, because the deadline is server-computed.

---

### S-24 — Purchase order generation from an accepted listing, idempotent and at the negotiated terms

**2h** · `api` · after `S-22` · rules `BR-10`, `BR-11`, `BR-30`

**Goal.** Accepting a listing, directly or after a counter-offer, produces exactly one purchase order carrying the negotiated price and quantity, with a gap-free PO number series and warehouse-scoped reads.

**Permissions.** `purchase.order.create`, `purchase.order.view`

**Prompt**

```text
Implement the purchase orders module at `apps/api/src/modules/purchase-orders/purchase-orders.{routes,schema,service,repo,test}.ts` (scaffold with `pnpm exec tsx scripts/new-module.ts purchase-orders`, pattern from `apps/api/src/modules/_example/`).

Endpoints from `docs/openapi.yaml`: `GET /admin/purchase-orders` and `GET /admin/purchase-orders/{id}`. PO creation is not its own endpoint — `POST /admin/listings/{id}/approve` returns `{ listing, purchaseOrder }`, so expose creation as a service function the approval path calls inside the SAME transaction as the listing state change and its audit row.

The table is `purchase_orders` in `db/migrations/0005_warehouse_inventory.sql`. Add `db/migrations/0009_purchase_order_uniqueness.sql` (up plus `-- +migrate Down`) with a UNIQUE index on `purchase_orders.listing_id` and a sequence for the PO number series. Never modify a migration that has already run.

Write the failing tests first, named for the rule they defend, including `BR-30a`, `BR-30b` and `BR-30c` from `docs/rules.md`.

The three things that must be exactly right:
1. Exactly one PO per accepted listing, idempotently. The UNIQUE index is the enforcement; the service catches the conflict and returns the existing PO unchanged. A replayed `Idempotency-Key` on the approve call must not create a second PO and must not renumber the first.
2. The PO carries the NEGOTIATED terms. Read `produce_listings.final_price_per_kg` and `final_quantity_kg` when a counter-offer was accepted, and only fall back to the original asking price and quantity when the listing was approved with no negotiation. `total_amount` is computed from those, in integer paise via `Money` from `@tohfa/shared-types` — never a float multiply.
3. The PO number series comes from a database sequence formatted server-side. Never `SELECT count(*) + 1` or `max(po_number)` — two concurrent approvals collide and the UNIQUE constraint on `po_number` surfaces as a 500.

BR-30: `purchase.order.view` grants SUB_WH_ADMIN `own`. Narrow reads with `scopedWhere` on `warehouse_id`. A Sub Warehouse Admin fetching another warehouse's PO by a correctly guessed id gets 404 with an empty body, never 403 — see the comment at the top of `apps/api/src/rbac/requirePermission.ts`.

Specification note to check, not assume: `docs/rbac.json` records both PO permissions as `inferred — matrix has no PO rows; reqs 5.2 module 8`. The Role and Feature Matrix has no purchase-order rows at all, so the grants came from Admin module 8. Judge whether they are defensible here and flag them if not, especially MAIN_WH_ADMIN holding `all` on view. `docs/openapi.yaml` also names `x-permission: purchase_order.read`, absent from rbac.json; rbac.json is ground truth, so use `purchase.order.view` and fix the spec.

Report against the Definition of Done in CLAUDE.md §6. If a rule in docs/ is ambiguous or wrong, stop and say so rather than guessing.
```

**Verify**

```bash
pnpm typecheck
pnpm lint
pnpm test -- purchase-orders
pnpm db:migrate && pnpm db:rollback && pnpm db:migrate
pnpm spec:lint
pnpm rbac:check
psql "$DATABASE_URL" -c "select listing_id, count(*) from purchase_orders group by 1 having count(*) > 1;"  # must return zero rows
```

**Done**

- [ ] Migration 0009 adds a UNIQUE index on purchase_orders.listing_id and a PO-number sequence, and rolls back cleanly.
- [ ] Approving the same listing twice, and replaying the same Idempotency-Key, both return the identical PO id and po_number.
- [ ] A PO raised after an accepted counter-offer carries the counter-offer price and quantity, asserted against the original listing values in a test.
- [ ] total_amount is computed in integer paise through Money; no floating-point multiplication exists in the module.
- [ ] Concurrent approvals of two different listings produce two distinct po_numbers under a concurrency test.
- [ ] A SUB_WH_ADMIN listing POs sees only their own warehouse, and a cross-warehouse fetch by valid id returns 404 with an empty body (BR-30b).
- [ ] The inferred PO permission grants are reviewed against docs/rbac.json and either endorsed or flagged in the report.
- [ ] docs/openapi.yaml x-permission corrected to purchase.order.view and pnpm spec:lint passes.

> **Watch for.** The PO silently carrying the original listing price after a negotiation — check a post-counter-offer PO against the counter-offer row, not against the listing's asking price.

---

## Day 8

### S-25 — Goods receipt, the 5-point quality check, and the quality counter-offer surface

**4h** · `api + admin-web` · after `S-24` · rules `BR-10`, `BR-30`

**Goal.** Warehouse staff can receive goods against a purchase order, record the full 5-point quality check with photos, accept fully or partially or reject with reason codes, counter the farmer on quality, and record disposal of rejected goods — with a working Angular receive-goods flow.

**Permissions.** `inventory.goods_receipt.record`, `inventory.quality_check.perform`, `inventory.produce.reject_incoming`, `inventory.quality.counter_offer`

**Prompt**

```text
Two deliverables: the API module `apps/api/src/modules/goods-receipts/goods-receipts.{routes,schema,service,repo,test}.ts` (scaffold with `pnpm exec tsx scripts/new-module.ts goods-receipts`, pattern from `apps/api/src/modules/_example/`), and the Angular receive-goods flow in `apps/admin-web/src/app/features/goods-receipt/`.

Endpoints from `docs/openapi.yaml`: `POST /admin/goods-receipts`, `POST /admin/goods-receipts/{id}/quality-check`, `POST /admin/goods-receipts/{id}/counter-offer`. Tables `goods_receipts`, `quality_checks` and `quality_check_items` are in `db/migrations/0005_warehouse_inventory.sql`. Add `db/migrations/0010_rejected_goods_disposal.sql` (up plus `-- +migrate Down`) for the rejected-goods disposal record, which no existing table covers — that is a specification gap, so add the table and the matching schema in `docs/openapi.yaml` and call it out.

Write the failing tests first, named `BR-30a`, `BR-30b`, `BR-30c` and `BR-10a` per `docs/rules.md`.

The 5-point check is exactly five rows in `quality_check_items`: APPEARANCE, SIZE_UNIFORMITY, MOISTURE, DAMAGE_PEST, FRESHNESS. `UNIQUE(quality_check_id, parameter)` means the check is complete or it is not; refuse a quality check missing any parameter rather than recording a partial one as a pass. Outcomes are ACCEPTED, PARTIALLY_ACCEPTED and REJECTED; `accepted_qty_kg + rejected_qty_kg` must not exceed `gross_qty_kg` and a non-zero rejection always carries a reason code.

This is the SECOND counter-offer surface: countering the farmer on QUALITY at receipt, against a goods receipt, distinct from the listing price negotiation. It reuses the 24-hour window from `system_config.counter_offer_window_hours` (BR-10) and must not be wired into the listing's round counter.

Photos go through `POST /uploads/sign` with purposes `GRN_PHOTO` and `QC_PHOTO`. Root `CLAUDE.md` §2.5 requires EXIF stripping — a produce photo carrying farm GPS is a farm-anonymity breach; state where stripping happens.

Stop at the recorded quality check. Do NOT INSERT into `inventory_batches` or `stock_ledger` in this story; batch creation and the ledger write belong to the inventory service layer.

The authorization trap: `docs/rbac.json` grants SUB_WH_ADMIN `all` on `inventory.goods_receipt.record`, `inventory.quality_check.perform`, `inventory.produce.reject_incoming` and `inventory.quality.counter_offer`, while BR-30 and the `scopeFilters` entry for SUB_WH_ADMIN say every read AND write by that role is filtered by their assigned `warehouse_id`. Enforce BR-30 from the role-level scope filter using `assignedWarehouseIds` regardless of the permission's scope level, and flag the `all` grant as a probable rbac.json error rather than loosening the behaviour to match it. FARMER_ADMIN is `none` on all four — assert that too.

The Angular flow uses `apps/admin-web/src/app/shared/data-table/data-table.component.ts` and design tokens only; read `apps/admin-web/CLAUDE.md`.

Report against the Definition of Done in CLAUDE.md §6. If a rule in docs/ is ambiguous or wrong, stop and say so rather than guessing.
```

**Verify**

```bash
pnpm typecheck
pnpm lint
pnpm test -- goods-receipts
pnpm db:migrate && pnpm db:rollback && pnpm db:migrate
pnpm spec:lint
pnpm rbac:check
pnpm --filter @tohfa/admin-web build
curl -s -X POST localhost:3000/v1/admin/goods-receipts -H "authorization: Bearer $SUB_WH_OOTY_TOKEN" -H 'content-type: application/json' -d '{"purchaseOrderId":"<coonoor-po>","warehouseId":"<coonoor>","grossQtyKg":"10.000"}' -o /dev/null -w '%{http_code}\n'
```

**Done**

- [ ] Tests named BR-30a, BR-30b, BR-30c and BR-10a exist and failed before the implementation.
- [ ] A quality check missing any of the five parameters is refused; all five rows exist on every recorded check.
- [ ] Accept-full, accept-partial and reject-with-reason paths each have a test, and the qty balance CHECK is exercised.
- [ ] The quality counter-offer is a distinct record from the listing counter-offer and does not consume a listing negotiation round.
- [ ] Its 24-hour expiry reads system_config.counter_offer_window_hours; no literal window exists.
- [ ] Migration 0010 creates the rejected-goods disposal record, rolls back cleanly, and its schema is in docs/openapi.yaml.
- [ ] Photo upload goes through /uploads/sign and the EXIF-stripping point is named in the report.
- [ ] A SUB_WH_ADMIN acting against another warehouse's PO is refused, and the SUB_WH_ADMIN `all` grant is flagged as a suspected rbac.json error.
- [ ] Nothing in this module writes to inventory_batches or stock_ledger.
- [ ] The Angular receive-goods flow builds and uses the shared data table and design tokens.

> **Watch for.** The warehouse scope quietly disappearing because rbac.json grants SUB_WH_ADMIN `all` here — BR-30 still applies, so a Sub Warehouse Admin must not be able to receive against another warehouse's purchase order.

---

### S-26 — Batch assignment and the ledger-first stock service layer

**3h** · `api` · after `S-25` · rules `BR-24`, `BR-37`

**Goal.** An accepted quality check creates an inventory batch with a storage location and a RECEIPT ledger row, and every stock movement in the system goes through a service layer that writes only to the append-only ledger.

**Permissions.** `inventory.batch.assign`, `inventory.stock_ledger.view_all`, `inventory.stock_ledger.view_own`

**Prompt**

```text
Implement the inventory module at `apps/api/src/modules/inventory/inventory.{routes,schema,service,repo,test}.ts` (scaffold with `pnpm exec tsx scripts/new-module.ts inventory`, pattern from `apps/api/src/modules/_example/`).

Endpoints from `docs/openapi.yaml`: `GET /admin/batches`, `GET /admin/batches/{id}`, `GET /admin/stock-ledger`. Batch creation itself happens on quality-check acceptance, so expose it as a service function callable inside the caller's transaction via the `Executor` parameter.

Tables `inventory_batches` and `stock_ledger` are in `db/migrations/0005_warehouse_inventory.sql`. Read the triggers `app_stock_ledger_balance` and `app_stock_ledger_apply` and the table COMMENTs first. No new migration.

Write the failing tests first, named `BR-24a`, `BR-24b`, `BR-37a` and `BR-37b` per the test contracts in `docs/rules.md`.

On quality-check accept: assign a unique `batch_code`, the `storage_location`, the `warehouse_id`, `crop_id`, `grade`, `source_farmer_id` and `goods_receipt_id`, then insert ONE `stock_ledger` row of `movement_type = 'RECEIPT'` for the accepted quantity. That ledger insert is what gives the batch its quantity.

The non-negotiable rule: `inventory_batches.qty_available` is a trigger-maintained cache and `trg_stock_ledger_apply` is its only writer. The service layer must never UPDATE that column, and must never compute `balance_after` itself — the BEFORE-INSERT trigger does it under a row lock so two concurrent movements cannot read the same before-figure. Any code path that writes a balance column directly is a defect even if the number comes out right.

When a movement would push a batch below zero the database raises SQLSTATE 23514 with `HINT: code: INSUFFICIENT_STOCK`. Translate it to `AppError` with the `STOCK_UNAVAILABLE` code from `packages/shared-types/src/errors.ts` — do not add a new code to match the hint text, and do not let a raw pg error reach the error handler as a 500.

BR-24: availability is pooled by warehouse, crop and grade. Two batches of the same crop and grade from different farmers in one warehouse present as ONE availability figure; `source_farmer_id` stays on the batch for traceability but must never scope an availability query.

BR-37: a SUB_WH_ADMIN may create an adjustment for their own warehouse but must not approve one; `inventory.stock_adjustment.approve` is `none` for that role in `docs/rbac.json`. Ledger reads are narrowed with `scopedWhere` on `warehouse_id` (`inventory.stock_ledger.view_own`).

Required test: a property test that applies 200 randomised movements — receipts, sales, adjustments, wastage, reservations and releases, including sequences that would go negative — across several batches, and asserts for EVERY batch that the sum of `qty_delta` in `stock_ledger` equals `inventory_batches.qty_available`, and that every rejected movement left no ledger row behind.

Report against the Definition of Done in CLAUDE.md §6. If a rule in docs/ is ambiguous or wrong, stop and say so rather than guessing.
```

**Verify**

```bash
pnpm typecheck
pnpm lint
pnpm test -- inventory
pnpm spec:lint
grep -rn "qty_available" apps/api/src --include=*.ts | grep -i "update\|set"  # must return nothing
psql "$DATABASE_URL" -c "select b.id, b.qty_available, coalesce(sum(l.qty_delta),0) from inventory_batches b left join stock_ledger l on l.batch_id = b.id group by 1,2 having b.qty_available <> coalesce(sum(l.qty_delta),0);"  # must return zero rows
```

**Done**

- [ ] Tests named BR-24a, BR-24b, BR-37a, BR-37b exist and failed before the implementation.
- [ ] Accepting a quality check yields a batch plus exactly one RECEIPT ledger row, in one transaction with the audit row.
- [ ] No UPDATE of inventory_batches.qty_available exists anywhere in the API source.
- [ ] A movement that would go negative surfaces as AppError STOCK_UNAVAILABLE, not a 500 and not a new error code.
- [ ] Two batches of the same crop/grade from different farmers in one warehouse report a single pooled availability figure (BR-24a).
- [ ] Every ledger row resolves to batch_id and through it to source_farmer_id (BR-24b).
- [ ] A SUB_WH_ADMIN is refused adjustment approval and their ledger reads are warehouse-filtered.
- [ ] The 200-movement property test passes and asserts ledger sum equals cached quantity for every batch.

> **Watch for.** A service that reads qty_available, does arithmetic and writes it back — it will look correct in a single-threaded test and lose stock under concurrency; the ledger insert must be the only write.

---

## Day 9

### S-27 — Allocation engine: the 70/10/10/10 split with exact rounding

**3h** · `api` · after `S-26` · rules `BR-12`, `BR-13`

**Goal.** Every new batch is split across the Online, Live Market, Reserve and Buffer buckets from configuration, summing exactly to the batch quantity, with Super-Admin-only percentage control and a per-produce override.

**Permissions.** `allocation.dashboard.view`, `allocation.channel_percentage.set`, `allocation.per_produce.adjust`

**Prompt**

```text
Implement the allocation engine in `apps/api/src/modules/allocations/allocations.{routes,schema,service,repo,test}.ts` (scaffold with `pnpm exec tsx scripts/new-module.ts allocations`).

Endpoints from `docs/openapi.yaml`: `GET /admin/allocations` and `PATCH /admin/allocation-config`. Allocation on batch intake is a service function called in the same transaction that creates the batch. Tables `allocation_config` and `allocations` are in `db/migrations/0005_warehouse_inventory.sql`; read the deferred constraint trigger `app_allocation_config_sum_guard` and the `allocations` COMMENT first. No new migration for the four-bucket split.

Write the failing tests first, named `BR-12a`, `BR-12b`, `BR-12c`, `BR-13a` and `BR-13b` per the test contracts in `docs/rules.md`.

Read the percentages from the `allocation_config` rows whose `effective_from` window is current — never a constant, never a 70 or a 0.7 anywhere in the code. Seeded values are in `db/seed/001_reference.sql`.

Rounding is the part that goes wrong. The four bucket quantities MUST sum exactly to the batch quantity, carried as `numeric(12,3)`. Floor each bucket to three decimals and put the entire remainder in BUFFER — BR-12a says the remainder lands in Buffer and is never lost. Write a property test over rounding edge cases: even divisions, a 1-milligram remainder, batches so small a 10 percent bucket rounds to zero, very large batches, and percentage sets other than 70/10/10/10 — asserting every time that the four `allocated_qty` values sum exactly to the batch quantity and none is negative.

`allocations.available_qty` is a GENERATED column; never write it. `UNIQUE(batch_id, channel)` makes the split idempotent — allocating a batch twice must not double it.

Only SUPER_ADMIN may change the percentages; TOHFA_ADMIN is `none`. A set summing to 99 or 101 must fail: the deferred constraint trigger raises `HINT: code: ALLOCATION_SUM_INVALID` at COMMIT, so run the update in a transaction and translate that error rather than pre-validating only in Zod. `packages/shared-types/src/errors.ts` has `INSUFFICIENT_ALLOCATION` but neither `ALLOCATION_SUM_INVALID` nor `INSUFFICIENT_ALLOCATION` — reconcile the names once, in `errors.ts` and `docs/openapi.yaml`, and report the drift.

The per-produce override is SUPER_ADMIN and TOHFA_ADMIN. `allocation_config` has no per-produce dimension, so add `db/migrations/0011_allocation_per_produce.sql` (up plus `-- +migrate Down`) with a nullable `crop_id`, `UNIQUE(channel, crop_id, effective_from)`, and the sum guard widened to include `crop_id`. If that changes what BR-12b asserts, stop and say so.

Do NOT implement a B2B or Horeca draw. BR-13 is CONTESTED and Deferred and contradiction 10 in `docs/rules.md` is unresolved. Assert BR-13a and BR-13b instead, and flag the contradiction.

Report against the Definition of Done in CLAUDE.md §6. If a rule in docs/ is ambiguous or wrong, stop and say so rather than guessing.
```

**Verify**

```bash
pnpm typecheck
pnpm lint
pnpm test -- allocations
pnpm db:migrate && pnpm db:rollback && pnpm db:migrate
pnpm spec:lint
pnpm rbac:check
psql "$DATABASE_URL" -c "select b.id, b.qty_received, sum(a.allocated_qty) from inventory_batches b join allocations a on a.batch_id = b.id group by 1,2 having b.qty_received <> sum(a.allocated_qty);"  # must return zero rows
curl -s -X PATCH localhost:3000/v1/admin/allocation-config -H "authorization: Bearer $TOHFA_ADMIN_TOKEN" -H 'content-type: application/json' -d '{"effectiveFrom":"2026-09-01","channels":[{"channel":"ONLINE","percentage":70},{"channel":"LIVE_MARKET","percentage":10},{"channel":"RESERVE","percentage":10},{"channel":"BUFFER","percentage":10}]}' | jq '.status'  # must be 403
```

**Done**

- [ ] Tests named BR-12a, BR-12b, BR-12c, BR-13a, BR-13b exist and failed before the implementation.
- [ ] A 1000 kg batch yields 700/100/100/100 and no percentage literal appears in the module.
- [ ] The rounding property test passes over even splits, 1-milligram remainders, tiny batches, huge batches and non-default percentage sets; buckets always sum to the batch quantity.
- [ ] Allocating the same batch twice is a no-op, enforced by UNIQUE(batch_id, channel).
- [ ] available_qty is never written by application code.
- [ ] A percentage set summing to 99 or 101 is rejected with the sum-guard error translated into a documented code; TOHFA_ADMIN is refused the change entirely.
- [ ] Migration 0011 adds the per-produce override and rolls back cleanly, or the story stops and explains why it cannot.
- [ ] No code path decrements RESERVE or BUFFER for B2B/Horeca; those endpoints return 501 and contradiction 10 is flagged.
- [ ] The ALLOCATION_EXCEEDED / INSUFFICIENT_ALLOCATION / ALLOCATION_SUM_INVALID naming is reconciled in one place and reported.

> **Watch for.** Buckets that sum to slightly less than the batch — round each bucket down and give the whole remainder to BUFFER; a batch with 0.001 kg unallocated is stock that exists physically and nowhere in the system.

---

### S-28 — Admin warehouse screens: stock ledger, batch detail, allocation dashboard, low stock

**3h** · `admin-web` · after `S-26`, `S-27` · rules `BR-12`, `BR-30`, `BR-37`

**Goal.** The admin console has warehouse screens: a filterable stock ledger over 10k-plus rows, batch detail, a four-bucket allocation dashboard and a low-stock indicator, with the warehouse selector locked for a Sub Warehouse Admin including in exports.

**Permissions.** `inventory.stock_ledger.view_all`, `inventory.stock_ledger.view_own`, `allocation.dashboard.view`, `report.export.file`

**Prompt**

```text
Build the warehouse screens in `apps/admin-web/src/app/features/inventory/` as Angular 17 standalone components. Read `apps/admin-web/CLAUDE.md` first. Register each screen and its permission once in the `NAV` array in `apps/admin-web/src/app/app.routes.ts`, which also drives the sidebar.

Screens, backed by `GET /admin/stock-ledger`, `GET /admin/batches`, `GET /admin/batches/{id}` and `GET /admin/allocations` in `docs/openapi.yaml`:
1. Stock ledger table with filters on warehouse, batch, movement type and date range.
2. Batch detail showing the movement history and the batch's derived quantity.
3. Allocation dashboard rendering the four buckets — ONLINE, LIVE_MARKET, RESERVE, BUFFER — with allocated, consumed, reserved and available per bucket.
4. A low-stock indicator.

Use `apps/admin-web/src/app/shared/data-table/data-table.component.ts`; extend the shared component if it lacks a feature rather than writing a second table.

The performance trap: the ledger is append-only and grows without bound. Page with the cursor parameters the spec defines and filter server-side. Never fetch all rows and filter in the browser — with 10k-plus rows that is both a UI freeze and a scope leak, because client-side filtering means the other warehouse's rows were already on the wire.

The scope trap: for a SUB_WH_ADMIN the warehouse selector is locked to their assigned warehouse and this must hold in the EXPORT path too. An export that reuses the table's query but drops the warehouse filter, or that lets the user hand-edit a warehouseId query parameter, is the bug this bullet exists to prevent. Per `apps/admin-web/CLAUDE.md` the filtering is authoritative server-side — so also confirm with a direct request that the API returns an empty result set (not a 403) for another warehouse, and record that check.

The low-stock threshold is a business threshold: read it from the API, never a constant in the component (root `CLAUDE.md` §2.7). If no endpoint exposes it, that is a specification gap — say so rather than inventing a number.

Render the four buckets and every colour from `tokens.generated.css` and `@tohfa/design-tokens`; no hex literals. Use `core/rbac.service.ts` `can(...)` for visibility, never a role comparison in a template. `apps/admin-web` has no i18n catalogue; centralise the screens' strings and report the gap.

Report against the Definition of Done in CLAUDE.md §6. If a rule in docs/ is ambiguous or wrong, stop and say so rather than guessing.
```

**Verify**

```bash
pnpm typecheck
pnpm lint
pnpm --filter @tohfa/admin-web build
pnpm --filter @tohfa/admin-web test
pnpm --filter @tohfa/admin-web start  # load /inventory as a Sub Warehouse Admin for Ooty and attempt a Coonoor filter
curl -s 'localhost:3000/v1/admin/stock-ledger?warehouseId=<coonoor>' -H "authorization: Bearer $SUB_WH_OOTY_TOKEN" | jq '.items | length'  # must be 0, not a 403
```

**Done**

- [ ] Stock ledger, batch detail, allocation dashboard and low-stock indicator all render and are registered once in NAV with permission codes that exist in docs/rbac.json.
- [ ] The ledger table pages and filters server-side using the spec's cursor parameters; no full-table fetch exists in the client.
- [ ] A Sub Warehouse Admin cannot select another warehouse in the UI, and cannot obtain another warehouse's rows by editing the request either.
- [ ] The export path carries the same warehouse scope as the table, verified with an actual export as a Sub Warehouse Admin.
- [ ] The four allocation buckets display allocated, consumed, reserved and available and match the API values.
- [ ] The low-stock threshold comes from the API or is reported as a specification gap; no threshold literal in a component.
- [ ] No hex colours, no spacing literals, no role comparisons in templates; screen strings centralised and the i18n gap reported.

> **Watch for.** The CSV or report export bypassing the warehouse lock — check it as a Sub Warehouse Admin, because the export usually reuses a different query builder than the table.

---

## Day 10

### S-29 — Farm-anonymous catalog API over consolidated inventory

**3.5h** · `api` · after `S-27` · rules `BR-16`, `BR-24`

**Goal.** Customers can browse, search and filter a product catalog built from consolidated warehouse inventory, served through an allow-list serializer that cannot leak farm identity.

**Permissions.** `catalog.browse`, `catalog.farm_identity.view`

**Prompt**

```text
Implement the catalog module at `apps/api/src/modules/catalog/catalog.{routes,schema,service,repo,test}.ts` (scaffold with `pnpm exec tsx scripts/new-module.ts catalog`).

Endpoints from `docs/openapi.yaml`: `GET /catalog/home`, `GET /catalog/categories`, `GET /catalog/products`, `GET /catalog/products/{id}`, `GET /catalog/search`. Filters: category, grade, price and certification badge, plus the sort values the spec enumerates.

Write the failing tests first, named `BR-16a`, `BR-16b`, `BR-16c` and `BR-24a` per the test contracts in `docs/rules.md`.

The source of truth for what is sellable is CONSOLIDATED INVENTORY — the ONLINE allocation bucket over `allocations` joined to `inventory_batches`, pooled by warehouse, crop and grade per BR-24. Never build the catalog from `produce_listings`. A listing is a farmer's offer to TOHFA; a product is TOHFA's offer to a customer, and conflating them is how `farmer_id` reaches the public app. REJECT-grade stock is never sellable.

The serializer is an ALLOW-LIST, not a deny-list (root `CLAUDE.md` §2.5). `docs/openapi.yaml` already defines `Product` with `additionalProperties: false` and exactly ten permitted properties: id, name, categoryId, grade, pricePerKg, availableQty, unit, photos, certificationBadges, warehouseIds. Build the response by naming those ten fields explicitly. Do not spread a row, do not delete keys from a wider object, do not pick by omission — adding a column to an internal model must not be able to widen the response.

Required negative test: walk EVERY customer-facing endpoint response in this module, recursively over the whole JSON tree including nested objects and arrays, and assert a fixed denylist of keys is absent — farmerId, farmer_id, sourceFarmerId, source_farmer_id, farmName, farm_name, farmId, farm_id, village, zoneId, gps, latitude, longitude, fmb, listingId, listing_id, batchId, batchCode. Assert field-by-field, not by eyeballing a payload (BR-16a). Include the case of guessing an internal listing id through a customer-scoped endpoint (BR-16c).

Per `docs/rbac.json`, CUSTOMER holds `catalog.browse` = `all` and `catalog.farm_identity.view` = `none`; the `scopeFilters` entry for CUSTOMER repeats the strip-farm-identity obligation. `docs/openapi.yaml` marks these operations `x-permission: public` with `security: []`, which is not a code in `docs/rbac.json` — decide whether the endpoints are genuinely anonymous or require `catalog.browse`, make the spec and the routes agree, and flag the discrepancy.

Quantities and prices are integer paise via `Money` and `numeric` quantities; no float arithmetic in the availability rollup. Photos served to customers must be EXIF-stripped for the same reason the fields are stripped.

Report against the Definition of Done in CLAUDE.md §6. If a rule in docs/ is ambiguous or wrong, stop and say so rather than guessing.
```

**Verify**

```bash
pnpm typecheck
pnpm lint
pnpm test -- catalog
pnpm spec:lint
pnpm rbac:check
curl -s 'localhost:3000/v1/catalog/products?limit=50' | jq -r '[paths|join(".")] | .[]' | grep -iE 'farm|farmer|village|gps|lat|lon|fmb|batch|listing'  # must return nothing
curl -s localhost:3000/v1/catalog/products/$PRODUCT_ID | jq 'keys'
```

**Done**

- [ ] Tests named BR-16a, BR-16b, BR-16c and BR-24a exist and failed before the implementation.
- [ ] The catalog query reads allocations/inventory_batches, and grep shows produce_listings is never joined in this module.
- [ ] REJECT-grade stock never appears in any catalog response.
- [ ] The serializer names the ten Product fields explicitly; no object spread and no key deletion in the response path.
- [ ] The recursive denylist test walks every endpoint in the module and fails if any farm-identity key appears at any depth.
- [ ] Adding a column to the underlying row does not change the response — proven by a test that adds an extra field to the repo's return value.
- [ ] Two farmers' batches of the same crop and grade in one warehouse appear as one product with a pooled quantity (BR-24a).
- [ ] The x-permission: public versus catalog.browse discrepancy is resolved in docs/openapi.yaml and reported.
- [ ] Customer-served photos are EXIF-stripped and the stripping point is named.

> **Watch for.** A serializer that builds the response by deleting sensitive keys from a database row — the moment a new column lands it ships to customers; the ten fields must be named positively.

---

### S-30 — Week 2 integration checkpoint: the first half of the golden thread

**2h** · `api` · after `S-21`, `S-22`, `S-23`, `S-24`, `S-25`, `S-26`, `S-27`, `S-28`, `S-29` · rules `BR-01`, `BR-02`, `BR-07`, `BR-10`, `BR-11`, `BR-12`, `BR-16`, `BR-24`, `BR-29`, `BR-30`, `BR-37`

**Goal.** One automated test drives the whole supply chain from a clean database — farmer lists, admin counters, farmer accepts, PO, goods receipt and quality check, batch, ledger, allocation — asserting each business rule along the way.

**Permissions.** `listing.create_own`, `listing.counter_offer.send`, `listing.counter_offer.respond`, `listing.approve`, `purchase.order.create`, `inventory.goods_receipt.record`, `inventory.quality_check.perform`, `inventory.batch.assign`, `allocation.dashboard.view`, `catalog.browse`

**Prompt**

```text
Write the Week 2 integration checkpoint at `apps/api/src/modules/marketplace/golden-thread.e2e.test.ts`. The `*.e2e.test.ts` suffix matters: `pnpm test` excludes it, `pnpm test:e2e` runs it. Follow `apps/api/src/app.e2e.test.ts`, driving the real Express app through supertest.

Start from a clean database (`pnpm db:reset`). Build only the actors the thread needs using `apps/api/src/test/factories.ts` and `signAccessToken` from `apps/api/src/auth/jwt.ts`.

The thread, in order, each step a real HTTP request with the correct role's token:
1. Farmer creates a listing at or below the ceiling — assert `BR-07`, plus `BR-01` and `BR-02` on a blocked farmer.
2. A Farmer Admin who owns the listing attempts to counter it — assert `BR-29`: 403, listing state unchanged, and a `listing_routing` row naming another admin.
3. Another admin counters on price and quantity — assert `BR-10` (`expires_at` from `system_config`, server clock) and `BR-11` (round cap).
4. The farmer counters back, then accepts; assert the negotiated terms persist.
5. Approval raises exactly one purchase order at the NEGOTIATED price and quantity; a replay creates no second PO.
6. Goods receipt against that PO, then the five-parameter quality check with a partial acceptance — assert `BR-30` by repeating the receipt as a Sub Warehouse Admin of another warehouse and getting an empty result, not a 403.
7. Batch assignment writes ONE RECEIPT row to `stock_ledger`; assert `BR-24` (pooled across two farmers) and `BR-37` (`qty_available` equals the ledger sum, never written directly).
8. Allocation splits the batch — assert `BR-12`: buckets sum exactly to the batch quantity from `allocation_config`.
9. The product appears in the customer catalog — assert `BR-16` by walking the response for farm-identity keys.

Name every assertion with its rule ID, e.g. `it('BR-12a: 1000 kg allocates 700/100/100/100')`.

Traps. Do not sleep for the 24-hour window: inject a clock so expiry runs in milliseconds, and assert the countdown is server-computed, not client-supplied. Do not soft-skip into a false green — if `DATABASE_URL` is set the test must run and fail loudly, and any skip must be visible. Do not leave state between steps that makes a rerun pass for the wrong reason: this must be green twice from clean.

If a step cannot be made green, leave it failing and say why. A weakened assertion reports a supply chain that does not exist, and Week 3 is built on it.

Report against the Definition of Done in CLAUDE.md §6. If a rule in docs/ is ambiguous or wrong, stop and say so rather than guessing.
```

**Verify**

```bash
pnpm db:reset
pnpm typecheck
pnpm lint
pnpm test
pnpm test:e2e
pnpm db:reset && pnpm test:e2e  # must be green twice from clean
pnpm rbac:check
pnpm spec:lint
```

**Done**

- [ ] golden-thread.e2e.test.ts drives listing, counter-offer, acceptance, PO, GRN, QC, batch, ledger, allocation and catalog as real HTTP requests.
- [ ] Every assertion is named with its BR ID; BR-01, BR-02, BR-07, BR-10, BR-11, BR-12, BR-16, BR-24, BR-29, BR-30 and BR-37 all appear.
- [ ] The run starts from pnpm db:reset and is green twice in a row without manual cleanup.
- [ ] The 24-hour expiry is exercised through an injected clock, not a sleep, and the countdown is proven server-computed.
- [ ] The Farmer Admin self-approval step asserts both the 403 and the listing_routing row.
- [ ] Exactly one purchase order exists for the accepted listing, at the negotiated price and quantity.
- [ ] Ledger sum equals inventory_batches.qty_available for every batch created by the thread.
- [ ] The four allocation buckets sum exactly to the batch quantity.
- [ ] The catalog response contains no farm-identity key at any depth.
- [ ] If DATABASE_URL is set the suite runs; any skip is loud and explained.

> **Watch for.** A checkpoint that passes because a step was stubbed or an assertion softened — read each `it` block and confirm it actually asserts the rule named in its title against real response data, not against a fixture the test itself constructed.

---

# Week 3 — Money, orders, and shipping Track 1

*Days 11–15 · 10 stories · 31.5 hours*

| Story | Day | h | App | Title |
|---|---|---|---|---|
| `S-31` | 11 | 3.5 | api | Wallet ledger service: append-only movements, idempotency, Money |
| `S-32` | 11 | 3 | api | Payment gateway adapter, mock provider, and Razorpay wallet top-up |
| `S-33` | 12 | 2.5 | api + admin-web | Admin cash top-up: fiscal tag, Rs 10,000 cap, daily reconciliation |
| `S-34` | 12 | 2.5 | api | Cart with the 24-hour reservation lock against the Online bucket |
| `S-35` | 13 | 3 | api | Wallet-first checkout and atomic order creation |
| `S-36` | 13 | 3.5 | api + admin-web | Order lifecycle, warehouse fulfilment, SSE tracking and the 4-digit handover OTP |
| `S-37` | 14 | 4 | api + admin-web | Farmer payout dues, dual approval, and the payout approval console |
| `S-38` | 14 | 2.5 | api | Server-side invoice PDFs with GST, Tamil-ready fonts and expiring download URLs |
| `S-39` | 15 | 4 | api | The golden-thread end-to-end test, RBAC matrix conformance and the anonymity leak test |
| `S-40` | 15 | 3 | api + ops | Ship Track 1: demo dataset, demo script, production hardening and a timed rollback |

## Day 11

### S-31 — Wallet ledger service: append-only movements, idempotency, Money

**3.5h** · `api` · after `S-11` · rules `BR-17`, `BR-35`

**Goal.** One wallet module that every other money story calls to move paise, with the ledger as the only writer of a balance and a proven idempotency guarantee.

**Permissions.** `wallet.own.view`, `wallet.manual_credit_debit`

**Prompt**

```text
Build the wallet ledger service — the single money-movement primitive for BOTH farmer and customer wallets.

Create `apps/api/src/modules/wallet/wallet.{routes,schema,service,repo,test}.ts` with `pnpm exec tsx scripts/new-module.ts wallet`, or by copying `apps/api/src/modules/_example/`. Mount at `/v1/wallets`. Implement `GET /v1/wallets/me` and `GET /v1/wallets/me/transactions` from `docs/openapi.yaml`, plus an exported `walletService.move(scope, input, tx)` that other modules call INSIDE their own transaction — it takes an `Executor` from `apps/api/src/db/pool.ts` and never opens its own.

Write the failing tests first, named `BR-17b:` and `BR-35:`.

Rules: `docs/rules.md` BR-17 and BR-35. Permissions from `docs/rbac.json`: `wallet.own.view` (FARMER own, CUSTOMER own) and `wallet.manual_credit_debit`. `docs/openapi.yaml` carries `x-permission: wallet.read_own` and `wallet.transactions.read_own`, which do not exist in `docs/rbac.json`; per CLAUDE.md §1 rbac.json wins — wire the rbac.json codes, correct `x-permission` and the stale `x-business-rules` numbers in the spec, and report the correction.

Mechanics per `db/migrations/0007_money.sql`: INSERT into `wallet_transactions` only. `trg_wallet_txn_balance` computes `balance_after` under `SELECT ... FOR UPDATE` and `trg_wallet_txn_apply` maintains `wallets.balance`. Never write `wallets.balance`, `wallets.version` or `wallets.updated_at` yourself. Types are the `wallet_txn_type` enum: TOPUP_CASH, TOPUP_DIGITAL, ORDER_DEBIT, ORDER_REFUND, PAYOUT_DEBIT, SALE_CREDIT, SUBSCRIPTION_DEBIT, ADJUSTMENT. `amount` is always positive and `direction` carries the sign.

Traps:
1. On overdraw the database raises SQLSTATE 23514 with `HINT: code: WALLET_INSUFFICIENT`, and on a frozen wallet `code: WALLET_NOT_ACTIVE`. Catch and translate to `WALLET_INSUFFICIENT` from `packages/shared-types/src/errors.ts`. Do not pre-read the balance and branch on it in application code — that is the race this design exists to remove.
2. `wallet_transactions.idempotency_key` is UNIQUE NOT NULL. On a 23505 against that constraint, re-read the existing row and return it as the successful result. `IDEMPOTENCY_KEY_REUSED` is only for the same key presented with a different wallet or amount.
3. Money is `Money` from `@tohfa/shared-types`: `fromDbNumeric` in, `toDbNumeric` out, `add`/`subtract`/`sum` for arithmetic. A `parseFloat`, a `Number()` on a NUMERIC column, or a `* 100` anywhere in this module is a defect.

The transaction list takes `tab=all|credits|debits|refunds` (refunds = `type = 'ORDER_REFUND'`), cursor-paginated newest first.

Required tests: `BR-35: ledger sum equals cached balance` — 500 randomised credits and debits across several wallets against a real database, asserting for every wallet that the signed ledger sum equals `wallets.balance`. `BR-17b: one idempotency key moves money once` — replay one key from concurrent connections and assert exactly one `wallet_transactions` row and one balance change.

Report against the Definition of Done in CLAUDE.md §6. If a rule in docs/ is ambiguous or wrong, stop and say so rather than guessing.
```

**Verify**

```bash
pnpm typecheck
pnpm lint
pnpm test -- wallet
pnpm spec:lint
pnpm rbac:check
psql "$DATABASE_URL" -c "UPDATE wallets SET balance = balance + 1;" || echo 'blocked as expected'
curl -s localhost:3000/v1/wallets/me -H "authorization: Bearer $CUSTOMER_TOKEN" | jq
```

**Done**

- [ ] `apps/api/src/modules/wallet/` has all five files and follows the `_example` layering.
- [ ] `GET /v1/wallets/me` and `GET /v1/wallets/me/transactions` return the openapi shapes.
- [ ] grep shows no `UPDATE wallets SET balance` and no `parseFloat`/`Number(` on a money column anywhere in the module.
- [ ] `BR-35:` invariant test runs 500 randomised operations and asserts ledger sum equals cached balance for every wallet.
- [ ] `BR-17b:` concurrent-replay test proves one idempotency key produces exactly one ledger row.
- [ ] Overdraw returns problem+json with `code: INSUFFICIENT_WALLET_BALANCE`, not a raw 500.
- [ ] `docs/openapi.yaml` x-permission values for the wallet operations now exist in `docs/rbac.json`, and the change is called out in the summary.

> **Watch for.** The idempotency conflict path: an agent will typically throw IDEMPOTENCY_KEY_REUSED on any unique violation instead of re-reading and returning the original transaction, which turns a safe retry into a client-visible error.

---

### S-32 — Payment gateway adapter, mock provider, and Razorpay wallet top-up

**3h** · `api` · after `S-31` · rules `BR-17`

**Goal.** A PaymentGateway interface with a deterministic mock plus a signature-verified Razorpay implementation, so digital top-ups credit the wallet exactly once and nothing downstream blocks on KYC.

**Permissions.** `wallet.topup.digital`, `payment.method.configure`

**Prompt**

```text
Build the payment gateway abstraction and the Razorpay digital wallet top-up.

COMMIT THE INTERFACE AND MOCK FIRST, in their own commit, so no later story blocks on Razorpay KYC. Create `apps/api/src/payments/gateway.ts` (the `PaymentGateway` interface: `createOrder`, `verifyWebhookSignature`, `parseEvent`), `apps/api/src/payments/mock.gateway.ts`, `apps/api/src/payments/razorpay.gateway.ts` and `apps/api/src/payments/index.ts` which selects the implementation from `config.PAYMENT_PROVIDER` — already declared in `apps/api/src/config.ts` as `z.enum(['mock','razorpay'])` and in `.env.example`. Switching to live must be exactly one env var. No `razorpay` import may appear outside `razorpay.gateway.ts`.

Then the module `apps/api/src/modules/topup/topup.{routes,schema,service,repo,test}.ts` implementing `POST /v1/wallets/me/topups` and `POST /v1/webhooks/razorpay` from `docs/openapi.yaml`.

Write the failing tests first, named `BR-17b:`.

Rules: `docs/rules.md` BR-17. Permission `wallet.topup.digital` (CUSTOMER own) from `docs/rbac.json`; the spec's `x-permission: wallet.topup_own` does not exist there — use the rbac.json code and fix the spec. The webhook is unauthenticated (`security: []`) and authenticated by HMAC instead.

Flow: create a `payments` row (status CREATED) and a `topups` row (channel UPI/CARD/NETBANKING, status PENDING) and return the checkout handoff. Do NOT credit here. Credit on the signed `payment.captured` webhook by calling `walletService.move` with type `TOPUP_DIGITAL`, then set `payments.status='CAPTURED'`, `topups.status='SUCCESS'` and `topups.wallet_txn_id` — all in one `withTransaction`. `payments.gateway_payment_id` is UNIQUE; that plus the ledger `idempotency_key` derived from the gateway payment id is the reconciliation record.

Traps:
1. `apps/api/src/app.ts` installs `express.json()` globally. HMAC verification needs the EXACT raw bytes — mount `express.raw({ type: 'application/json' })` for the webhook path before the global JSON parser, and verify against `config.RAZORPAY_WEBHOOK_SECRET` with `crypto.timingSafeEqual`. Comparing with `===` on a re-serialised body is the classic way this check silently passes everything.
2. Duplicate webhook delivery must credit once. Deduplicate on `X-Razorpay-Event-Id` and let the UNIQUE `wallet_transactions.idempotency_key` be the backstop; respond 200 with `duplicate: true`.
3. A forged or absent signature returns 401 and writes nothing.
4. A payment captured while the app is closed must still credit — the webhook is the source of truth, never a client callback. Add a poll/reconcile path that fetches gateway status for PENDING topups older than N minutes.
5. Amounts: Razorpay speaks integer paise. Convert with `toPaise`/`fromPaise` from `@tohfa/shared-types`. Never `amount * 100`.

Preset chips Rs 500 / 1000 / 2000 / 5000 plus a custom amount belong in the response schema as `presetAmounts`, sourced from `system_config`, not hard-coded in a client.

Report against the Definition of Done in CLAUDE.md §6. If a rule in docs/ is ambiguous or wrong, stop and say so rather than guessing.
```

**Verify**

```bash
pnpm typecheck
pnpm lint
pnpm test -- topup
pnpm test -- payments
pnpm spec:lint
grep -rn "require('razorpay')\|from 'razorpay'" apps/api/src --include=*.ts | grep -v razorpay.gateway.ts
curl -s -X POST localhost:3000/v1/webhooks/razorpay -H 'x-razorpay-signature: forged' -H 'x-razorpay-event-id: evt_1' -H 'content-type: application/json' -d '{"event":"payment.captured","payload":{}}' -i | head -1
```

**Done**

- [ ] `PaymentGateway` interface + mock committed before the Razorpay implementation.
- [ ] `PAYMENT_PROVIDER=mock` runs the whole suite offline; no Razorpay SDK import outside `razorpay.gateway.ts`.
- [ ] Webhook route reads the raw body and verifies the HMAC with `timingSafeEqual`; a forged signature is 401 with no DB write.
- [ ] Replaying the same `X-Razorpay-Event-Id` returns 200 `duplicate: true` and the wallet balance is unchanged.
- [ ] A captured payment produces exactly one `wallet_transactions` row of type `TOPUP_DIGITAL` and one `payments` row with `gateway_payment_id` set.
- [ ] Reconciliation path exists for topups left PENDING (app closed during payment).
- [ ] Preset chip amounts come from `system_config`, not a constant.

> **Watch for.** Raw-body handling for the webhook — if the global `express.json()` in app.ts parses first, the HMAC is computed over a re-serialised body and signature verification becomes decorative while still appearing to pass its happy-path test.

---

## Day 12

### S-33 — Admin cash top-up: fiscal tag, Rs 10,000 cap, daily reconciliation

**2.5h** · `api + admin-web` · after `S-31` · rules `BR-18`, `BR-19`

**Goal.** A warehouse admin can convert physical cash into wallet balance with an accountable, capped, reconciled, audit-logged server-side credit — and the customer is told.

**Permissions.** `wallet.cash_topup.process`, `wallet.cash_topup.fiscal_tag`

**Prompt**

```text
Implement the admin cash top-up.

Endpoint: `POST /v1/admin/wallets/{customerId}/cash-topup` from `docs/openapi.yaml`. Extend `apps/api/src/modules/topup/` (or create it following `apps/api/src/modules/_example/`).

Write the failing tests first, named `BR-18a:`, `BR-18b:`, `BR-18c:`, `BR-19a:`, `BR-19b:`.

Rules: `docs/rules.md` BR-18 and BR-19. Permissions from `docs/rbac.json`: `wallet.cash_topup.process` and `wallet.cash_topup.fiscal_tag` — SUPER_ADMIN, TOHFA_ADMIN, MAIN_WH_ADMIN and SUB_WH_ADMIN all `all`; FARMER_ADMIN is `none`. Add matching rows to `apps/api/src/rbac/rbac.test.ts`. The spec's `x-permission: wallet.cash_topup` does not exist in `docs/rbac.json`; use the rbac.json codes and fix the spec.

Behaviour: validate the fiscal cash tag is present when `channel = 'CASH'`, insert the `topups` row (`fiscal_cash_tag`, `warehouse_id`, `processed_by`), call `walletService.move` with type `TOPUP_CASH`, link `topups.wallet_txn_id`, and write the `audit_log` row with the SAME transaction client per `apps/api/CLAUDE.md`. Then queue the customer notification.

Read the cap from `system_config` key `cash_topup_cap` via a config accessor, never a constant in the service — CLAUDE.md §2.7. Note that `db/migrations/0007_money.sql` ALSO enforces `topups_cash_cap_chk` at 10000.00; if the config value and the CHECK ever disagree the DB wins, so surface that as a startup or test assertion rather than letting them drift silently.

Traps:
1. `docs/rules.md` BR-18a names error code `FISCAL_TAG_REQUIRED` and BR-19a names `CASH_LIMIT_EXCEEDED`, but `packages/shared-types/src/errors.ts` has neither `FISCAL_TAG_REQUIRED` nor `CASH_LIMIT_EXCEEDED` — it has `CASH_LIMIT_EXCEEDED`, which is what `docs/openapi.yaml` returns. This is a specification gap: add `FISCAL_TAG_REQUIRED` to `errors.ts` and to the `Problem` schema description in `docs/openapi.yaml`, use `CASH_LIMIT_EXCEEDED` for the cap, and report the naming divergence instead of quietly picking one.
2. The boundary is `> 10000`. Rs 10,000.00 exactly is ACCEPTED; Rs 10,000.01 is rejected; two consecutive Rs 10,000 top-ups both succeed because no daily cap exists and BR-19 forbids inventing one.
3. BR-18c: an SMS or notification failure must NOT roll back a completed credit. Record the outcome in `topups.sms_sent_at` / `topups.sms_error` outside the credit transaction.
4. `uq_topups_fiscal_cash_tag` means the same physical receipt cannot fund two credits — translate that conflict into a clear 409, not a 500.

Add the daily cash reconciliation job: a new entry in `JOB_REGISTRY` in `apps/api/src/jobs/queue.ts` plus a handler in `apps/api/src/jobs/worker.ts`, summing yesterday's CASH topups per warehouse against the ledger. It must be idempotent — it will run twice.

Angular: `apps/admin-web/src/app/features/wallet/cash-topup.component.ts`, standalone, gated with `core/permission.guard.ts` on `wallet.cash_topup.process`, colours from `tokens.generated.css`, strings from the i18n catalogue, sticky Cancel/Save footer.

Report against the Definition of Done in CLAUDE.md §6. If a rule in docs/ is ambiguous or wrong, stop and say so rather than guessing.
```

**Verify**

```bash
pnpm typecheck
pnpm lint
pnpm test -- topup
pnpm test -- rbac
pnpm rbac:check
pnpm spec:lint
curl -s -X POST localhost:3000/v1/admin/wallets/$CUSTOMER_ID/cash-topup -H "authorization: Bearer $SW_TOKEN" -H 'idempotency-key: k1' -H 'content-type: application/json' -d '{"amount":"10000.01","warehouseId":"'$WH_ID'","fiscalCashTag":"OOTY-2026-08-18-0042"}' | jq .code
curl -s -X POST localhost:3000/v1/admin/wallets/$CUSTOMER_ID/cash-topup -H "authorization: Bearer $FA_TOKEN" -H 'idempotency-key: k2' -H 'content-type: application/json' -d '{"amount":"100.00"}' -i | head -1
```

**Done**

- [ ] Missing fiscal cash tag on a CASH top-up returns 422 `FISCAL_TAG_REQUIRED`; no `wallet_transactions` row is written.
- [ ] Rs 10,000.00 accepted, Rs 10,000.01 returns `CASH_TOPUP_CAP_EXCEEDED`, two consecutive Rs 10,000 top-ups both accepted.
- [ ] The cap is read from `system_config.cash_topup_cap`; grep finds no `10000` literal in the service.
- [ ] `topups.warehouse_id` and `topups.processed_by` are populated on every cash credit.
- [ ] Notification failure leaves the credit intact and records `topups.sms_error`.
- [ ] FARMER_ADMIN gets 403; SA/TA/MW/SW succeed; `rbac.test.ts` has rows for both permission codes.
- [ ] `audit_log` row written in the same transaction as the credit.
- [ ] Daily cash reconciliation job registered in `JOB_REGISTRY` and proven idempotent by running it twice in a test.
- [ ] Angular cash top-up screen renders behind `permission.guard` with no hard-coded colours or strings.

> **Watch for.** Threshold sourcing and the boundary: an agent will hard-code `10000` and use `>=` instead of reading `system_config.cash_topup_cap` and rejecting only strictly above, which silently breaks BR-19b's 'Rs 10,000 exactly is accepted'.

---

### S-34 — Cart with the 24-hour reservation lock against the Online bucket

**2.5h** · `api` · after `S-30` · rules `BR-22`, `BR-12`

**Goal.** A customer cart that reserves real stock from the Online allocation bucket for 24 hours, releases it on a worker job, and cannot oversell under concurrency.

**Permissions.** `cart.manage_own`

**Prompt**

```text
Implement the cart with the 24-hour reservation lock.

Create `apps/api/src/modules/cart/cart.{routes,schema,service,repo,test}.ts` following `apps/api/src/modules/_example/`, implementing `GET`/`PUT`/`DELETE /v1/cart` and `POST /v1/cart/items` from `docs/openapi.yaml`.

Write the failing tests first, named `BR-22a:` and `BR-22b:`.

Rules: `docs/rules.md` BR-22 (and BR-12 for the bucket). Permission `cart.manage_own` from `docs/rbac.json` — CUSTOMER `own`, every other role `none`. The spec's `cart.read_own` / `cart.write_own` are absent from rbac.json, and its `x-business-rules: [BR-13]` is a stale numbering — the cart lock is BR-22. Use `cart.manage_own`, fix both in the spec, report.

Mechanics per `db/migrations/0006_customers_orders.sql` and `db/migrations/0005_warehouse_inventory.sql`: adding a line INSERTs into `cart_items` (status HELD, `allocation_id`, `reserved_until`) and increments `allocations.reserved_qty` for the ONLINE channel row. `allocations.available_qty` is a GENERATED column (`allocated_qty - consumed_qty - reserved_qty`) and `allocations_not_oversold_chk` enforces `consumed_qty + reserved_qty <= allocated_qty`. `carts.locked_until = locked_at + system_config.cart_lock_hours` — read the hours from config, never a `24` literal. `uq_carts_active_per_customer` allows one ACTIVE/LOCKED cart per customer; `cart_items_unique (cart_id, crop_id, grade)` means a repeat add is an increment, not a second row.

Traps:
1. Concurrency. Two customers racing for the last 5 kg: exactly one succeeds, the other gets 409 `STOCK_UNAVAILABLE`, and NEVER both. Take `SELECT ... FROM allocations WHERE id = $1 FOR UPDATE` inside the transaction, or let `allocations_not_oversold_chk` raise 23514 and translate it — but do not read `available_qty`, decide in JavaScript, then write. Write a test that actually races: open N real connections, fire them with `Promise.all`, and assert one 201 and N-1 conflicts plus `reserved_qty` equal to the bucket size.
2. Exceeding the ONLINE bucket while other buckets still hold stock is 409 `INSUFFICIENT_ALLOCATION`, not `STOCK_UNAVAILABLE`, and must never quietly draw on RESERVE (BR-12c).
3. Price and availability are re-validated at checkout, never trusted from the cart row; store `unit_price` on the line and expose `staleLines` when the current retail price differs.
4. Quantities are `numeric(12,3)` — keep them strings across the repo boundary; a float kilogram is the same defect class as a float rupee.

Add the release job: a `cart-lock-reaper` entry in `JOB_REGISTRY` (`apps/api/src/jobs/queue.ts`) and a handler in `apps/api/src/jobs/worker.ts` that sweeps `carts` past `locked_until` via `idx_carts_expiring`, flips HELD lines to EXPIRED, decrements `allocations.reserved_qty` by the same amount and marks the cart EXPIRED. Run it twice in the test and assert the bucket is returned exactly once.

Report against the Definition of Done in CLAUDE.md §6. If a rule in docs/ is ambiguous or wrong, stop and say so rather than guessing.
```

**Verify**

```bash
pnpm typecheck
pnpm lint
pnpm test -- cart
pnpm spec:lint
pnpm rbac:check
psql "$DATABASE_URL" -c "SELECT channel, allocated_qty, reserved_qty, available_qty FROM allocations WHERE batch_id = '$BATCH_ID';"
curl -s -X POST localhost:3000/v1/cart/items -H "authorization: Bearer $CUSTOMER_TOKEN" -H 'content-type: application/json' -d '{"productId":"'$PRODUCT_ID'","grade":"GRADE_1","qtyKg":"5.000"}' | jq
```

**Done**

- [ ] Adding 5 kg immediately reduces the ONLINE bucket's `available_qty` by 5 kg (`BR-22a:` test).
- [ ] `cart-lock-reaper` job returns the quantity and marks the line EXPIRED; running it twice returns it once (`BR-22b:` test).
- [ ] The race test opens real concurrent connections for the last 5 kg and asserts exactly one winner and `STOCK_UNAVAILABLE` for the rest.
- [ ] Over-drawing the ONLINE bucket returns `ALLOCATION_EXCEEDED`, and RESERVE/BUFFER buckets are untouched.
- [ ] `cart_lock_hours` read from `system_config`; no `24` literal in the service.
- [ ] Only CUSTOMER reaches the cart routes; admin roles are 403.
- [ ] Repeat add of the same crop+grade increments the existing line rather than creating a duplicate.

> **Watch for.** A read-then-write reservation: checking `available_qty` in the service and then updating `reserved_qty` looks correct and passes a serial test, but oversells under concurrency — the row lock or the CHECK violation must be what decides the winner.

---

## Day 13

### S-35 — Wallet-first checkout and atomic order creation

**3h** · `api` · after `S-31`, `S-34` · rules `BR-17`, `BR-21`, `BR-15`, `BR-22`

**Goal.** A locked cart becomes a paid order in one all-or-nothing transaction, with the wallet debited first and the shortfall reported when it is not enough.

**Permissions.** `order.place`, `wallet.checkout.enforce_wallet_first`, `order.delivery_slot.select`

**Prompt**

```text
Implement wallet-first checkout and order creation.

Create `apps/api/src/modules/orders/orders.{routes,schema,service,repo,test}.ts` following `apps/api/src/modules/_example/`, implementing `POST /v1/orders` and `GET /v1/orders/{id}` from `docs/openapi.yaml`.

Write the failing tests first, named `BR-17a:`, `BR-17b:`, `BR-21a:` and `BR-15:`.

Rules: `docs/rules.md` BR-17, BR-21, BR-15, BR-22. Permissions from `docs/rbac.json`: `order.place` (CUSTOMER own, SA/TA all), `wallet.checkout.enforce_wallet_first`, `order.delivery_slot.select`. The spec's `order.create_own` / `order.read_own` are absent from rbac.json — use the rbac codes, fix `x-permission`.

Flow, all in ONE `withTransaction`: re-validate the cart lock (expired → 409 `CART_LOCK_EXPIRED`), re-validate price and availability, debit the wallet via `walletService.move` (type `ORDER_DEBIT`) on the caller's `Executor`, convert `allocations.reserved_qty` into `consumed_qty`, append `stock_ledger` SALE rows, INSERT `orders` + `order_items`, mark the cart CONVERTED, write `audit_log` with the same client.

Status conflict: BR-17a requires **402** with a shortfall and no order row; `docs/openapi.yaml` documents 422. Implement 402 with `code: INSUFFICIENT_WALLET_BALANCE` (errors.ts governs the code, BR-17a the status), put the exact top-up amount in `problem.meta.shortfall` as `Money`, correct the spec, report the divergence.

Fulfilment. Home delivery is a RECORDED CONTRADICTION — `docs/rules.md` § Open contradictions row 3: Matrix principle 9 says pickup-only, Requirements §2.3/FR-C04 specify delivery slots and a doorstep OTP. Build BOTH, pickup first and as the default, delivery behind a `system_config` flag so the client's answer flips one row, not a deploy. Pickup names any of the four warehouses (BR-27) and carries no address; delivery requires `delivery_address_id`, `delivery_date` and a `delivery_slot` of MORNING_8_12 / AFTERNOON_12_4 / EVENING_4_8 with capacity from `delivery_slots` (`booked_orders <= capacity_orders`). Flat `system_config.delivery_fee` waived at or above `system_config.free_delivery_threshold` — no literals. Do not weaken the existing `BR-21a:` assertion; keep it on the pickup default, add a delivery test, and flag that BR-21a says 'every order'.

COD is off for v1 (contradiction 9): `payment_method = 'CASH'` returns 501, never silently WALLET. Non-ONLINE channels return 501 per BR-15.

Traps:
1. ATOMICITY. Write a fault-injection test that throws after the wallet debit but before the order INSERT and asserts: no `orders` row, `wallets.balance` unchanged, `allocations.reserved_qty` unchanged, no `stock_ledger` row. If `walletService.move` opens its own connection instead of joining the caller's transaction, this test is what catches it.
2. `Idempotency-Key` is required. Derive the ledger key from the request, replay it, assert one order and one debit.
3. Line totals, fee, GST and order total reconcile to the paisa via `sum`/`allocate` from `@tohfa/shared-types`.

Report against the Definition of Done in CLAUDE.md §6. If a rule in docs/ is ambiguous or wrong, stop and say so rather than guessing.
```

**Verify**

```bash
pnpm typecheck
pnpm lint
pnpm test -- orders
pnpm test -- wallet
pnpm spec:lint
pnpm rbac:check
curl -s -X POST localhost:3000/v1/orders -H "authorization: Bearer $CUSTOMER_TOKEN" -H 'idempotency-key: chk-1' -H 'content-type: application/json' -d '{"fulfillmentType":"PICKUP","warehouseId":"'$WH_ID'","paymentMethod":"WALLET"}' -i | head -1
psql "$DATABASE_URL" -c "SELECT count(*) FROM orders WHERE cart_id = '$CART_ID';"
```

**Done**

- [ ] Wallet Rs 200 / cart Rs 500 returns 402 with `code: INSUFFICIENT_WALLET_BALANCE` and the exact shortfall, and no `orders` row exists (`BR-17a:`).
- [ ] A successful checkout writes exactly one `ORDER_DEBIT` ledger row; replaying the Idempotency-Key writes none (`BR-17b:`).
- [ ] Fault-injection test proves a mid-transaction failure leaves no order, no ledger row, no stock consumption and no balance change.
- [ ] Pickup is the default and works across all four warehouses; delivery path exists behind the `system_config` flag with slot capacity enforced.
- [ ] `delivery_fee` and `free_delivery_threshold` read from `system_config`; grep finds no `40` or `500` literal.
- [ ] `payment_method = CASH` returns 501; non-ONLINE channels return 501.
- [ ] The BR-21a / contradiction-3 status is stated in the summary rather than resolved in code.
- [ ] Order totals reconcile to the paisa against the sum of line totals plus fee minus discount.

> **Watch for.** Whether the wallet debit really joins the checkout transaction — if `walletService.move` grabs its own pool client, everything passes on the happy path and money is debited for an order that never gets written when anything later fails.

---

### S-36 — Order lifecycle, warehouse fulfilment, SSE tracking and the 4-digit handover OTP

**3.5h** · `api + admin-web` · after `S-35` · rules `BR-20`, `BR-21`, `BR-30`, `BR-35`

**Goal.** A validated order state machine with an append-only history, warehouse-scoped fulfilment, a hashed handover OTP the admin never sees, and a live status stream plus the Angular screen that drives it.

**Permissions.** `order.list.view_all`, `order.warehouse.assign`, `order.mark_packed`, `order.pickup_otp.verify`, `order.delivery_status.view`

**Prompt**

```text
Implement the order lifecycle, fulfilment and the handover OTP.

Add `apps/api/src/modules/orders/fulfilment.{routes,schema,service,repo,test}.ts`. Implement from `docs/openapi.yaml`: `GET /v1/admin/orders`, `POST /v1/admin/orders/{id}/`{assign-warehouse,pack,dispatch,verify-otp}, `GET /v1/orders/{id}/tracking` and `GET /v1/orders/{id}/events` (SSE).

Write the failing tests first, named `BR-20a:`, `BR-20b:`, `BR-30a:` and `BR-35:`.

Rules: BR-20, BR-21, BR-30, BR-35 in `docs/rules.md`. Permissions from `docs/rbac.json`: `order.list.view_all` (MW all, SW own), `order.warehouse.assign` (SA/TA/MW only — SUB_WH_ADMIN is `none`, it cannot self-assign), `order.mark_packed` (SW own), `order.pickup_otp.verify` (SW all), `order.delivery_status.view`. The spec's `order.read_all`, `order.pack`, `order.dispatch`, `order.verify_otp` and `order.assign_warehouse` are absent from rbac.json — use the rbac codes, fix the spec, add `rbac.test.ts` rows.

State machine. One transition table in the service; every accepted transition appends to the APPEND-ONLY `order_status_history` (`from_status`, `to_status`, `changed_by`) in the same transaction as the `orders` update. Pickup: CONFIRMED → PACKED → READY_FOR_PICKUP → PICKED_UP. Delivery: CONFIRMED → PACKED → DISPATCHED → OUT_FOR_DELIVERY → DELIVERED. Schema gap: the `order_status` enum in `db/migrations/0001_extensions_and_enums.sql` has no `DISPATCHED`. Add `db/migrations/0009_order_dispatch_status.sql`; `apps/api/src/db/migrate.ts` runs each `.sql` inside `withTransaction`, and a new enum value cannot be used in the transaction that adds it. Check how the runner treats the `-- +migrate Down` marker (it is only a SQL comment) before relying on it, and report what does not round-trip. Never edit an existing migration.

OTP per BR-20: generate `system_config.handover_otp_length` (4) digits server-side, store ONLY a hash in `orders.delivery_otp_hash`, send it to the customer, never return it in any response, log line or SSE frame. Verification increments `orders.otp_attempts`; past `system_config.otp_max_attempts` it locks with 429 and must be reissued. Wrong OTP is 422 `OTP_INVALID`, status UNCHANGED. Compare in constant time.

SSE at `/v1/orders/{id}/events`: `event: order.status` frames, `: keepalive` every 20 s, close on DELIVERED/PICKED_UP/CANCELLED, honour `Last-Event-ID`, no compression, flush per frame, remove the listener on disconnect.

Traps:
1. Delivery must NOT complete without a correct OTP — no admin flag, no force parameter, no path to DELIVERED/PICKED_UP.
2. Illegal transitions are 409 `INVALID_STATE_TRANSITION`.
3. SUB_WH_ADMIN sees and fulfils ONLY their warehouse's orders — narrow with `scopedWhere`; cross-warehouse is EMPTY or 404, never 403 (BR-30b).
4. BR-21b says no Track 1 endpoint reaches OUT_FOR_DELIVERY; this builds it behind the delivery flag. Flag it; do not weaken the BR-21b test.

Angular: `apps/admin-web/src/app/features/fulfilment/` — order queue on `shared/data-table/`, pack/dispatch actions, an OTP dialog that never shows a code. Guard with `core/permission.guard.ts`; no hard-coded colours or strings.

Report against the Definition of Done in CLAUDE.md §6. If a rule in docs/ is ambiguous or wrong, stop and say so rather than guessing.
```

**Verify**

```bash
pnpm typecheck
pnpm lint
pnpm test -- orders
pnpm test -- fulfilment
pnpm test -- rbac
pnpm rbac:check
pnpm spec:lint
pnpm db:migrate && pnpm db:rollback && pnpm db:migrate
curl -s -X POST localhost:3000/v1/admin/orders/$ORDER_ID/verify-otp -H "authorization: Bearer $SW_TOKEN" -H 'idempotency-key: otp-1' -H 'content-type: application/json' -d '{"otp":"0000"}' | jq '.code, .otp'
curl -sN localhost:3000/v1/orders/$ORDER_ID/events -H "authorization: Bearer $CUSTOMER_TOKEN" | head -5
```

**Done**

- [ ] Every accepted transition appends an `order_status_history` row in the same transaction; UPDATE on that table is still rejected by the DB (`BR-35:`).
- [ ] Wrong OTP returns 422 `INVALID_OTP` and the order status is unchanged (`BR-20a:`).
- [ ] No response, log or SSE frame contains the OTP value; grep the fulfilment module for the plaintext variable leaving the service (`BR-20b:`).
- [ ] OTP attempts lock after `system_config.otp_max_attempts` and require reissue.
- [ ] SUB_WH_ADMIN cannot call assign-warehouse (403 from `requirePermission`) and sees only their warehouse's orders (`BR-30a:`).
- [ ] Illegal transitions return 409 `INVALID_STATE_TRANSITION`.
- [ ] Migration 0009 applies and rolls back cleanly; the `-- +migrate Down` behaviour is reported.
- [ ] SSE stream emits status frames, keepalives, closes on terminal status and resumes with `Last-Event-ID`.
- [ ] Angular fulfilment queue and OTP dialog render behind permission guards.

> **Watch for.** The OTP escaping the server boundary — it is easy to return the generated code in the dispatch response or log it 'for debugging', which passes every functional test while destroying the entire point of BR-20.

---

## Day 14

### S-37 — Farmer payout dues, dual approval, and the payout approval console

**4h** · `api + admin-web` · after `S-28`, `S-31`, `S-32` · rules `BR-31`

**Goal.** Aged farmer dues turn into payouts that a single administrator cannot move above Rs 10,000, demonstrable end-to-end in the admin console.

**Permissions.** `payout.farmer.initiate`, `payout.approve_above_10k`, `payout.escalate_above_10k`

**Prompt**

```text
Implement farmer payout dues, dual approval and the admin screens that demonstrate it. The Angular screens are PART OF THIS STORY — without them the flagship financial control cannot be shown to the client.

Create `apps/api/src/modules/payouts/payouts.{routes,schema,service,repo,test}.ts` following `apps/api/src/modules/_example/`, implementing `GET /v1/admin/payout-dues`, `POST /v1/admin/payouts` and `POST /v1/admin/payouts/{id}/approve` from `docs/openapi.yaml`.

Write the failing tests first, named `BR-31a:`, `BR-31b:` and `BR-31c:`.

Rules: `docs/rules.md` BR-31. Permissions from `docs/rbac.json`: `payout.farmer.initiate` (SA/TA), `payout.approve_above_10k` (SUPER_ADMIN ONLY), `payout.escalate_above_10k` (SA/TA). The spec's `payout.dues.read` / `payout.initiate` / `payout.approve` are absent from rbac.json, and dues reading has no equivalent at all — a specification gap: add `payout.dues.read` to `docs/rbac.json` with grants matching `payout.farmer.initiate`, add a `rbac.test.ts` row, run `pnpm rbac:check`, call it out.

Dues accrue from ACCEPTED goods receipts — `goods_receipts.accepted_qty_kg` x `purchase_orders.price_per_kg`, less anything covered by a PAID or PROCESSING payout — aged from `goods_receipts.received_at` into D0_7 / D8_15 / D16_30 / D30_PLUS, returning `totals.totalDue` and `farmerCount`. Arithmetic through `Money`.

Approval per `db/migrations/0007_money.sql`: `payouts.requires_dual_approval` is GENERATED (`amount > 10000.00`) — read it, never compute or accept it. Rs 10,000 exactly is single-approval; the boundary is strictly greater. Above it the payout is PENDING_APPROVAL and needs a SECOND, DISTINCT SUPER_ADMIN. `payout_approvals` has `UNIQUE (payout_id, approver_id)`, and `trg_payout_approval_guard` raises SQLSTATE 23514 with `HINT: code: SAME_ACTOR_APPROVAL` when approver = initiator.

Traps:
1. Error-code divergence: BR-31b names `SAME_ACTOR_APPROVAL`; `packages/shared-types/src/errors.ts` and the spec use `SAME_ACTOR_APPROVAL`. Map the DB HINT to the errors.ts code and report it, never a third spelling. BR-31a says 403 `DUAL_APPROVAL_REQUIRED` while the spec says 422 — implement 403 and fix the spec.
2. Do NOT enforce self-approval only in TypeScript. Let the trigger and UNIQUE constraint fire, catch and translate, and prove it with a test that INSERTs directly against the database.
3. A second approver clicking twice must not produce two approvals — UNIQUE, translated to 409.
4. RazorpayX amounts convert through `toPaise`; no float.

RazorpayX behind the same adapter pattern: `PayoutGateway` in `apps/api/src/payments/payout-gateway.ts`, mock selected by `config.PAYMENT_PROVIDER`, `RAZORPAYX_ACCOUNT` from config. Bank/UPI capture sets `farmer_bank_accounts.is_verified`/`verified_by`/`verified_at` together; last 4 plus opaque token only.

Angular: `apps/admin-web/src/app/features/payouts/` — dues queue with ageing columns on `shared/data-table/`, the initiate form, and an approval screen showing initiator, approvals so far and what is outstanding. Hide approve without `payout.approve_above_10k` and disable it for the initiator; the server refusal is the real control.

Report against the Definition of Done in CLAUDE.md §6. If a rule in docs/ is ambiguous or wrong, stop and say so rather than guessing.
```

**Verify**

```bash
pnpm typecheck
pnpm lint
pnpm test -- payouts
pnpm test -- rbac
pnpm rbac:check
pnpm spec:lint
curl -s -X POST localhost:3000/v1/admin/payouts/$PAYOUT_ID/approve -H "authorization: Bearer $INITIATOR_SA_TOKEN" -H 'idempotency-key: ap-1' | jq .code
curl -s -X POST localhost:3000/v1/admin/payouts -H "authorization: Bearer $TA_TOKEN" -H 'idempotency-key: po-1' -H 'content-type: application/json' -d '{"farmerId":"'$FARMER_ID'","amount":"10001.00","mode":"IMPS"}' | jq '.status, .requiresDualApproval'
psql "$DATABASE_URL" -c "INSERT INTO payout_approvals (payout_id, approver_id) VALUES ('$PAYOUT_ID', (SELECT initiated_by FROM payouts WHERE id='$PAYOUT_ID'));" || echo 'trigger rejected as expected'
```

**Done**

- [ ] TOHFA_ADMIN releasing a Rs 10,001 payout gets 403 `DUAL_APPROVAL_REQUIRED` and the payout stays PENDING_APPROVAL (`BR-31a:`).
- [ ] The initiating SUPER_ADMIN cannot approve their own payout — 403 `SELF_APPROVAL_OF_PAYOUT`, proven both through the API and by a direct INSERT that the trigger rejects (`BR-31b:`).
- [ ] Rs 10,000.00 exactly takes the single-approval path; Rs 10,000.01 does not (`BR-31c:`).
- [ ] Two distinct SUPER_ADMIN approvals release the payout; a duplicate click by the same approver is a 409, not a second row.
- [ ] Dues aged into 7/15/30 buckets from accepted GRNs, with `totalDue` reconciling to the sum of the rows.
- [ ] `PayoutGateway` interface plus mock; `PAYMENT_PROVIDER=mock` keeps the suite offline; no RazorpayX SDK outside its adapter.
- [ ] Bank account capture stores last 4 + token only and never returns a full account number.
- [ ] Angular payout queue and approval screens exist and demonstrate the rule against a running API.
- [ ] `payout.dues.read` added to `docs/rbac.json` with a matching `rbac.test.ts` row; `pnpm rbac:check` passes.

> **Watch for.** A TypeScript-only self-approval check: if the service decides in code and never exercises the trigger, the rule silently disappears the moment another code path (a job, a script, a future endpoint) writes an approval row.

---

### S-38 — Server-side invoice PDFs with GST, Tamil-ready fonts and expiring download URLs

**2.5h** · `api` · after `S-35`, `S-37` · rules `BR-16`

**Goal.** Every order and payout produces a branded, GST-correct PDF invoice that reconciles to the source record to the paisa and downloads through a short-lived signed URL.

**Permissions.** `invoice.generate`, `invoice.gst.generate`

**Prompt**

```text
Implement server-side invoice generation.

Create `apps/api/src/modules/invoices/invoices.{routes,schema,service,repo,test}.ts` following `apps/api/src/modules/_example/`, plus `invoices/pdf/` for rendering. Implement `GET /v1/invoices`, `GET /v1/invoices/{id}` and `GET /v1/invoices/{id}/download` from `docs/openapi.yaml`, and an internal `invoiceService.issue(tx, {...})` for the order and payout services.

Write the failing tests first, named `BR-16b:` and `INV-RECONCILE:`.

Rules: `docs/rules.md` BR-16. Permissions from `docs/rbac.json`: `invoice.generate` (SA/TA/MW/SW), `invoice.gst.generate` (SA/TA only). Farmers and customers reading their OWN invoices have no rbac.json code — the spec's `invoice.read_own` / `invoice.download_own` are absent. Specification gap: add `invoice.own.view` granted `own` to FARMER and CUSTOMER, add an `apps/api/src/rbac/rbac.test.ts` row, run `pnpm rbac:check`, fix `x-permission`, call it out.

Data per `db/migrations/0007_money.sql`: `invoices` + `invoice_lines`, `invoice_type` SALE_RETAIL / SALE_B2B / PURCHASE_FARMER / PAYOUT / SUBSCRIPTION. `invoices_gst_split_chk` forbids IGST alongside CGST/SGST — intra-state Tamil Nadu is CGST+SGST, inter-state IGST. Retail is GST-INCLUSIVE (`gst_inclusive = true`, back the tax out of the line total); B2B/Horeca is GST-EXCLUSIVE. Split tax with `allocate()` from `@tohfa/shared-types` so components always sum back — never `multiply(m, 0.18)` with independent rounding per component. `invoice_number` is UNIQUE: generate per `fiscal_year` from a sequence or under a lock, never by counting rows.

Farmer tabs: All / Sales (PURCHASE_FARMER) / Payouts / Subscription; customers get SALE_RETAIL / SALE_B2B.

PDF: TOHFA branding from `packages/design-tokens/src/tokens.json` — no hex literals in the renderer. Embed Noto Sans Tamil NOW and route strings through the i18n catalogue so Phase 4 Tamil needs no rework; test that a Tamil string renders with embedded glyphs, not boxes. Add the PDF library to `apps/api/package.json`. Bulk ZIP export is DEFERRED.

Download: `?redirect=true` returns 302 to a signed URL expiring in 5 minutes, default returns the PDF inline. Verify the signature server-side on redemption; expired or tampered is 403. An unguessable URL is not a signed URL.

Traps:
1. BR-16b farm anonymity: a customer invoice names TOHFA as the seller. Nothing in the PDF, the line descriptions, the filename or the JSON may resolve `farmer_id`, farm name, village or GPS — even though `order_items.batch_id` links straight to `inventory_batches.source_farmer_id`. Serialize through an explicit allow-list, and test with an order whose batch has a distinctive farm name, asserting it appears nowhere in the extracted PDF text.
2. Totals reconcile to the paisa: assert `sum(invoice_lines.total) = invoices.total_amount = orders.total_amount` (or `payouts.amount`) with `equals` from `@tohfa/shared-types`, not a tolerance.

Report against the Definition of Done in CLAUDE.md §6. If a rule in docs/ is ambiguous or wrong, stop and say so rather than guessing.
```

**Verify**

```bash
pnpm typecheck
pnpm lint
pnpm test -- invoices
pnpm rbac:check
pnpm spec:lint
curl -s localhost:3000/v1/invoices/$INVOICE_ID/download -H "authorization: Bearer $CUSTOMER_TOKEN" -o /tmp/inv.pdf && pdftotext /tmp/inv.pdf - | grep -i -E 'farm|village|farmer' || echo 'no farm identifiers in PDF'
curl -s -i "localhost:3000/v1/invoices/$INVOICE_ID/download?redirect=true" -H "authorization: Bearer $CUSTOMER_TOKEN" | grep -i location
```

**Done**

- [ ] Invoices generated for customer orders and for farmer payouts, with the correct `invoice_type`.
- [ ] Retail is GST-inclusive and B2B is GST-exclusive; CGST+SGST and IGST are never both non-zero.
- [ ] `INV-RECONCILE:` test asserts exact paisa equality between invoice lines, invoice total and the source order/payout.
- [ ] `BR-16b:` test extracts PDF text and proves no farm identifier appears.
- [ ] Noto Sans Tamil embedded; a Tamil-string render test passes.
- [ ] Signed download URL expires in 5 minutes and a tampered or expired token returns 403.
- [ ] Farmer tabs All/Sales/Payouts/Subscription filter correctly.
- [ ] `invoice.own.view` added to `docs/rbac.json` with a `rbac.test.ts` row; `pnpm rbac:check` passes.
- [ ] No bulk ZIP export was built.

> **Watch for.** GST rounding: computing CGST and SGST independently from a percentage produces totals that are one paisa off the order and quietly break reconciliation — `allocate()` is the only correct split.

---

## Day 15

### S-39 — The golden-thread end-to-end test, RBAC matrix conformance and the anonymity leak test

**4h** · `api` · after `S-36`, `S-37`, `S-38` · rules `BR-01`, `BR-02`, `BR-07`, `BR-08`, `BR-10`, `BR-11`, `BR-12`, `BR-16`, `BR-17`, `BR-18`, `BR-19`, `BR-20`, `BR-22`, `BR-28`, `BR-29`, `BR-30`, `BR-31`, `BR-35`

**Goal.** One CI-gated test that drives farmer registration all the way to farmer payout and invoices against a real database, so any single business-rule regression fails the build loudly.

**Prompt**

```text
Write the golden-thread end-to-end test that proves Track 1 works.

Create `apps/api/src/golden-thread.e2e.test.ts` (`pnpm test:e2e` runs `vitest run e2e.test`; `apps/api/src/app.e2e.test.ts` shows how to boot the app). Start from a CLEAN database — `pnpm db:reset` semantics in setup. No copied fixtures, no mocks.

Drive the chain over HTTP, asserting at each hop and naming every assertion with its `BR-xx` ID from `docs/rules.md`: farmer registers → admin approves → certificate verified (BR-01, BR-02) → SUPER_ADMIN sets the fair price ceiling (BR-08) → farmer lists under it and a listing above is rejected (BR-07) → admin counter-offers (BR-10, BR-11) → farmer accepts → purchase order → goods receipt with quality check → batch and stock ledger (BR-35) → allocations 70/10/10/10 (BR-12) → customer registers → cash (BR-18, BR-19) and digital top-up → cart hold (BR-22) → wallet-first checkout (BR-17) → pack → handover OTP verified (BR-20) → delivered → payout dual-approved by two distinct Super Admins (BR-31) → invoices reconciled.

Also:
1. RBAC MATRIX CONFORMANCE. Table-driven over EVERY permission in `docs/rbac.json` for all five admin roles (SUPER_ADMIN, TOHFA_ADMIN, FARMER_ADMIN, MAIN_WH_ADMIN, SUB_WH_ADMIN), asserting each live route matches its grant: `none` → 403, `own` → narrowed to the actor's warehouse/zone, `all` → unnarrowed. Extend `apps/api/src/rbac/rbac.test.ts`; no parallel matrix. A permission with no route is listed as unimplemented, never silently skipped — a skipped row is how privilege escalation ships.
2. FARM-ANONYMITY LEAK TEST (BR-16). Seed a farmer with a distinctive farm name, village and GPS; then walk every customer-facing response — catalog, product, search, cart, order, tracking, SSE frames, invoice JSON, invoice PDF text — asserting none of those strings, nor `farmerId`, nor any GPS/FMB field appears. Assert against the whole serialized body, not a field list.

Traps:
1. Each stage asserts on data it created, never on seed ordering or hard-coded UUIDs.
2. The 24-hour counter-offer window and cart lock are driven by a controlled clock or `system_config`, never `sleep`.
3. Budget: under 6 minutes in CI. Reuse one app instance and one pool, parallelise independent stages, print per-stage timings.
4. Never weaken an assertion to go green — leave it failing and say why (CLAUDE.md §7).

Wire it into `.github/workflows/ci.yml` as a required step after the existing E2E step, with its own timeout so a hang fails fast.

Report against the Definition of Done in CLAUDE.md §6. If a rule in docs/ is ambiguous or wrong, stop and say so rather than guessing.
```

**Verify**

```bash
pnpm db:reset
time pnpm test:e2e
pnpm test -- rbac
pnpm rbac:check
pnpm typecheck
pnpm lint
grep -c 'BR-' apps/api/src/golden-thread.e2e.test.ts
grep -rn 'it.skip\|describe.skip\|todo(' apps/api/src/golden-thread.e2e.test.ts apps/api/src/rbac/rbac.test.ts
```

**Done**

- [ ] `apps/api/src/golden-thread.e2e.test.ts` runs from a clean database and covers every hop from farmer registration to payout and invoices.
- [ ] Every stage assertion is named with its `BR-xx` ID.
- [ ] RBAC conformance test covers all five admin roles across every permission in `docs/rbac.json`; unimplemented permissions are listed explicitly, not skipped.
- [ ] Farm-anonymity test asserts against whole serialized customer responses including the invoice PDF text.
- [ ] Total e2e wall time under 6 minutes, with per-stage timings printed.
- [ ] No `sleep`-based waits; time-dependent rules are driven by a controlled clock or config.
- [ ] CI runs the golden thread as a required step with its own timeout.
- [ ] No skipped or weakened assertions anywhere in the file.

> **Watch for.** Silent skipping — a stage that cannot pass gets `it.skip`, or the RBAC matrix quietly filters out permissions with no route, and the suite reports green safety that does not exist.

---

### S-40 — Ship Track 1: demo dataset, demo script, production hardening and a timed rollback

**3h** · `api + ops` · after `S-39` · rules `BR-12`, `BR-23`, `BR-31`

**Goal.** A one-command demo environment, a scripted 15-minute client walkthrough, a hardened deploy path and a rollback procedure that has actually been executed and timed.

**Prompt**

```text
Ship Track 1.

1. DEMO DATASET. Create `db/seed/003_demo.sql` (or `.js` — the migrator runs `.js` seeds too) behind `SEED_DEMO=true` so it can NEVER load in production. Idempotent and re-runnable. Contents: 12 farmers across application states (draft, submitted, approved, rejected, info-requested) and certificate states (valid, expiring within 30 days, expired, unverified); 25 listings in mixed states (draft, pending, approved, rejected, withdrawn, sold); 3+ LIVE counter-offers mid-countdown so the 24-hour window ticks; stocked batches at all four warehouses with allocations split 70/10/10/10 (BR-12, BR-23); 8 customers with varied balances including one short enough for the 402 shortfall moment; orders in all five lifecycle states, one awaiting OTP handover; pending payouts BOTH below and above the Rs 10,000 threshold. Amounts through `Money`; thresholds from `system_config`.

2. DEMO SCRIPT. `docs/demo-script.md`: a 15-minute click-through with per-section timings, the login and click path per step, what to say, and three failure demonstrations — listing above the ceiling rejected, wallet-short checkout returning the shortfall, Super Admin self-approval of a large payout refused. Add a pre-flight checklist and a reset command that recovers a botched run in under a minute.

3. PRODUCTION HARDENING. Rotation for every secret in `.env.example` (`JWT_SECRET`, `RAZORPAY_*`, `RAZORPAYX_ACCOUNT`, `AZURE_STORAGE_CONNECTION_STRING`, `MSG91_AUTH_KEY`, `FCM_SERVER_KEY`), with the JWT overlap window spelled out. A backup schedule with retention and a RESTORE that has been proven, not just scheduled. Worker autoscale for `apps/api/src/jobs/worker.ts` keyed on queue depth; every `JOB_REGISTRY` job must stay idempotent under concurrency. Sentry: `SENTRY_DSN` is validated in `apps/api/src/config.ts` but nothing initialises the SDK — wire it into API and worker, scrub money, OTP, Aadhaar and bank fields, define alert rules. A smoke-test gate in `.github/workflows/ci.yml` running against the deploy target, blocking promotion on failure.

4. ROLLBACK RUNBOOK. `docs/runbooks/rollback.md`: application rollback, `pnpm db:rollback`, and the money data-repair path. EXECUTE IT ONCE against a scratch environment and record the measured wall-clock time — an untimed runbook is a wish.

Traps: the demo seed must be unreachable from a production seed run, and since `PAYMENT_PROVIDER=mock` and `SMS_PROVIDER=mock` are refused under `NODE_ENV=production`, the demo environment must be explicitly non-production. Verify `db:rollback` really reverses the money migrations: `apps/api/src/db/migrate.ts` reads a separate `<name>.down.sql` while the existing migrations carry an inline `-- +migrate Down` comment — establish which the runner uses before certifying rollback, and report the discrepancy.

Report against the Definition of Done in CLAUDE.md §6. If a rule in docs/ is ambiguous or wrong, stop and say so rather than guessing.
```

**Verify**

```bash
pnpm db:reset && SEED_DEMO=true pnpm db:seed
SEED_DEMO=true pnpm db:seed
psql "$DATABASE_URL" -c "SELECT count(*) FROM farmers; SELECT count(*) FROM produce_listings; SELECT count(*) FROM customers; SELECT status, count(*) FROM orders GROUP BY status; SELECT requires_dual_approval, count(*) FROM payouts GROUP BY 1;"
pnpm db:seed && psql "$DATABASE_URL" -c "SELECT count(*) FROM customers;"
pnpm db:rollback && pnpm db:migrate
pnpm test:e2e
test -f docs/demo-script.md && test -f docs/runbooks/rollback.md && grep -i 'minutes' docs/runbooks/rollback.md
```

**Done**

- [ ] `SEED_DEMO=true pnpm db:seed` is idempotent — running it twice does not duplicate rows.
- [ ] A plain `pnpm db:seed` loads NO demo data.
- [ ] 12 farmers across application and certificate states; 25 listings in mixed states; live counter-offers with `expires_at` in the future.
- [ ] Stocked batches at all four warehouses with 70/10/10/10 allocations present.
- [ ] 8 customers with varied balances, including one that triggers the 402 shortfall.
- [ ] Orders exist in all five lifecycle states, including one awaiting OTP.
- [ ] Pending payouts exist both below and above Rs 10,000.
- [ ] `docs/demo-script.md` has per-section timings, logins, click paths and the three failure demonstrations.
- [ ] Sentry initialised in both API and worker with money/OTP/Aadhaar/bank scrubbing and defined alert rules.
- [ ] Secrets rotation, backup schedule with a proven restore, and worker autoscale policy documented.
- [ ] Smoke-test gate blocks promotion in CI.
- [ ] `docs/runbooks/rollback.md` records a measured execution time, and the migration down-path discrepancy is reported.

> **Watch for.** A rollback runbook that was written but never run — and a demo seed that can be triggered by the ordinary `pnpm db:seed`, which puts fake farmers and fake money into the client's production database.

---

# Week 4 — Farmer mobile app

*Days 16–20 · 6 stories · 22.5 hours*

| Story | Day | h | App | Title |
|---|---|---|---|---|
| `S-41` | 16 | 5 | farmer-mobile | Farmer app foundation: navigation, token-driven component library, i18n, query client |
| `S-42` | 16 | 2.5 | farmer-mobile | Farmer auth screens: splash, login, OTP, forgot password, application-status timeline |
| `S-43` | 17 | 4.5 | farmer-mobile | Farmer 5-step registration: stepper, draft resume, GPS capture, document upload |
| `S-44` | 18 | 4 | farmer-mobile | Farmer dashboard, profile, certifications and wallet screens |
| `S-45` | 19 | 3.5 | farmer-mobile | Farmer marketing screens: create listing with live ceiling, history, counter-offer response |
| `S-46` | 20 | 3 | farmer-mobile + api | Farmer app hardening: states, token refresh, upload resume, offline honesty, accessibility, E2E flow |

## Day 16

### S-41 — Farmer app foundation: navigation, token-driven component library, i18n, query client

**5h** · `farmer-mobile` · after `S-11`

**Goal.** apps/farmer-mobile has typed navigation, a design-token-driven component library, a Material Symbols icon layer, Tamil-tolerant i18n, TanStack Query and secure token storage, so every later farmer screen is assembly rather than invention.

**Prompt**

```text
Build the React Native foundation for `apps/farmer-mobile`. Read `CLAUDE.md` §2.7 and `apps/farmer-mobile/CLAUDE.md` before writing code.

First check `apps/farmer-mobile/README.md`: there is no `android/` or `ios/` project in the repo yet. If the Day-0 toolchain spike has not landed, generate the native projects for RN 0.74.5, add `metro.config.js` and `babel.config.js` wired for a pnpm monorepo (`watchFolders` at the repo root, `nodeModulesPaths` including the root `node_modules`), bundle Noto Sans Tamil as a local asset, and say in your summary that you did it.

Deliver:
- `src/navigation/` — React Navigation with bottom tabs plus a drawer, typed route params, and a deep-link config other stories can extend.
- `src/components/` — Button (minHeight `theme.minTouchTarget`, `radius.button`), Card (`radius.cardMin`–`radius.cardMax`, token-derived shadow), Input (`radius.input`, focus ring `colors.primary`), a sticky Cancel/Save footer that every edit screen mounts, Badge, EmptyState, ErrorState, Skeleton. Colour and size props take token names, never raw numbers.
- `src/components/Icon.tsx` — Material Symbols Outlined, weight 400, fill 0, optical size 24. No emoji in production.
- i18n: `apps/farmer-mobile/CLAUDE.md` says i18next, while the header comment in `src/i18n/index.ts` says the module is deliberately dependency-free. Pick one, justify it in your summary, and preserve English fallback, `missingKeys()` and `fontFamilyForLocale()` either way. Every new string goes into `src/i18n/en.json` with a stub in `ta.json`.
- Tamil runs roughly 30% longer than English: no fixed-height text boxes, no truncation on labels. Add a test that renders the component gallery with strings expanded 1.3x and asserts nothing clips.
- TanStack Query provider with sane defaults, and access/refresh token storage in Keychain/Keystore — not AsyncStorage.

Traps. `src/theme/index.ts` contains a literal `white: '#FFFFFF'` that `packages/design-tokens/src/tokens.json` does not cover: that is a specification gap, so add the token rather than exempting the file. Write first, and watch fail, a lint rule plus a Jest test that rejects any `#rrggbb` literal, any raw spacing number and any emoji under `apps/farmer-mobile/src/**` outside `src/theme/`. Add `"test": "jest"` to `apps/farmer-mobile/package.json` and wire the package into the root `test` script.

Report against the Definition of Done in CLAUDE.md §6. If a rule in docs/ is ambiguous or wrong, stop and say so rather than guessing.
```

**Verify**

```bash
pnpm typecheck
pnpm lint
pnpm --filter @tohfa/farmer-mobile test
grep -rnE '#[0-9a-fA-F]{3,8}\b' apps/farmer-mobile/src --include='*.tsx' --include='*.ts' | grep -v 'src/theme/' || echo 'no hex literals outside theme'
node -e "const p=require('./apps/farmer-mobile/package.json');if(!p.scripts.test)throw new Error('no test script')"
```

**Done**

- [ ] Bottom tabs + drawer render, route params are typed, and a deep link opens a named screen.
- [ ] Button, Card, Input, sticky Cancel/Save footer, Badge, EmptyState, ErrorState and Skeleton exist and take token names, not numbers.
- [ ] Icon.tsx renders Material Symbols Outlined at weight 400 / fill 0 / opsz 24; no emoji anywhere in src/.
- [ ] A lint rule and a test fail the build on a hex literal, a raw spacing number or an emoji outside src/theme/.
- [ ] A `white`/neutral token was added to packages/design-tokens/src/tokens.json and src/theme/index.ts no longer contains '#FFFFFF'.
- [ ] The 1.3x string-expansion test passes with no clipped label.
- [ ] Access and refresh tokens are stored in Keychain/Keystore; grep finds no AsyncStorage token write.
- [ ] `pnpm --filter @tohfa/farmer-mobile test` runs from the root `test` script.

> **Watch for.** The hex/spacing guard being written as a passing test against already-clean code instead of failing first against the real `white: '#FFFFFF'` literal in src/theme/index.ts.

---

### S-42 — Farmer auth screens: splash, login, OTP, forgot password, application-status timeline

**2.5h** · `farmer-mobile` · after `S-41`, `S-11` · rules `BR-32`

**Goal.** A farmer can sign in by password or OTP, recover a password, and a farmer whose application is still under review lands on the status timeline instead of a dashboard they have no data for.

**Permissions.** `auth.session.login`, `auth.otp.request`, `auth.password.change_own`

**Prompt**

```text
Build the farmer authentication surface in `apps/farmer-mobile` on the foundation in `src/navigation` and `src/components`: splash, welcome, login-by-password, login-by-OTP, forgot password, reset password, and the application-status timeline for a pending farmer.

Endpoints, exactly as specified in `docs/openapi.yaml`: `POST /auth/login`, `POST /auth/otp/send`, `POST /auth/otp/verify`, `POST /auth/forgot-password`, `POST /auth/reset-password`, `GET /auth/me`, `GET /farmers/applications/{id}/status`. Use `src/api/client.ts`; branch on `error.problem.code`, never on message text.

Enforce `docs/rules.md` BR-32 in the UI as a mirror of server state, not as a second source of truth. The resend timer counts down from the server's `resendAvailableAt`, the attempts indicator comes from `attemptsRemaining`, and a locked-out challenge shows a message driven by the server response with a path to request a new challenge — never a locally counted lockout. Write the failing tests first and name them `BR-32: ...`.

Routing rule: after a successful token exchange, `GET /auth/me` decides the destination. A farmer whose application has not been approved goes to the application-status timeline (`Submitted → Docs Review → Farm Verification → Audit → Approved`), never to the dashboard. Cover it with a test.

Traps. `POST /auth/forgot-password` always answers 202 to prevent account enumeration — the screen must not say whether the number exists. `packages/shared-types/src/errors.ts` has `OTP_INVALID` but no `OTP_LOCKED` or `OTP_RESEND_TOO_SOON`, which BR-32's test contract names: if the API returns codes that are missing there, report it as a specification gap rather than string-matching on the title. The `x-business-rules` IDs in `docs/openapi.yaml` do not line up with `docs/rules.md` (the OTP operations are tagged `BR-19` there); `docs/rules.md` IDs are authoritative for test names, and the mismatch is worth reporting. Every string is a key in `src/i18n/en.json` with a `ta.json` stub.

Report against the Definition of Done in CLAUDE.md §6. If a rule in docs/ is ambiguous or wrong, stop and say so rather than guessing.
```

**Verify**

```bash
pnpm typecheck
pnpm lint
pnpm --filter @tohfa/farmer-mobile test -t 'BR-32'
pnpm --filter @tohfa/farmer-mobile test
grep -rn 'attemptsRemaining\|resendAvailableAt' apps/farmer-mobile/src | head
```

**Done**

- [ ] Splash, welcome, password login, OTP login, forgot password, reset password and application-status timeline all render and navigate.
- [ ] Tests named `BR-32: ...` exist, failed before implementation, and assert the resend timer and lockout come from server fields.
- [ ] A pending farmer is routed to the status timeline; an approved farmer reaches the dashboard — both covered by a test.
- [ ] Forgot-password never reveals whether a mobile number is registered.
- [ ] No literal user-facing English in a component; all keys are in en.json with ta.json stubs.
- [ ] Any missing ErrorCode is reported as a spec gap, not worked around with message matching.

> **Watch for.** A client-side lockout or resend countdown that drifts from the server — check the screen re-reads `attemptsRemaining` and `resendAvailableAt` from every response instead of decrementing a local counter.

---

## Day 17

### S-43 — Farmer 5-step registration: stepper, draft resume, GPS capture, document upload

**4.5h** · `farmer-mobile` · after `S-42` · rules `BR-33`

**Goal.** A prospective farmer can complete the 5-step application on a phone, survive the app being killed mid-flow, capture GPS with a manual fallback, and upload documents with visible progress and a retry.

**Prompt**

```text
Build the 5-step farmer registration flow in `apps/farmer-mobile` against `docs/openapi.yaml`: `POST /farmers/applications`, `PATCH /farmers/applications/{id}/steps/{step}` for steps 1..5 (1 personal, 2 farm, 3 location, 4 documents, 5 review), `POST /farmers/applications/{id}/submit` (requires `Idempotency-Key`), and `GET /farmers/applications/{id}/status`.

Deliverables:
- A stepper with per-step validation. Each step saves independently; cross-step validation happens only at submit, so do not block step 2 on data that belongs to step 4.
- Draft resume. Persist the application id and each step's payload locally. Killing the app mid-flow and reopening it must land on the step the farmer was on with their answers intact. Write that test first — simulate a cold start, not a re-render.
- Step 3 location: GPS auto-capture with a permission-denied path, a manual latitude/longitude entry fallback, and a STATIC satellite image preview of the captured point.
- Step 4 documents: camera and gallery capture, `POST /uploads/sign` with purpose `FARMER_DOCUMENT` or `CERTIFICATE`, direct PUT to the returned `uploadUrl`, visible per-file progress, and a retry the farmer can understand — honour `resumable` when the sign response sets it.

Traps. Interactive Leaflet FMB polygon drawing is deliberately deferred; `apps/farmer-mobile/CLAUDE.md` says so. The step-3 request example in `docs/openapi.yaml` contains an `fmbPolygon` field — v1 sends a GPS point plus an uploaded sketch image and nothing else. If the task appears to need polygon drawing, stop and confirm. Aadhaar and mobile are locked once approved (`docs/rules.md` BR-33): the flow captures them once and never offers an edit afterwards. The `x-permission` values on these operations (`farmer.application.write_own`, `farmer.application.submit_own`, `farmer.application.read_own`) do not exist in `docs/rbac.json` — report that as a specification gap, do not invent codes. Submit must reuse one idempotency key per attempt so a double tap cannot create two applications. Audience is a first-time smartphone user: plain language, large targets, a visible way back out of every step.

Report against the Definition of Done in CLAUDE.md §6. If a rule in docs/ is ambiguous or wrong, stop and say so rather than guessing.
```

**Verify**

```bash
pnpm typecheck
pnpm lint
pnpm --filter @tohfa/farmer-mobile test -t 'registration'
pnpm --filter @tohfa/farmer-mobile test
grep -rn 'fmbPolygon\|polygon' apps/farmer-mobile/src || echo 'no polygon editor — correct'
```

**Done**

- [ ] Five steps render, each validates on save, and submit performs the cross-step validation pass.
- [ ] A cold-start test proves a killed app resumes on the correct step with saved answers.
- [ ] GPS auto-capture works, permission denial falls back to manual lat/lng, and a static satellite preview shows the point.
- [ ] Document capture uploads via POST /uploads/sign with visible progress and a working retry.
- [ ] No interactive polygon drawing exists anywhere in src/.
- [ ] Submit sends one Idempotency-Key per attempt; a double tap creates one application.
- [ ] The missing farmer.application.* permission codes are reported as a spec gap against docs/rbac.json.

> **Watch for.** Draft resume implemented as React state that survives a re-render but not a process kill — verify against a real cold start, and check the resume points at the correct step rather than restarting at step 1.

---

## Day 18

### S-44 — Farmer dashboard, profile, certifications and wallet screens

**4h** · `farmer-mobile` · after `S-42` · rules `BR-01`, `BR-02`, `BR-33`, `BR-36`

**Goal.** An approved farmer sees their real state on one dashboard — listing block, certificate expiry, pending counter-offers — and can manage their profile, certificates and wallet.

**Permissions.** `farmer.profile.edit`, `certification.manage_own`, `wallet.own.view`

**Prompt**

```text
Build the farmer dashboard, profile, certification and wallet screens in `apps/farmer-mobile`.

Endpoints from `docs/openapi.yaml`: `GET /auth/me`, `GET /farmers/me`, `PATCH /farmers/me`, `GET /farmers/me/certifications`, `POST /farmers/me/certifications`, `POST /uploads/sign` (purpose `CERTIFICATE`), `GET /wallets/me`, `GET /wallets/me/transactions` (with the `type` query parameter), `GET /invoices`, `GET /invoices/{id}/download`.

Dashboard reflects real API state, never a local guess: a market-blocked banner when certification blocks listings (`docs/rules.md` BR-01 expired, BR-02 unverified — use the `blocksListings` and `verificationStatus` fields), a certificate expiry countdown driven by the server's `daysToExpiry` that turns `colors.danger` inside the warning window, and a pending counter-offer count. Write the failing tests first, named `BR-01: ...` and `BR-02: ...`.

Profile shows Aadhaar and mobile read-only with a request-change action that opens a support request — the app never PATCHes those fields (`docs/rules.md` BR-33; the API answers 422 `INVALID_STATE_TRANSITION`). Aadhaar is never shown unmasked. Certifications list with expiry state and an upload path that creates the record `UNVERIFIED`. Wallet shows balance, the transaction list with the four filter tabs, payouts and invoice download.

Traps. The 30-day expiry warning threshold is a business threshold: read it from the API/`system_config`, do not write `30` into a component (`CLAUDE.md` §2.7). Money arrives as the branded `Money` string from `@tohfa/shared-types` — render it, never `parseFloat` it, never sum it client-side. Do not compute expiry from the device clock; devices in the field have wrong clocks. The four wallet filter tabs must re-query with `?type=`, not filter one already-fetched page in memory, or the tab shows a lie as soon as the ledger is longer than a page. Own-data only (BR-36): no screen accepts another farmer's id from a route param.

Report against the Definition of Done in CLAUDE.md §6. If a rule in docs/ is ambiguous or wrong, stop and say so rather than guessing.
```

**Verify**

```bash
pnpm typecheck
pnpm lint
pnpm --filter @tohfa/farmer-mobile test -t 'BR-01'
pnpm --filter @tohfa/farmer-mobile test -t 'BR-33'
pnpm --filter @tohfa/farmer-mobile test
```

**Done**

- [ ] Dashboard renders the market-blocked banner, expiry countdown and pending counter-offer count from API fields only.
- [ ] Tests named BR-01, BR-02 and BR-33 exist and failed before implementation.
- [ ] The expiry warning threshold comes from config/API, and grep finds no literal 30 in the countdown component.
- [ ] Aadhaar and mobile are read-only and masked; the request-change action does not PATCH them.
- [ ] Certification upload creates an UNVERIFIED record with an attached document.
- [ ] Wallet filter tabs re-query the API with ?type= and paginate correctly.
- [ ] No Money value is parsed to a float anywhere in the app.

> **Watch for.** Client-side date arithmetic for the certificate countdown — confirm the screen renders the server's `daysToExpiry` rather than subtracting `expiresOn` from the device clock.

---

## Day 19

### S-45 — Farmer marketing screens: create listing with live ceiling, history, counter-offer response

**3.5h** · `farmer-mobile` · after `S-44` · rules `BR-07`, `BR-10`, `BR-11`

**Goal.** A farmer can list produce against a fair-price ceiling they can see before they type, review listing history, and accept, reject or counter-back an admin counter-offer within the server's window and round limit.

**Permissions.** `listing.create_own`, `listing.counter_offer.respond`

**Prompt**

```text
Build the farmer marketing screens in `apps/farmer-mobile`.

Endpoints from `docs/openapi.yaml`: `GET /fair-prices`, `POST /listings` (requires `Idempotency-Key`), `GET /listings`, `PATCH /listings/{id}`, `POST /listings/{id}/withdraw`, `POST /listings/{id}/counter-offers/{offerId}/accept`, `.../reject`, `.../counter`.

Create-listing: as soon as crop and grade are chosen, fetch and display the fair-price ceiling in effect — BEFORE the farmer types a price, not as an error afterwards. Inline validation mirrors the ceiling, but the server is authoritative: still handle 422 `PRICE_ABOVE_CEILING` and render it against the price field. Also handle 403 `CERT_EXPIRED` and `CERT_UNVERIFIED` with a route to the certification screen. Write the failing test first, named `BR-07: ...` (`docs/rules.md`).

Listing history with sold and unsold tabs backed by the `status` query parameter.

Counter-offer detail: the countdown is computed from the server's `expiresAt` (`docs/rules.md` BR-10, 24 hours), the remaining counter-back rounds come from the server's round number (`docs/rules.md` BR-11, at most 3), and the counter-back control disables after round 3. Write a test named `BR-11: ...`. Handle 409 `COUNTER_OFFER_EXPIRED` and `COUNTER_LIMIT_REACHED` by refreshing the screen into its true state, not by showing a toast over stale data. A push notification for a counter-offer deep-links straight into this screen through the deep-link config in `src/navigation`.

Traps. Device clocks are wrong in the field: derive remaining time from the server timestamp plus monotonic elapsed time, and re-fetch when the app returns to the foreground. Disabling a button is UX only — the server decides, so every disabled path must still handle its 409. One idempotency key per submit attempt, reused across retries, so a farmer tapping twice on a slow network does not create two listings or two counter rounds. `docs/openapi.yaml` tags these operations `BR-02`, `BR-07` and `BR-08`, which are different rules in `docs/rules.md`; use the `docs/rules.md` IDs in test names. `pnpm spec:drift` guards these IDs in CI, so a mismatch is a build failure, not a judgement call.

Report against the Definition of Done in CLAUDE.md §6. If a rule in docs/ is ambiguous or wrong, stop and say so rather than guessing.
```

**Verify**

```bash
pnpm typecheck
pnpm lint
pnpm --filter @tohfa/farmer-mobile test -t 'BR-07'
pnpm --filter @tohfa/farmer-mobile test -t 'BR-11'
pnpm --filter @tohfa/farmer-mobile test
```

**Done**

- [ ] The ceiling for the chosen crop and grade is visible before the price field is touched.
- [ ] Tests named BR-07 and BR-11 exist and failed before implementation.
- [ ] 422 PRICE_ABOVE_CEILING, 403 CERT_EXPIRED and 403 CERT_UNVERIFIED all render actionable states.
- [ ] Listing history sold/unsold tabs query the API by status.
- [ ] The counter-offer countdown derives from the server's expiresAt and survives a wrong device clock.
- [ ] Counter-back is disabled after round 3 and the 409 COUNTER_ROUNDS_EXHAUSTED path still works when it is not.
- [ ] A counter-offer push deep-links to the counter-offer screen.
- [ ] Each submit reuses one Idempotency-Key across retries.

> **Watch for.** The countdown and round limit implemented as client truth — check that an expired or exhausted state returned by the server overrides whatever the screen was showing, rather than the screen deciding on its own.

---

## Day 20

### S-46 — Farmer app hardening: states, token refresh, upload resume, offline honesty, accessibility, E2E flow

**3h** · `farmer-mobile + api` · after `S-43`, `S-44`, `S-45` · rules `BR-36`

**Goal.** Every farmer screen has a loading, empty and error state, a session survives an access-token expiry, a failed upload resumes, and one automated flow proves register → list produce → respond to a counter-offer end to end.

**Prompt**

```text
Harden `apps/farmer-mobile` and fix whatever the hardening exposes in `apps/api`.

1. Loading, empty and error states on every screen, using the `Skeleton`, `EmptyState` and `ErrorState` components rather than ad-hoc spinners. An error state names what failed and offers a retry that actually retries the failed query.

2. Token refresh mid-session in `apps/farmer-mobile/src/api/client.ts`: on a 401, refresh once via `POST /auth/refresh`, then replay the original request. Refresh tokens rotate, so concurrent 401s must collapse into a SINGLE refresh call with the other requests queued behind it — a per-request refresh burns rotated tokens and logs the farmer out mid-task. Write that concurrency test first: five parallel 401s, exactly one `POST /auth/refresh`. A genuinely failed refresh clears the Keychain and returns to login without losing an in-progress draft.

3. A failed upload resumes rather than restarting, honouring the `resumable` flag from `POST /uploads/sign`.

4. Offline detection with an honest state: full offline sync is deferred (`apps/farmer-mobile/CLAUDE.md`). Say "you are offline", say what is saved on the device, and do not claim anything was submitted. `NetworkError` in the client already carries this distinction — do not conflate it with `ApiError`.

5. Accessibility pass: every interactive element at least `theme.minTouchTarget`, accessibility labels and roles on controls, and a contrast check of the token colour pairs actually used. Assert both in tests, not by eye.

6. A Maestro or Detox flow covering register → list produce → respond to a counter-offer against a seeded API. Commit it under `apps/farmer-mobile/.maestro/` (or `e2e/`) with the script wired into `package.json`.

Traps. Do not paper over an API defect in the app: if the flow needs a field or status the API does not return, change `apps/api` and `docs/openapi.yaml` together and keep `pnpm spec:lint` green, or report it. Own-data scoping (`docs/rules.md` BR-36) is server-side — do not add client-side id filtering that hides a leak instead of reporting it.

Report against the Definition of Done in CLAUDE.md §6. If a rule in docs/ is ambiguous or wrong, stop and say so rather than guessing.
```

**Verify**

```bash
pnpm typecheck
pnpm lint
pnpm --filter @tohfa/farmer-mobile test -t 'refresh'
pnpm --filter @tohfa/farmer-mobile test
pnpm test
pnpm spec:lint
maestro test apps/farmer-mobile/.maestro/golden-thread.yaml
```

**Done**

- [ ] Every screen has a loading, empty and error state built from the shared components.
- [ ] A test proves five concurrent 401s produce exactly one POST /auth/refresh and all five requests succeed after it.
- [ ] A failed refresh returns to login without discarding an in-progress registration draft.
- [ ] A killed upload resumes instead of restarting from zero.
- [ ] The offline state is distinguishable from a server error and never claims a submission succeeded.
- [ ] Touch-target and contrast assertions exist as tests.
- [ ] The register → list → counter-offer flow runs green from the committed script.
- [ ] Any API change made along the way is reflected in docs/openapi.yaml and spec:lint passes.

> **Watch for.** A refresh implementation that fires one refresh per in-flight request — with rotating refresh tokens that logs the user out under exactly the conditions this story exists to fix.

---

# Week 5 — Customer app and launch

*Days 21–25 · 7 stories · 24.0 hours*

| Story | Day | h | App | Title |
|---|---|---|---|---|
| `S-47` | 21 | 3 | customer-mobile | Customer app scaffold and auth, with the component library lifted into a shared package |
| `S-48` | 22 | 4 | customer-mobile | Customer browse: home, categories, product grid, product detail, search — farm-anonymous |
| `S-49` | 23 | 4 | customer-mobile | Customer cart, wallet-first checkout, top-up recovery and live order tracking |
| `S-50` | 23 | 2.5 | api | Push and SMS transports for the notification service, with retry and a dead-letter queue |
| `S-51` | 24 | 3.5 | ops | Device matrix pass on the stated baselines: iOS 13, Android 8 (API 26), throttled 4G performance |
| `S-52` | 24 | 4 | ops | Store submission: icons, splash, listings, privacy and data safety, internal test tracks |
| `S-53` | 25 | 3 | ops | Launch readiness review: golden-thread demo, decision register, spec defects, deferrals, Phase-2 roadmap |

## Day 21

### S-47 — Customer app scaffold and auth, with the component library lifted into a shared package

**3h** · `customer-mobile` · after `S-41`, `S-11` · rules `BR-32`

**Goal.** apps/customer-mobile has navigation and a full auth flow built from a shared UI package that both mobile apps consume, with instant activation and a measured sub-60-second path from registration to first authenticated screen.

**Permissions.** `customer.self_register`, `auth.otp.request`, `auth.session.login`

**Prompt**

```text
Scaffold `apps/customer-mobile` and build its auth surface: splash, onboarding, registration, OTP verification, login, forgot password, reset password.

First, the structural requirement. The component library built for the farmer app must be SHARED, not forked. Create a workspace package `packages/mobile-ui` (`@tohfa/mobile-ui`), MOVE Button, Card, Input, the sticky Cancel/Save footer, Badge, EmptyState, ErrorState, Skeleton and `Icon` into it, update `apps/farmer-mobile` to import from it, and add it to both apps' `package.json` and `tsconfig.json` paths. Components take their palette from the app's `src/theme`, which is the only thing that differs: `apps/customer-mobile/src/theme/index.ts` already leads with Deep Blue. Copy-pasting a component into `apps/customer-mobile/src/components` is the failure mode this story exists to prevent — add a test or lint rule that fails if a file under one app's `src` imports from the other app's `src`, and watch it fail before you move anything.

Endpoints from `docs/openapi.yaml`: `POST /auth/register/customer`, `POST /auth/otp/send`, `POST /auth/otp/verify`, `POST /auth/login`, `POST /auth/forgot-password`, `POST /auth/reset-password`, `GET /auth/me`. Customers are activated instantly once the mobile OTP verifies — there is no admin review and no application-status timeline; do not port the farmer flow. Enforce `docs/rules.md` BR-32 the same way as the farmer app: resend timer and lockout come from `resendAvailableAt` and `attemptsRemaining`, never from a local counter. Name the test `BR-32: ...`.

Target: registration to first authenticated screen in under 60 seconds on a mid-range device. Instrument it, measure it on a real device or an equivalently throttled emulator, and record the number in your summary. Minimise blocking steps — nothing optional in the registration form, and no gratuitous full-screen splash delay.

All strings are keys in `apps/customer-mobile/src/i18n/en.json` with `ta.json` stubs.

Report against the Definition of Done in CLAUDE.md §6. If a rule in docs/ is ambiguous or wrong, stop and say so rather than guessing.
```

**Verify**

```bash
pnpm typecheck
pnpm lint
pnpm --filter @tohfa/customer-mobile test -t 'BR-32'
pnpm --filter @tohfa/customer-mobile test
pnpm --filter @tohfa/farmer-mobile test
test ! -d apps/customer-mobile/src/components/Button && echo 'no forked Button'
grep -rn "farmer-mobile/src\|customer-mobile/src" apps/*/src || echo 'no cross-app imports'
```

**Done**

- [ ] packages/mobile-ui exists, both apps depend on it, and the farmer app's imports were updated rather than duplicated.
- [ ] A test or lint rule fails on a cross-app src import and on a duplicated component.
- [ ] Splash, onboarding, registration, OTP, login, forgot password and reset password all work against the real endpoints.
- [ ] Registration activates the customer instantly — no admin-review screen was ported from the farmer app.
- [ ] A test named `BR-32: ...` asserts the resend timer and lockout come from server fields.
- [ ] The customer app renders in Deep Blue with no change to the shared components.
- [ ] A measured registration-to-authenticated-screen time on a mid-range device is recorded, with the number stated.

> **Watch for.** The shared package created but the farmer app left importing its own local copies, leaving two divergent libraries — check apps/farmer-mobile/src/components is gone, not merely unused.

---

## Day 22

### S-48 — Customer browse: home, categories, product grid, product detail, search — farm-anonymous

**4h** · `customer-mobile` · after `S-47` · rules `BR-16`

**Goal.** A customer can browse home, categories, the product grid, product detail and search, and an automated test proves no farm or farmer identity reaches any of those screens.

**Permissions.** `catalog.browse`, `catalog.farm_identity.view`

**Prompt**

```text
Build the customer browse surface in `apps/customer-mobile` using `@tohfa/mobile-ui`.

Endpoints from `docs/openapi.yaml`: `GET /catalog/home` (hero banners, categories, featured), `GET /catalog/categories` (the 6-category grid), `GET /catalog/products` (filter chips for `categoryId`, `grade`, `warehouseId`; sort chips for `PRICE_ASC`, `PRICE_DESC`, `NAME_ASC`, `NEWEST`), `GET /catalog/products/{id}` (photos, grade, quantity picker, certification badges), `GET /catalog/search?q=`.

`docs/rules.md` BR-16 is the defining constraint of this app and is client-locked. No farmer name, farmer id, farm name, village, GPS coordinate or FMB data appears on a product card, in search results, on product detail, or anywhere else. Write the failing test FIRST, named `BR-16: ...`: walk the rendered tree of every screen in this story and walk the parsed API payload that fed it, and assert field-by-field against a farmer-identity denylist (`farmerId`, `farmer_id`, `farmName`, `farmId`, `village`, `taluk`, `latitude`, `longitude`, `gps`, `fmb`, `polygon`) — not by eyeballing a snapshot. If an API response CONTAINS such a field, the test must fail and you must report it as an API leak to be fixed in the catalog serializer. Do not delete the field in the client; a client-side strip hides the breach from the test and leaves it live for anyone with the same token and curl.

Also: a `REJECT` grade product must never render — assert it.

Search has recent and trending. Recent searches are device-local. There is NO trending endpoint in `docs/openapi.yaml`: either derive the row from `GET /catalog/home` featured content and label it accordingly, or stop and flag the gap. Do not invent an endpoint.

Traps. Note that `docs/openapi.yaml` tags these operations `BR-14` where `docs/rules.md` calls the anonymity rule `BR-16`; use the `docs/rules.md` ID in test names. `pnpm spec:drift` guards these IDs in CI, so a mismatch is a build failure, not a judgement call. Product images must be rendered from the catalog URLs only — do not add any "about the farm" affordance, however tempting for trust. Certification badges and grade are the entire provenance story a customer sees.

Report against the Definition of Done in CLAUDE.md §6. If a rule in docs/ is ambiguous or wrong, stop and say so rather than guessing.
```

**Verify**

```bash
pnpm typecheck
pnpm lint
pnpm --filter @tohfa/customer-mobile test -t 'BR-16'
pnpm --filter @tohfa/customer-mobile test
grep -rniE 'farmer|farmName|village|fmb|latitude|longitude' apps/customer-mobile/src || echo 'no farm identity in customer app source'
```

**Done**

- [ ] Home, 6-category grid, product grid with filter and sort chips, product detail with quantity picker, and search all render from the real endpoints.
- [ ] A test named `BR-16: ...` walks both the rendered tree and the API payload against a farmer-identity denylist and failed before implementation.
- [ ] The test fails, rather than silently passing, when a mocked API response carries a farm field — proven with a fixture.
- [ ] REJECT-grade products never render.
- [ ] Recent searches are local; the trending row is either derived from /catalog/home with an honest label or reported as a gap.
- [ ] No invented endpoints; no client-side stripping of farm fields.

> **Watch for.** A BR-16 test that only inspects rendered text — confirm it also asserts on the raw API payload, so an API leak is caught even when the UI happens not to display the field.

---

## Day 23

### S-49 — Customer cart, wallet-first checkout, top-up recovery and live order tracking

**4h** · `customer-mobile` · after `S-48` · rules `BR-17`, `BR-21`, `BR-22`

**Goal.** A customer can hold a locked cart, check out against their wallet, recover from an insufficient balance without losing the cart, and watch the order progress live.

**Permissions.** `cart.manage_own`, `order.place`, `wallet.topup.digital`, `wallet.checkout.enforce_wallet_first`, `order.delivery_status.view`

**Prompt**

```text
Build cart, checkout, tracking and order history in `apps/customer-mobile`.

Endpoints from `docs/openapi.yaml`: `GET/PUT/DELETE /cart`, `POST /cart/items`, `POST /orders` (requires `Idempotency-Key`), `GET /orders`, `GET /orders/{id}`, `GET /orders/{id}/tracking`, `GET /orders/{id}/events` (SSE), `POST /orders/{id}/reorder`, `GET /wallets/me`, `POST /wallets/me/topups`.

Cart: show the 24-hour lock (`docs/rules.md` BR-22) as a visible countdown from the server's `lockExpiresAt`, and handle 409 `CART_LOCK_EXPIRED`, 409 `STOCK_UNAVAILABLE` and 409 `INSUFFICIENT_ALLOCATION` with a re-check path rather than a dead toast. Write the failing test first, named `BR-22: ...`.

Checkout: review, address and warehouse-pickup picker on a map, delivery slot picker, wallet-first payment (`docs/rules.md` BR-17). Test named `BR-17: ...`. An insufficient balance returns 422 `WALLET_INSUFFICIENT` with the shortfall: prompt an inline top-up prefilled with the shortfall, run `POST /wallets/me/topups` and the gateway SDK, and return the customer to checkout WITH THE CART INTACT and the lock state re-read. The client never asserts the credit — the wallet is credited by the signed webhook, so poll `GET /wallets/me` until it reflects. An insufficient balance must never dead-end: assert the recovery path in a test.

Tracking: 5-state timeline over SSE from `/orders/{id}/events`, resuming with `Last-Event-ID`, tolerating the 20-second keepalive comment, and falling back to polling `/orders/{id}/tracking` when the stream drops. Order history with one-tap reorder that surfaces the `unavailable` lines instead of hiding them.

Traps. `docs/rules.md` BR-21 is CONTESTED and Track 1 is pickup-only: delivery slots are modelled but nothing routes a delivery, and no order may reach `out_for_delivery`. Build the warehouse-pickup picker as the primary path; render the delivery slot option only if the API actually accepts `fulfillmentType: HOME_DELIVERY`, and stop and flag against "Open contradictions" row 3 rather than shipping a delivery UI nobody can serve. Generate ONE idempotency key per checkout attempt and reuse it on retry — regenerating it on each tap is a double charge. Money is a `Money` string; never `parseFloat` a balance or a total.

Report against the Definition of Done in CLAUDE.md §6. If a rule in docs/ is ambiguous or wrong, stop and say so rather than guessing.
```

**Verify**

```bash
pnpm typecheck
pnpm lint
pnpm --filter @tohfa/customer-mobile test -t 'BR-17'
pnpm --filter @tohfa/customer-mobile test -t 'BR-22'
pnpm --filter @tohfa/customer-mobile test
grep -rn 'parseFloat\|Number(' apps/customer-mobile/src | grep -i 'balance\|total\|amount' || echo 'no float money'
```

**Done**

- [ ] The 24-hour cart lock is visible and counts down from the server's lockExpiresAt.
- [ ] Tests named BR-17 and BR-22 exist and failed before implementation.
- [ ] 422 INSUFFICIENT_WALLET_BALANCE leads to a prefilled top-up and back to checkout with the cart and lock intact — asserted in a test.
- [ ] The client never marks the wallet credited itself; it re-reads GET /wallets/me.
- [ ] One Idempotency-Key per checkout attempt, reused across retries.
- [ ] SSE tracking resumes with Last-Event-ID and falls back to polling when the stream drops.
- [ ] Reorder shows unavailable lines rather than silently dropping them.
- [ ] The pickup path is primary; any delivery affordance is either API-supported or flagged against contradiction 3.

> **Watch for.** The top-up detour losing the cart or the lock — re-run checkout after a top-up and confirm the same cart, same lock deadline and same idempotency key come back.

---

### S-50 — Push and SMS transports for the notification service, with retry and a dead-letter queue

**2.5h** · `api` · after `S-15` · rules `BR-18`, `BR-32`

**Goal.** Notifications actually leave the building: FCM push with per-type deep links and SMS behind a provider adapter, both retried, both recorded, neither silently dropped.

**Permissions.** `notification.own.view`, `notification.template.configure`

**Prompt**

```text
Attach real push and SMS transports to the notification service in `apps/api`. Follow the module shape in `apps/api/src/modules/_example/` — routes, schema, service, repo, test.

SMS: an adapter interface with `mock`, `msg91` and `twilio` implementations selected by `SMS_PROVIDER`, which already exists in `apps/api/src/config.ts` alongside `MSG91_AUTH_KEY`. Mirror the payment-gateway adapter pattern exactly; no vendor SDK type may appear in a service signature. `TWILIO_*` keys are absent from `config.ts` and `.env.example` — add them there, do not read `process.env` inline.

Push: FCM using `FCM_SERVER_KEY`, with a device-token registry. `db/migrations/` currently ends at `0008_platform.sql` and there is no device-token table — add the next unused migration (check the directory first) creating `device_tokens` (user id, token unique, platform, app, locale, last seen, revoked) with a `-- +migrate Down`. Never modify a migration that has already run. Each notification type carries a deep link matching the route names registered in the two mobile apps' navigation configs; keep the type → link map in one table-driven place so a missing mapping is a compile or test failure, not a silent no-op.

Delivery: enqueue through the existing BullMQ queue in `apps/api/src/jobs/queue.ts` — add the job to `JOB_REGISTRY` and its handler to `worker.ts`; exhausted retries land in a dead-letter queue. Every send writes to `notifications` with `status`, `provider_message_id` and `error`. A failed SMS is FAILED with the provider error recorded; it is never dropped. Write the failing test first, named `BR-18c: ...` per `docs/rules.md` BR-18: an SMS dispatch failure does not roll back the wallet credit that triggered it, and a retry does not double-credit or double-send.

Traps. Do not dispatch inside the money-moving transaction — enqueue after commit, or a provider timeout rolls back a credit that really happened. De-duplicate on (event, user, channel) so webhook or job redelivery sends once. Never log an OTP code or a full mobile number (`docs/rules.md` BR-32). Update `docs/openapi.yaml` if you add or change any route and keep `pnpm spec:lint` green.

Report against the Definition of Done in CLAUDE.md §6. If a rule in docs/ is ambiguous or wrong, stop and say so rather than guessing.
```

**Verify**

```bash
pnpm typecheck
pnpm lint
pnpm test -- notifications
pnpm test
pnpm spec:lint
pnpm db:migrate && pnpm db:rollback && pnpm db:migrate
grep -n 'TWILIO' apps/api/src/config.ts .env.example
```

**Done**

- [ ] SMS adapters for mock, msg91 and twilio sit behind one interface chosen by SMS_PROVIDER; no vendor type leaks into a service signature.
- [ ] TWILIO_* config is declared in config.ts and .env.example; nothing reads process.env inline.
- [ ] A new migration creates device_tokens with a working Down, and no existing migration was edited.
- [ ] FCM push is sent with a deep link per notification type from one table-driven map.
- [ ] Sends run through the BullMQ registry with retries and a dead-letter queue.
- [ ] A test named `BR-18c: ...` proves a failed SMS neither rolls back the credit nor double-sends on retry.
- [ ] Every attempt writes a notifications row with status, provider_message_id or error.
- [ ] No OTP code or full mobile number appears in a log line.

> **Watch for.** Dispatch called inside the same transaction as the wallet credit — that turns a provider timeout into a lost top-up, which is precisely what BR-18c forbids.

---

## Day 24

### S-51 — Device matrix pass on the stated baselines: iOS 13, Android 8 (API 26), throttled 4G performance

**3.5h** · `ops` · after `S-46`, `S-49`

**Goal.** Both apps are proven to run on the support baselines the project committed to, not just on the newest simulator, with a measured product-detail load time on a mid-range Android over throttled 4G.

**Prompt**

```text
Run and fix a device-matrix pass for `apps/farmer-mobile` and `apps/customer-mobile`.

Baselines: iOS 13 and Android 8.0 (API 26). Run the Detox or Maestro flows from the farmer and customer stories on those baselines, not only on the latest simulator. Confirm `minSdkVersion` and the iOS deployment target in the generated native projects actually match the stated baselines, and that Hermes is enabled on both apps.

Note the conflict before you start: `apps/farmer-mobile/README.md` names the real target as a low-end 2GB-RAM Android 10 device, while the stated support baseline is Android 8 / API 26. Establish which is authoritative, record the answer, and test the LOWER of the two.

Expect the baseline to break things the modern simulator hides: `Intl` and locale-aware date/number formatting on API 26, `structuredClone`, `Array.prototype.at`, RegExp lookbehind, TLS roots for the API domain, SVG and font rendering for Noto Sans Tamil, and SSE behaviour on old WebView/network stacks. Fix what breaks; where a fix means a polyfill, add it once at the app entry and note the size cost.

Performance: product detail must render in under 1.5s on a mid-range Android over throttled 4G. Measure it — cold start and warm — with a repeatable method (`adb shell am start -W`, a network-throttled profile, and an in-app TTI mark), run it at least three times, and record medians. If it misses, fix the cause (image sizes, over-fetching, blocking JSON parses, a serial waterfall of `/catalog/products/{id}` then badges) and re-measure.

Deliverable: `docs/launch/device-matrix.md` with a row per device and OS, pass/fail per flow, the measured timings, and the list of what was fixed. An untested row must say untested — do not infer a pass from a nearby device.

Traps. A green run on an emulator claiming API 26 but running an x86 image with a modern WebView is not a baseline pass; say which images and which physical devices were used. Do not raise the baseline to make the tests pass — that is a scope change the client has to agree to.

Report against the Definition of Done in CLAUDE.md §6. If a rule in docs/ is ambiguous or wrong, stop and say so rather than guessing.
```

**Verify**

```bash
pnpm typecheck
pnpm lint
cat docs/launch/device-matrix.md
grep -n 'minSdkVersion' apps/farmer-mobile/android/build.gradle apps/customer-mobile/android/build.gradle
maestro test apps/farmer-mobile/.maestro/golden-thread.yaml
maestro test apps/customer-mobile/.maestro/golden-thread.yaml
```

**Done**

- [ ] Both apps launch and complete their E2E flows on iOS 13 and Android 8 (API 26).
- [ ] minSdkVersion and the iOS deployment target match the stated baselines, and Hermes is on for both apps.
- [ ] The README's Android 10 / 2GB target versus the API 26 baseline conflict is resolved and recorded.
- [ ] Product detail median load time on a mid-range Android over throttled 4G is measured, recorded and under 1.5s — or the miss is documented with its cause.
- [ ] docs/launch/device-matrix.md lists every device, OS, flow result and fix, with untested rows marked untested.
- [ ] No baseline was raised to make a test pass.

> **Watch for.** Results reported from a modern emulator with an API-26 label — check the doc names the concrete system images and physical devices used, and that the timings were taken more than once.

---

### S-52 — Store submission: icons, splash, listings, privacy and data safety, internal test tracks

**4h** · `ops` · after `S-51` · rules `BR-16`, `BR-33`

**Goal.** Both apps exist as installable builds on Play internal testing and TestFlight, with store listings, a privacy policy and data-safety declarations that match what the apps actually collect.

**Prompt**

```text
Prepare and submit both mobile apps to the stores.

Assets: app icons and splash screens for `apps/farmer-mobile` (TOHFA Teal) and `apps/customer-mobile` (Deep Blue), generated from the branding pack at every required density for iOS and Android. Colours come from `packages/design-tokens/src/tokens.json` — no eyeballed hex.

Listings: title, short and long description, screenshots at the required sizes, and category, for both apps in English. Write them into `docs/launch/store-listing-farmer.md` and `docs/launch/store-listing-customer.md` so the client can review the text before it is pasted into a console.

Privacy policy and data-safety declarations: `docs/launch/privacy-policy.md` plus a filled Play Data Safety form and an Apple privacy nutrition label per app. These must match what the code actually collects. The farmer app collects Aadhaar (`docs/rules.md` BR-33), mobile number, precise GPS location, camera images and documents. The customer app collects mobile number, address and payment identifiers — and MUST NOT declare any farm data, because it never receives any (`docs/rules.md` BR-16). Cross-check the declarations against the permissions actually requested in each `AndroidManifest.xml` and `Info.plist`, and against the fields the apps send. A declaration that does not match the manifest is the single most common rejection.

Distribution: an Android App Bundle uploaded to the Play internal test track and an iOS build uploaded to TestFlight, for both apps. Record bundle ids, version and build numbers, signing key locations (never the keys themselves) and the tester group in `docs/launch/release-checklist.md`.

Budget the day accordingly: first-time Apple provisioning — certificates, identifiers, profiles, App Store Connect records, the first upload and its export-compliance answers — is historically most of a day on its own. Do that first, not last.

Traps. Never commit a keystore, a `.p12`, an App Store Connect API key or a service-account JSON — reference where they live. Aadhaar and precise location require an explicit prominent-disclosure justification on Play; write it. Version and build numbers must be distinct per app, not shared.

Report against the Definition of Done in CLAUDE.md §6. If a rule in docs/ is ambiguous or wrong, stop and say so rather than guessing.
```

**Verify**

```bash
ls docs/launch/store-listing-farmer.md docs/launch/store-listing-customer.md docs/launch/privacy-policy.md docs/launch/release-checklist.md
git status --porcelain | grep -Ei '\.(keystore|jks|p12|mobileprovision)$|service-account' || echo 'no secrets staged'
grep -n 'permission' apps/farmer-mobile/android/app/src/main/AndroidManifest.xml
ls apps/farmer-mobile/android/app/build/outputs/bundle/release/*.aab apps/customer-mobile/android/app/build/outputs/bundle/release/*.aab
```

**Done**

- [ ] Icons and splash screens exist at every required density for both apps, generated from token colours.
- [ ] Store listing text for both apps is committed under docs/launch/ for client review.
- [ ] The privacy policy and both data-safety declarations match the permissions in the manifests and the fields the apps actually send.
- [ ] The customer app's declaration contains no farm or farmer data.
- [ ] Aadhaar and precise-location prominent-disclosure justifications are written.
- [ ] An AAB is on the Play internal test track and an iOS build is on TestFlight, for both apps.
- [ ] docs/launch/release-checklist.md records bundle ids, versions, build numbers, key locations and tester groups.
- [ ] No signing material or API key is committed.

> **Watch for.** Data-safety answers written from the story description rather than from the manifests — diff the declared collection against the actual runtime permissions and request payloads of each app.

---

## Day 25

### S-53 — Launch readiness review: golden-thread demo, decision register, spec defects, deferrals, Phase-2 roadmap

**3h** · `ops` · after `S-50`, `S-51`, `S-52` · rules `BR-16`, `BR-21`, `BR-38`

**Goal.** The client receives an evidenced picture of what was built, what was assumed on their behalf, what is provably wrong in the specification, what was deferred and what Phase 2 costs.

**Permissions.** `auditlog.view`

**Prompt**

```text
Run the launch readiness review and produce the handover documents under `docs/launch/`.

1. Golden-thread demo on staging across all three apps, executed and evidenced end to end: farmer registers and is approved, farmer lists produce under the fair-price ceiling, admin counter-offers, farmer responds, goods receipt and allocation, customer browses and checks out wallet-first, pickup OTP handover, farmer payout. Record each step with the endpoint hit and the resulting state. Any step that cannot be completed is written down as not completed, with the blocker — do not narrate around a gap.

2. `docs/launch/decision-register.md`: every decision taken on the client's behalf, with the assumption, why it was needed, what it cost to change later, and who must confirm it. Cross-reference every row of the "Open contradictions" table in `docs/rules.md`: each is either answered by the client, or listed as still open with the risk it carries. Do not quietly close one.

3. `docs/launch/spec-defects.md`: defects in the ground-truth files themselves, each with evidence. Two are already provable in this repo and must be verified and quantified, not merely repeated: (a) the `x-business-rules` IDs in `docs/openapi.yaml` do not correspond to the `BR-xx` IDs in `docs/rules.md` — for example farm anonymity is `BR-14` in the spec and `BR-16` in the rules, wallet-first is `BR-12` versus `BR-17`, OTP hardening `BR-19` versus `BR-32`, the price ceiling `BR-02` versus `BR-07`; and (b) most `x-permission` values in `docs/openapi.yaml` do not exist in `docs/rbac.json` (`cart.read_own` versus `cart.manage_own`, `order.create_own` versus `order.place`, `wallet.read_own` versus `wallet.own.view`). Run `pnpm spec:drift` (the guard already exists) and paste its real output as evidence the four ground-truth files are still mutually consistent.

4. `docs/launch/deferrals.md`: what was consciously not built — FMB polygon drawing and the 26-zone editor, offline sync, delivery routing (`docs/rules.md` BR-21), B2B and Horeca channels, RMA, audits and ratings, advisory automation (BR-38) — each with a size in days and what unblocks it.

5. `docs/launch/phase-2-roadmap.md`: sequenced and sized, dependencies named.

Trap: an honest "not done" is worth more here than a confident summary. State coverage as a number, from the test suite, not as an adjective.

Report against the Definition of Done in CLAUDE.md §6. If a rule in docs/ is ambiguous or wrong, stop and say so rather than guessing.
```

**Verify**

```bash
pnpm exec tsx scripts/check-spec-drift.ts; echo "exit=$?"
ls docs/launch/decision-register.md docs/launch/spec-defects.md docs/launch/deferrals.md docs/launch/phase-2-roadmap.md
pnpm typecheck && pnpm lint && pnpm test
pnpm spec:lint
pnpm rbac:check
grep -c '^|' docs/launch/decision-register.md
```

**Done**

- [ ] The golden thread was executed on staging across all three apps, with each step's endpoint and resulting state recorded, and any incomplete step named with its blocker.
- [ ] docs/launch/decision-register.md covers every assumption and every row of the Open contradictions table, each either answered or explicitly still open.
- [ ] scripts/check-spec-drift.ts exists, runs as `pnpm spec:drift`, exits non-zero on drift, and its real output is quoted in docs/launch/spec-defects.md.
- [ ] Both known spec defects are verified with counts rather than restated.
- [ ] docs/launch/deferrals.md sizes each deferral in days and names what unblocks it.
- [ ] docs/launch/phase-2-roadmap.md is sequenced, sized and dependency-aware.
- [ ] Test coverage is reported as a number from the suite.

> **Watch for.** A readiness document that reads as a success summary — check that every failed or unrun golden-thread step and every unanswered contradiction appears by name, and that the drift script actually runs and fails.

---

# Appendix A — Business rule index

Which story implements which rule. A rule with no story is out of Track 1 scope; see `docs/rules.md` § "Rules NOT enforced in Track 1".

| Rule | Description | Implemented by |
|---|---|---|
| `BR-01` | Expired certificate blocks market listings | `S-14`, `S-21`, `S-30`, `S-39`, `S-44` |
| `BR-02` | Unverified certificate blocks market listings; verification is manual | `S-14`, `S-21`, `S-30`, `S-39`, `S-44` |
| `BR-03` | Four audits per year, one per quarter | *not in Track 1* |
| `BR-04` | Audit rating scale and compliance tiers | `S-01` |
| `BR-05` | Major violation count red-flag threshold | *not in Track 1* |
| `BR-06` | Farm rating is 10 categories x 10 points | *not in Track 1* |
| `BR-07` | Listing price must not exceed the fair price ceiling | `S-17`, `S-21`, `S-30`, `S-39`, `S-45` |
| `BR-08` | Fair price ceiling is set by Super Admin only | `S-01`, `S-17`, `S-18`, `S-39` |
| `BR-09` | Retail price must be at or below the ceiling | `S-17`, `S-18` |
| `BR-10` | Counter-offer response window is 24 hours | `S-22`, `S-23`, `S-24`, `S-25`, `S-30`, `S-39`, `S-45` |
| `BR-11` | Counter-offers may be countered back at most 3 times | `S-22`, `S-23`, `S-24`, `S-30`, `S-39`, `S-45` |
| `BR-12` | Reserve allocation is 70 / 10 / 10 / 10 | `S-27`, `S-28`, `S-30`, `S-34`, `S-39`, `S-40` |
| `BR-13` | B2B and Horeca draw from consolidated inventory | `S-01`, `S-27` |
| `BR-14` | Farmer subscription is Rs 500/year with a free tier | `S-21` |
| `BR-15` | Four sales channels | `S-35` |
| `BR-16` | Customer view is farm-anonymous | `S-12`, `S-29`, `S-30`, `S-38`, `S-39`, `S-48`, `S-52`, `S-53` |
| `BR-17` | Wallet-first checkout | `S-01`, `S-31`, `S-32`, `S-35`, `S-39`, `S-49` |
| `BR-18` | Cash top-up credits the wallet server-side after the fiscal cash tag | `S-33`, `S-39`, `S-50` |
| `BR-19` | Cash top-up is capped at Rs 10,000 per transaction | `S-33`, `S-39` |
| `BR-20` | Handover requires a 4-digit OTP | `S-01`, `S-36`, `S-39` |
| `BR-21` | Every order supports warehouse pickup | `S-01`, `S-35`, `S-36`, `S-49`, `S-53` |
| `BR-22` | Cart items are locked for 24 hours | `S-34`, `S-35`, `S-39`, `S-49` |
| `BR-23` | Four fixed warehouses | `S-40` |
| `BR-24` | Warehouses hold consolidated inventory across all farmers | `S-26`, `S-29`, `S-30` |
| `BR-25` | Each warehouse has its own Sub Warehouse Admin | *not in Track 1* |
| `BR-26` | Inter-warehouse transfers only by Main Warehouse Admin and Super Admin | *not in Track 1* |
| `BR-27` | Customers may pick up from any warehouse | *not in Track 1* |
| `BR-28` | Admin creation is strictly hierarchical | `S-39` |
| `BR-29` | Farmer Admin cannot act on their own listings | `S-22`, `S-23`, `S-30`, `S-39` |
| `BR-30` | Sub Warehouse Admin is scoped to one warehouse | `S-24`, `S-25`, `S-28`, `S-30`, `S-36`, `S-39` |
| `BR-31` | Payouts over Rs 10,000 require dual approval | `S-37`, `S-39`, `S-40` |
| `BR-32` | OTP hardening: 6-digit, 60s resend, 3-attempt lockout | `S-11`, `S-20`, `S-42`, `S-47`, `S-50` |
| `BR-33` | Aadhaar and mobile are locked fields | `S-01`, `S-13`, `S-16`, `S-43`, `S-44`, `S-52` |
| `BR-34` | Reactivating a disabled farmer is Super Admin only | *not in Track 1* |
| `BR-35` | The audit trail is append-only | `S-16`, `S-31`, `S-36`, `S-39` |
| `BR-36` | Own-data ownership for farmers and customers | `S-13`, `S-44`, `S-46` |
| `BR-37` | Stock movements are ledger-first; adjustments need separate approval | `S-26`, `S-28`, `S-30` |
| `BR-38` | No automated processes (manual data entry) | `S-01`, `S-14`, `S-15`, `S-53` |

---

# Appendix B — Definition of Done

Applies to every story. The agent is instructed to report against this list; the developer verifies it.

- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm test` passes, and the new tests failed before the implementation existed
- [ ] Every business rule touched has a test named with its `BR-xx` ID
- [ ] Every new route has a `requirePermission` code that exists in `docs/rbac.json`
- [ ] `pnpm spec:lint` and `pnpm spec:drift` pass
- [ ] Mutating admin actions write an `audit_log` row inside the same transaction
- [ ] No hard-coded colours, spacing, strings or business thresholds
- [ ] Merged to `main` and auto-deployed to staging

---

# Appendix C — The seven things that must never be wrong

If review time is short, spend it here. These are the places where a plausible-looking bug costs real money, leaks a farmer's identity, or grants authority nobody intended.

| # | Thing | Story | The failure |
|---|---|---|---|
| 1 | RBAC scope filters | built into the base repo, used everywhere | A Sub Warehouse Admin reads another warehouse's stock. Cross-scope reads must return **empty**, never 403 — a 403 leaks that the row exists. |
| 2 | Counter-offer state machine | `S-22` | Double-accept race, counter after expiry, a 4th counter, or a Farmer Admin approving their own listing. |
| 3 | Stock ledger | `S-26` | Anything writing `inventory_batches.qty_available` directly. The ledger is the only writer. |
| 4 | Wallet ledger | `S-31` | A float, a replayed idempotency key moving money twice, or a direct write to `wallets.balance`. |
| 5 | Allocation engine | `S-27` | Buckets that do not sum exactly to the batch quantity after rounding; online orders consuming more than the online bucket. |
| 6 | Farm-anonymous serializer | `S-29`, `S-48` | A new internal field leaking to customers. The serializer is an **allow-list** for exactly this reason. |
| 7 | Dual-approval payouts | `S-37` | The initiator approving their own payout, or one approval releasing a payment over Rs 10,000. |

---

# Appendix D — Escalate, do not guess

The agent is instructed to stop rather than invent. When it stops, this is who resolves it.

| Situation | Resolution |
|---|---|
| A rule in `docs/rules.md` is ambiguous | Check § "Open contradictions". If listed, the stated default applies. If not, ask the client. |
| The two source documents disagree | `docs/rbac.json` `conflictPrecedence`: Requirements Document Ch.6 wins. Flag it to the client anyway. |
| A needed permission does not exist | Add it to `docs/rbac.json` with grants for all 7 roles, in the same commit. Never inline the check. |
| A needed endpoint is not in `docs/openapi.yaml` | Add it to the spec first, then implement. The spec is the contract, not a record of what was built. |
| A migration is needed | New numbered file. **Never** modify a migration that has already run. |
| A test cannot be made to pass | Leave it failing and say why. Do not delete, skip or weaken it. |

---

# Appendix E — Open decisions still owed by the client

Story `S-01` locks these. Every one has a default already implemented in the base repo, so the build is not blocked — but every default is a product choice made on the client's behalf.

The two marked **contradiction** are not questions the client left open; they are places where the Requirements Document and the Role & Feature Matrix state incompatible things. See `docs/rules.md` § "Open contradictions".

| # | Question | Default implemented |
|---|---|---|
| 1 | Fair price update frequency — daily or weekly? | Daily. The schema stores effective_from, so weekly needs no migration. |
| 2 | Counter-offer window and what happens on expiry | 24h per round. On expiry the offer LAPSES and the listing returns to pending — no auto-accept. The document never states this. |
| 3 | Subscription Rs 500/year — what does the free tier actually allow? | Free tier = 5 concurrent active listings. Paid = unlimited. |
| 4 | Reserve allocation 70/10/10/10 confirmed? | Yes, stored as SA-editable config rather than constants. |
| 5 | Farmer ID format | TOHFA-F-YYYY-XXXX as proposed. |
| 6 | Admin ID formats | SA-XXX, TA-XXX, FA-XXX, MW-XXX, SW-{Location}-XX as proposed. |
| 7 | Cash top-up cap Rs 10,000 per transaction? | Yes, enforced server-side and SA-configurable. |
| 8 | Aadhaar — show last 4 or hide entirely? | Store a tokenised reference plus last 4 only; never the full number. Display last 4 to Super Admin only. |
| 9 | Cash on delivery for online orders? | Off for v1. Wallet, UPI, cards, netbanking only. COD breaks the wallet-first model and adds doorstep cash reconciliation. |
| 10 | Delivery charge — flat or distance-based? And what is the delivery radius per warehouse? | Flat Rs 40, waived above Rs 500, no radius limit in v1. Distance-based needs the PostGIS work already scaffolded. |
| 11 | Return window after delivery | 48 hours, as the document proposes. |
| 12 | Multi-role admin assignments allowed? | Yes — modelled as a user_roles join table. Collapsing later is trivial; expanding later is a migration. |
| 13 | **contradiction** — audit scoring says max 100 points but tiers are set at 650/700/750 | Modelled as SA-configurable data seeded on a 0-100 scale (65/70/75). Needs an explicit answer — this is a defect in the source, not one of the doc's 19 open items. |
| 14 | **contradiction** — does home delivery exist in v1? The Role Matrix states 'all orders fulfilled via warehouse pickup' and has zero delivery rows; the Requirements doc describes delivery slots, a doorstep OTP and an out-for-delivery state | Build both, pickup-first. If the client confirms pickup-only, roughly 3-4 hours comes straight back out of Day 10. |

---

*Generated against the TOHFA base repository. Every permission code, `BR-xx` ID and file path in this manual was validated against `docs/rbac.json`, `docs/rules.md` and the repo tree.*