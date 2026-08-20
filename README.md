# TOHFA Platform

Monorepo for TOHFA — the Nilgiris farmer-to-customer produce platform: farmer
onboarding and certification, produce listings with a fair-price ceiling and
counter-offers, warehouse operations across Ooty / Coonoor / Kotagiri / Gudalur,
customer ordering, wallets and farmer payouts.

## Prerequisites

- Node 20.11+ (see `engines`)
- pnpm 9 (`corepack enable && corepack prepare pnpm@9 --activate`)
- Docker + Docker Compose (Postgres 16 + PostGIS, Redis 7)

## Quick start

```bash
cp .env.example .env
pnpm i
docker compose up -d
pnpm db:reset          # rollback --all + migrate + seed
pnpm dev               # API on :3000, admin web on :4200
```

Other entry points: `pnpm dev:worker` (BullMQ worker), `pnpm test`,
`pnpm typecheck`, `pnpm lint`, `pnpm spec:lint`, `pnpm rbac:check`.

## Folder map

```
apps/
  api/              Express 4 + TypeScript REST API. The reference codebase.
    src/modules/_example/   COPY THIS for every new module.
    src/rbac/               Permission resolution — read before touching auth.
  admin-web/        Angular 17 standalone admin console.
  farmer-mobile/    React Native 0.74 farmer app.
  customer-mobile/  React Native 0.74 customer app.
packages/
  shared-types/     Enums, ErrorCode union, Problem, Money. No runtime deps.
  design-tokens/    Brand colours, type scale, spacing. Single source of truth.
db/
  migrations/       Numbered .sql files, applied in order by `pnpm db:migrate`.
  seed/             Reference + demo data.
docs/
  openapi.yaml      API contract. Lint with `pnpm spec:lint`.
  rbac.json         Authorization ground truth. Loaded at runtime by the API.
  rules.md          Business rules (fair price, counter-offers, allocation...).
scripts/
  check-rbac-drift.ts   Fails CI when the DB disagrees with docs/rbac.json.
  new-module.ts         Scaffolds a module from the _example pattern.
```

## Rules of the road

- `docs/rbac.json` is authoritative. Never hard-code a role check in a handler;
  use `requirePermission('some.permission.code')` and the `req.scope` it sets.
- Money is never a float. Use the `Money` helpers in `@tohfa/shared-types`.
- Errors are RFC 9457 problem+json with a stable `code` from the `ErrorCode`
  union — clients switch on `code`, never on message text.
- Every new API module copies `apps/api/src/modules/_example/` verbatim, then
  renames. `pnpm new:module <name>` does that for you.

## Further reading

- `docs/` — OpenAPI contract, RBAC matrix, business rules.
- `AI_BUILD_MANUAL.md` — the build order, story IDs and conventions that every
  agent (human or otherwise) must follow when adding to this repo.
