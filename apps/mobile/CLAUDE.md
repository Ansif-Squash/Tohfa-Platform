# apps/mobile — instructions

React Native 0.74 · TypeScript · TanStack Query · dependency-free i18n. Read the root
`CLAUDE.md` first — this file only adds what's specific to this app.

## One app, not three

This used to be two separate apps (`apps/farmer-mobile`, `apps/customer-mobile`) plus a planned
admin app. It is now **one binary**: one `index.js`, one Android `applicationId`
(`in.tohfa.mobile`), no product flavors, no per-flavor Metro bundles. Which screens a signed-in
user sees is decided at runtime by their account's actual role, the same way the backend has
always worked — one `/auth/login`, one JWT, role-based permissions via `docs/rbac.json`. Do not
describe or design this as three apps, and do not reintroduce a build-time flavor split without
a real reason; see `src/shell/config/flavor.ts` for the one place "flavor" still exists as a
concept (it pins which `roleCode` a login sends — see its docblock).

Code is organized by who it's for, not by build target:

- `src/roles/{farmer,customer,admin}/` — role-scoped screens, navigation, API calls, theme.
- `src/shell/` — code that ships regardless of role: the API client, token storage, the (not
  yet wired-in — see below) shared auth state machine, and shell-level i18n for pre-login
  screens.

`index.js` mounts `src/roles/farmer/App.tsx` as the app root, not because farmer is special, but
because that file already owns the real, working Splash → Welcome → Login → OTP → Register flow,
and it hands off to `src/roles/customer/CustomerMainApp.tsx` once login resolves the account as a
customer. Read `index.js`'s own docblock before touching boot order.

## Known transitional state — two systems are mid-migration, not finished

Both of these are real, deliberate, and currently live side by side with an unwired replacement.
Don't "clean this up" as a drive-by; a cutover touches the app's real entry point and deserves
its own reviewed change.

**Auth.** The screens that actually run today are `roles/farmer/App.tsx`'s hand-rolled
`useState<ScreenName>` switcher — that is what `index.js` boots. A separate, better-tested
shared auth state machine already exists at `src/shell/auth/session.ts` (pure state, no React,
fully unit-testable) plus `src/shell/auth/RootShell.tsx` (a bare login/OTP/role-select shell that
takes a role's app as a `RoleApp` prop). Its own docblocks say it is intended as the future single
entry point for all three roles. **Nothing currently imports `RootShell` from `index.js`.** If a
task touches login, OTP, or role-selection behavior, check whether it needs to change in
`session.ts` too (it mirrors a server condition verbatim in `requiresRoleSelection` — see the
comment there before editing either side) rather than only in the farmer switcher.

**i18n.** Same shape. `src/roles/farmer/i18n/index.ts` and `src/roles/customer/i18n/index.ts`
are the original per-role, byte-identical, dependency-free `t()` runtimes, and one of them is
what's actually rendered today — `roles/farmer/App.tsx` imports its own `./i18n`. A merged engine
already exists at `src/i18n/runtime.ts` (+ `src/i18n/farmer.ts`, `customer.ts`, `errors.*.json`),
which de-duplicates the *logic* while deliberately keeping *catalogue data* split per role — see
`runtime.ts`'s docblock for why a single shared JSON file would leak both roles' strings into
both bundles via Metro's import graph. **Nothing imports `src/i18n/{runtime,farmer,customer}.ts`
yet.** Treat it like `session.ts`: the intended future, not the current behavior.

## Cross-role import boundary

Enforced by `src/tests/cross_role_import_guard.test.ts` — run it before assuming a change that
touches more than one role is safe:

- A role directory may not import another role's code, with exactly one sanctioned bridge:
  `roles/farmer/App.tsx` → `roles/customer/CustomerMainApp.tsx`. Anything else crossing role
  lines is a violation to fix, not a pattern to copy.
- `src/shell/**` must never import from `src/roles/**`. Shell ships in every role's code path, so
  a static role import would drag that role into the shared code. This is also why
  `RootShell.tsx` takes the role app as an injected component prop instead of importing one.
- No role gets its own `components/` directory — shared components come only from
  `@tohfa/mobile-ui`.
- **Why this guard exists now, and why it used to matter more:** before this merge, each flavor
  shipped as its own Metro bundle and this import graph *was* the BR-16 farm-anonymity
  enforcement mechanism (root `CLAUDE.md` §2.5) — the only way to guarantee farm data never
  reached the customer bundle. That is no longer true. BR-16 is enforced the way root `CLAUDE.md`
  §2.1/§2.5 always said it must be: server-side, by the catalog serializer's allow-list. A
  customer's phone holding unreached farmer screen code in one shared bundle is not a data leak
  by itself. The guard is kept anyway because it keeps each role's code a coherent, reviewable
  unit — not because it is a security boundary. Do not use it, or its removal, as an argument
  about BR-16 either way.

## Design system, money, i18n content — as they apply here

- No literal hex colours or spacing numbers in screens. Colours, spacing and radius come from
  `@tohfa/design-tokens`, via `@tohfa/mobile-ui`'s `buildThemeForRole` (used by the shared shell)
  or a role's own `theme/` wrapper (used by that role's screens today).
- Every user-facing string is a translation key — `t('listing.create.title')`, never inline
  text. Which `t()` implementation backs a given screen depends on which side of the transitional
  state above that screen is on; don't assume it's the merged one.
- Money is the `Money` branded type from `@tohfa/shared-types` everywhere on this app too —
  cart totals, wallet balances, listing prices — never a float, even for display-only formatting.
- Business thresholds (caps, windows, split percentages) are not mobile-side constants; fetch
  them from the API's `system_config`.

## Testing

`pnpm --filter @tohfa/mobile test` runs vitest. There is no vitest DOM/jsdom config in this app,
so tests run in plain Node — `src/shell/auth/session.ts` and `session.test.ts` are written
against that constraint (pure state, no React, no JSX) rather than incidentally avoiding a
browser environment. `pnpm --filter @tohfa/mobile typecheck` runs `tsc --noEmit`. Any `BR-xx`
rule touched here still gets a test named with that ID, per root `CLAUDE.md` §2.6.

## Offline

Deferred, as in the apps this merged from. Assume connectivity; handle the ordinary failure
cases — a timed-out request, a token that expires mid-session, an upload that fails halfway —
with a retry the user can see and understand.
