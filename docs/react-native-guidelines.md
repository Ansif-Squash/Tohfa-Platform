# React Native engineering guidelines

Engineering standards for `apps/mobile` — **one React Native 0.74 codebase, one binary,
three role flavors** (farmer, customer, admin). This document owns **structure and
mechanics** — folder layout, component conventions, data layer, navigation, testing,
performance, accessibility.

There used to be two separate apps here (`apps/farmer-mobile`, `apps/customer-mobile`),
each its own Metro bundle with its own `package.json`. That split is gone. `apps/mobile`
has a single `package.json`, a single Metro entry point (`index.js`), and a single Android
`applicationId` (`in.tohfa.mobile`). Farmer, customer and admin are role flavors of that one
binary, not three products — see `apps/mobile/src/tests/cross_role_import_guard.test.ts` for
the enforcement mechanism and its own doc-comment for why the old per-binary isolation model
was retired.

## What this document does not own

- **Design tokens** (colours, spacing, radii, type scale) → `packages/design-tokens/src/tokens.json`,
  consumed through `@tohfa/mobile-ui`'s `useTheme()`/`buildThemeForRole()` and each role's own
  `src/roles/<role>/theme/index.ts`. Never hard-code a hex value or a spacing number in a
  component; see root `CLAUDE.md` §2.7.
- **i18n** (the hand-rolled `t(key)` runtime, key conventions, Tamil text growth) →
  `apps/mobile/src/i18n/runtime.ts` (the shared engine) and `apps/mobile/src/shell/i18n/index.ts`
  (the shell's own pre-login catalogue) — read their doc-comments before touching either; they
  explain why the i18n *logic* is merged but the *catalogue data* stays split per role (bundle
  scoping, see §4 below).
- **Farm-anonymity (BR-16)** and every other business rule → `docs/rules.md`. This doc tells
  you *where the code that enforces a rule lives*; it does not restate *what the rule is*. If
  you're touching catalog/order/product-detail data under `src/roles/customer/`, read BR-16 in
  `docs/rules.md` before touching that data layer. Note what changed with the merge: BR-16 is
  **not** enforced by keeping farmer code out of the customer binary any more (there is only one
  binary now) — it is enforced exactly the way root `CLAUDE.md` §2.1/§2.5 always required,
  server-side, by the catalog serializer's allow-list. See the docblock at the top of
  `cross_role_import_guard.test.ts` for the full reasoning.
- **Touch target sizes, button/card/input radii, icon spec** → `theme.minTouchTarget` /
  `MIN_TOUCH_TARGET` from `@tohfa/mobile-ui` (44pt minimum touch target, 12pt button radius,
  Material Symbols Outlined). This doc's Accessibility section cross-references that, it does
  not restate it.
- **Permissions / RBAC** → `docs/rbac.json`, enforced server-side per root `CLAUDE.md` §2.1. A
  mobile screen may hide a control it knows the user can't use, but that is a UX nicety, never
  the authorization boundary. The one client-side role mechanic that *is* load-bearing is
  `src/shell/config/flavor.ts`'s `pinnedRoleCode` — see §4.

---

## 1. Folder / module structure

```
apps/mobile/
  index.js                # The one Metro entry point for every install of the app
  src/
    shell/                 # Role-agnostic. Ships in every install. NEVER imports src/roles/**.
      auth/                 # RootShell.tsx (splash/login/OTP/role-select), session.ts, api.ts
      api/                  # client.ts (shared HTTP client), queryClient.ts
      config/               # flavor.ts — the Farmer/Customer/Admin identity + pinnedRoleCode table
      i18n/                 # Shell's own small pre-login string catalogue
      storage/              # tokenStorage.ts
      rbac/, theme/         # (present as scaffolding; see each dir's own state before assuming content)
    roles/
      farmer/               # Farmer's screens, api, theme, i18n, tests — see below
      customer/             # Customer's screens, api, theme, i18n, tests
      admin/                # Admin's placeholder app + i18n (thinnest of the three today)
    i18n/                   # Shared i18n runtime (createI18n) + farmer.ts/customer.ts catalogues
    tests/
      cross_role_import_guard.test.ts   # The structural guard for this whole layout — read it first
```

Inside a role directory (`src/roles/farmer/`, `src/roles/customer/`), the shape carried over
from the old per-app layout and still applies:

```
src/roles/<role>/
  App.tsx | CustomerMainApp.tsx   # Root component for that role's screens (see §4)
  api/                 # One file per resource. Fetch fn + TanStack Query hooks + response types.
  screens/              # One folder per feature area, PascalCase screen files inside
    <feature>/<FeatureScreen>.tsx
  storage/              # Device-local persistence (tokens, drafts) — thin wrappers, no logic
  i18n/                 # en.json, ta.json — role-specific catalogue data (see §1 above on why
                        # this stays split rather than merging into one JSON file)
  theme/                # Reads @tohfa/design-tokens, re-exports colors/spacing/typography
  assets/               # branding.json, static assets
  tests/                # Flat, one file per feature or rule (see §6)
```

**There is no `src/roles/<role>/components` in any role, and that is enforced by a test**
(`apps/mobile/src/tests/cross_role_import_guard.test.ts`), not just a convention: a per-role
`components` directory must be empty or absent. Every shared, cross-role component lives in
`packages/mobile-ui`.

**Cross-role imports are confined to one designated bridge file, not banned outright.** Under
the old two-binary architecture, a cross-app import was impossible to allow at all — Metro had
no way to exclude a folder from one entry point, so the import graph *was* the isolation
mechanism, and the guard test enforced zero imports between the two app trees. That constraint
is gone now that there's one bundle for every role, but the guard test still exists, in a
narrower form: cross-role imports must go through the one sanctioned bridge point
(`src/roles/farmer/App.tsx` importing `src/roles/customer/CustomerMainApp.tsx`, which is how the
shared root routes a customer-scoped account to its post-login screens once `/auth/me` resolves
the role) rather than a screen or api file reaching into another role's internals ad hoc. Adding
a second bridge point, or importing across roles from anywhere else, fails
`cross_role_import_guard.test.ts`.

**`src/shell` must never import from `src/roles`.** This is the one absolute (not just
single-bridge) rule the guard test enforces, because `src/shell` ships in every role's UI
unconditionally — a static import from `src/shell` into any role would mean every role always
pays for that role's code, which is exactly the outcome the old two-binary split existed to
prevent and still matters even inside one bundle (dead code bloats the one binary everyone
downloads). See the docblock at the top of `src/shell/auth/RootShell.tsx`.

Screens that belong to a flow are grouped by feature folder (`screens/auth/`,
`screens/listings/`, `screens/registration/`), not by component type. Some screens in
`src/roles/customer/` sit flat under `screens/` directly (`CartScreen.tsx`, `SearchScreen.tsx`)
— new screens should go in a feature folder (`screens/cart/CartScreen.tsx`) even where the
existing flat placement wasn't followed; don't propagate the flat pattern further.

> **Known duplication (gap, carried over from before the merge):** `src/roles/customer/` has
> both `screens/HomeScreen.tsx` and `screens/home/HomeScreen.tsx`. `CustomerMainApp.tsx` (the
> live post-login root — see §4) imports `screens/HomeScreen.tsx`; the other looks like a
> leftover from a refactor. Flagged for the customer flow's owner to confirm and delete; not
> fixed here, since deleting the wrong one silently would be worse than leaving it.
>
> Also carried over: `src/roles/customer/App.tsx` and `src/roles/farmer/navigation/index.ts`
> are both dead code today. `App.tsx`'s own Splash/Onboarding/Register/Otp/Login/… screens are
> unreachable now that the shared `RootShell` (§4) owns sign-in for every role — see the
> doc-comment at the top of `CustomerMainApp.tsx`, which is the file that's actually mounted.
> `navigation/index.ts` defines a `RootStackParamList`/`MainTabParamList` shape for a navigation
> library the app doesn't use (see §4) and nothing imports it. Neither is wired to anything;
> don't build on either file without confirming with the screen's owner first.

## 2. Component conventions

- **Functional components only, typed with `React.FC<Props>` or an explicit return type**
  (`function Foo(): React.JSX.Element`) — both styles exist in the codebase today
  (`packages/mobile-ui` uses `React.FC<Props>`; several screens use `function Foo(): React.JSX.Element`).
  Either is acceptable; do not introduce a third style (no class components, no
  `React.FunctionComponent` spelled out, no default-export-only files without a named export).
- **Props are a named `interface`**, not an inline type literal, when the component is exported
  or has more than ~2 props (`ButtonProps`, `ErrorStateProps`, `EmptyStateProps`). Optional
  props are `foo?: T | undefined` under `exactOptionalPropertyTypes: true` — check
  `apps/mobile/tsconfig.json` before assuming a plain `foo?: T` compiles; the stricter form is
  what's already in the repo.
- **`packages/mobile-ui` vs a role-local component**: a component goes in `mobile-ui` if it is
  presentational, has no knowledge of a specific screen's data shape, and could plausibly be
  reused by another role. Today that's `Button`, `Card`, `Input`, `Badge`, `EmptyState`,
  `ErrorState`, `Skeleton`, `StickyFooter`, `Icon` — the exact list
  `cross_role_import_guard.test.ts` asserts exists in `packages/mobile-ui/src/`. A
  screen-specific composition (a listing card that knows about `Listing.activeCounterOffer`)
  stays in the screen file — it is not "shared" just because it might visually resemble a
  `Card`.
- **`mobile-ui` components read theme via `useTheme()`**, never import `@tohfa/design-tokens`
  directly and never hard-code a colour. A role's own screens import `colors`/`spacing`/
  `typography` from that role's own `src/roles/<role>/theme`, which itself wraps
  `@tohfa/design-tokens`. Don't import `@tohfa/design-tokens` directly from a screen — go
  through the role's theme module so each role keeps a single seam for its brand colour. (The
  shared shell, which has no fixed brand colour of its own, instead calls `mobile-ui`'s
  `buildThemeForRole(activeRoleCode)` — see §4.)
- Styles are `StyleSheet.create({...})` at module scope, with per-render dynamic values
  (theme-derived colours, computed booleans) passed as an inline array
  (`style={[styles.base, dynamicStyle, props.style]}`) — this is the pattern in every screen and
  every `mobile-ui` component; don't switch to inline style objects for static values.
- Every interactive control carries `accessibilityRole` and, where the label isn't the visible
  text, `accessibilityLabel` — this is asserted by a test today (see §6), not just a guideline.

## 3. Data layer

### 3.1 Where API calls live
One file per resource under a role's own `src/roles/<role>/api/` (`api/cart.ts`, `api/listings.ts`,
`api/wallet.ts`, …). Each file owns:
1. Request/response TypeScript types for that resource (hand-written interfaces today — nothing
   in `apps/mobile` generates these from `docs/openapi.yaml`; keep them in sync by hand and treat
   drift as a bug against the schema, not a schema problem).
2. Plain async functions that call `api.get/post/patch/put/delete`.
3. TanStack Query hooks (`useCart`, `useAddToCart`, `useMyListings`, …) that wrap those
   functions. **Hooks are colocated with the fetch function in the same resource file** — there
   is no separate `hooks/` directory.

A screen calls the hook, never `api.get` directly, except where a screen intentionally manages
its own loading/error state outside Query (`ListingsScreen.tsx` does this today, for a screen
with tab-based client-side filtering and a custom pull-to-refresh countdown timer — acceptable
there, but **new screens should default to a Query hook** rather than reimplement loading/refetch/
error state by hand).

### 3.2 The API client
**There is now one shared client**, `src/shell/api/client.ts` — this is the significant change
from the two-app era, where each app kept its own near-identical copy. It handles:
- Base URL resolution (`API_BASE_URL`, currently a hard-coded `10.0.2.2:3000` emulator address
  with a tracked `TODO(STORY-MOB-01)` to move it to `react-native-config`/build flavour — don't
  add a second, competing way to configure this; land STORY-MOB-01 instead of inlining a new env
  read next to it).
- A correlation ID header (`x-correlation-id`) on every request, for tracing against the API's
  RFC 9457 error responses.
- `Idempotency-Key` passthrough on `api.post`, per root `CLAUDE.md` §2.4 — **every mutation
  that moves money or writes a ledger must pass one**; generate it once per user-intent (e.g.
  `useMemo` for the lifetime of a checkout screen), never per render and never per retry.
- `ApiError`, wrapping the parsed `Problem` (RFC 9457 `application/problem+json`) body. Screens
  branch on `error.problem.code` (a value from `packages/shared-types/src/errors.ts`), **never**
  on `error.message` or the `title` string.
- `NetworkError` for transport failures (no response at all — offline, timeout, DNS), distinct
  from `ApiError` so a screen can say "you're offline, your draft is saved" instead of rendering
  a server error.
- A shared token store seam (`configureTokenStorage`), a shared `onAuthFailure` callback, and
  collapsed-401 refresh (`refreshAuthTokens`, one in-flight `POST /auth/refresh` for concurrent
  401s, with a single retry) — wired up once, for every role, by
  `src/shell/auth/session.ts:initializeSession()`. Under the old two-app model this was an
  inconsistency between the apps (only farmer's client had it); it's now a shell-level guarantee
  that applies uniformly.

**Real gap, not fixed here:** `src/roles/farmer/api/client.ts` still exists as its own,
near-identical copy of the client, and every file under `src/roles/farmer/api/` imports from it
rather than from `src/shell/api/client.ts`. Customer's api files (`src/roles/customer/api/*.ts`)
were already migrated to import the shared shell client. Farmer has not — its client duplicates
base-URL resolution, `ApiError`/`NetworkError`, and its own local 401-refresh logic against its
own local `tokenStorage`, separate from the one `session.ts` now wires up for the rest of the
app. This is a real inconsistency to flag, not a decision to make silently: either finish
migrating farmer's api files onto `src/shell/api/client.ts` or confirm there's a reason farmer
needs to stay on its own copy.

### 3.3 Surfacing errors to a screen
- **Loading**: a `Skeleton` (from `mobile-ui`) shaped like the content that's loading, not a
  bare spinner, for any screen-level fetch. A `Button`'s own in-flight state uses its `loading`
  prop (spinner replaces the label) for a submit action.
- **Error**: render `<ErrorState error={error} onRetry={refetch} />` from `mobile-ui`. It already
  special-cases `NetworkError` (offline copy + "Retry Connection") vs a generic `ApiError`
  (generic copy + "Retry"). Do not write a bespoke error block per screen — if `ErrorState`'s
  copy or layout doesn't fit a case, extend `ErrorState`'s props, don't fork it.
- **Empty**: render `<EmptyState iconName=... title=... message=... />` from `mobile-ui`,
  distinct from the error state — a `200` with zero items is not a failure.
- **Domain-specific problem codes**: when a screen needs to react to a *specific* `ErrorCode`
  (e.g. show a "counter-offer already expired" message rather than a generic failure), branch
  on `error.is(code)` (the `ApiError.is()` helper) inside the screen/mutation's `onError`, and
  keep the generic `ErrorState` as the fallback for every code the screen doesn't special-case.
- Retry policy is centralised in `src/shell/api/queryClient.ts`, and shared by every role: 2
  retries on queries, 0 retries on mutations, `staleTime` 5 min, `gcTime` 15 min,
  `refetchOnWindowFocus` off (meaningless on RN, harmless to leave set). This used to be a real
  inconsistency between the two apps (customer ran on TanStack Query's bare defaults); the
  merge fixed it by giving every role the same one `queryClient`, wrapped in
  `QueryClientProvider` inside each role's own `App.tsx`/`CustomerMainApp.tsx`.

## 4. Navigation and app composition

**This resolved what used to be the largest doc/code gap in the old two-app world.** There is no
`@react-navigation/*` package in `apps/mobile/package.json` (nor in `pnpm-lock.yaml`), and no
screen imports one any more — the old `CheckoutScreen.tsx` `@ts-expect-error` import of
`useNavigation` behind a `try/catch` is gone. The real, load-bearing pattern, used everywhere, is
a **hand-rolled screen switch**: a `useState<ScreenName>` holding the current screen, a
`useState<Params>` holding that screen's params, and a `navigate(screen, params)` function passed
down as an `onNavigate`/`onNavigateTo*` prop. This is now the *only* pattern in the codebase, not
one of two competing ones — treat it as settled, not as a gap to flag.

```ts
// A screen receives navigation only as callback props it needs, typed narrowly —
// never a generic "navigation" object with every route on it.
interface FooScreenProps {
  onNavigateToBar: (id: string) => void;
  onCancel: () => void;
}
```

- Route params are typed per-screen as explicit props (`applicationId: string`,
  `listing: Listing`), not read off an untyped params bag inside the screen.
- A screen never calls a navigation API directly; it calls the prop it was given. This keeps
  every screen testable with `react-test-renderer` and no router context.

**How composition actually works today, top to bottom:**
1. `index.js` registers exactly one component: `src/roles/farmer/App.tsx`, unconditionally, for
   every install of the app (see `index.js`'s own doc-comment for why farmer's `App.tsx` is the
   mounted root — it already owned the working Splash → Welcome → Login → OTP → Register flow
   that every role now shares).
2. `src/roles/farmer/App.tsx` renders the shared pre-login screens; once a session resolves
   (`/auth/me`), it either continues into its own `MainTabs` (farmer's own dashboard/listings/
   wallet/profile tab switch, hand-drawn with `Pressable` + `Icon` + `Text`, not a tab-navigator
   library) or — the one sanctioned cross-role import, see §1 — mounts
   `src/roles/customer/CustomerMainApp.tsx` for a customer-scoped account.
3. `src/shell/auth/RootShell.tsx` is a **separate**, newer root (`RootShellProps: { flavor,
   RoleApp }`) that owns splash/login/OTP/role-select once, generically, for whichever
   `RoleApp` component it's given, using the shared `session.ts` state machine and the shared
   `flavor.ts` role-pinning table. Read its file-top doc-comment: it explains the
   `pinnedRoleCode` mechanism (why a farmer- or customer-pinned login can never trigger the
   server's role-selection branch) and the deliberate provider-nesting tradeoff versus
   `App.tsx`. `RootShell` is not yet what `index.js` mounts — see the gap noted below.

**Flag for the team, not resolved by this doc**: `index.js` mounts `src/roles/farmer/App.tsx`
directly rather than `src/shell/auth/RootShell.tsx`, so the app currently has **two** working
pre-login flows that don't share code: `App.tsx`'s own Splash/Welcome/Login/OTP screens (live,
what every install actually runs today) and `RootShell`'s newer generic splash/login/OTP/
role-select (built, unit-tested via `src/shell/auth/session.test.ts`, but not the one wired to
`index.js`). Decide whether `index.js` should switch to `RootShell` (retiring `App.tsx`'s own
auth screens in favour of the shared ones) or whether `RootShell` is for a different entry point
not yet built — either is defensible, but building further on `App.tsx`'s own auth screens while
`RootShell` exists unused is the state to resolve, not extend.

## 5. State management boundaries

- **Server state → TanStack Query**, hooks colocated in `src/roles/<role>/api/<resource>.ts`
  (§3.1), all sharing the one `queryClient` from `src/shell/api/queryClient.ts` (§3.3). Query
  keys are plain arrays (`['cart']`, `['listings']`); invalidate the narrowest key that changed
  in a mutation's `onSuccess`, as every existing hook does.
- **Everything else → local component state** (`useState`/`useReducer`/`useMemo`/`useCallback`
  in the owning screen). Do not add Redux/Zustand/Jotai/Context-as-a-store. If a task seems to
  need one, that is a decision to raise, not to make silently — see root `CLAUDE.md` §7.
- **Global client state is now split across two seams, and that split is intentional but worth
  understanding:**
  - `src/shell/auth/session.ts` is the ONE shared session state machine (`SessionState`:
    `initializing` / `anonymous` / `roleSelectionRequired` / `authenticated`), used by
    `RootShell`. It wires the shared `client.ts`'s token storage and 401-handler exactly once
    (`initializeSession()`'s idempotency guard exists specifically to prevent each role's old
    per-app-mount `configureTokenStorage` call from repointing the client mid-session).
  - `src/roles/farmer/App.tsx`'s own `useState` (current screen, current tab, locale) predates
    `session.ts` and is not wired to it — it is UI navigation state for the flow `index.js`
    actually mounts today (§4), not app-wide session state.
  - Token persistence remains an unresolved gap carried over from before the merge: both
    `src/shell/storage/tokenStorage.ts` and each role's own `storage/tokenStorage.ts` are
    in-memory only, despite doc-comments describing a "Keychain/Keystore security layer" —
    **nothing currently persists a token to Keychain/Keystore or AsyncStorage; a token is lost
    on process kill.** Either implement the persistence the comments promise (e.g. via
    `react-native-keychain`, not `AsyncStorage`, since a refresh token is a credential) or fix
    the comments to describe what the code actually does. Don't add a third, competing token
    store to work around this while it's unresolved.

## 6. Testing

### 6.1 Unit / component tests
- **Runner: Vitest**, not Jest — `apps/mobile/package.json`'s `test` script is `vitest run`;
  there is no `jest.config.js` (the RN 0.74 Jest preset is unused here). Use `vi.mock`, `vi.fn`,
  `vi.spyOn` from `vitest`, not `jest.*` APIs.
- **`react-test-renderer`** (`renderer.create`, wrapped in `renderer.act`) is available (see
  `devDependencies`) and used under `src/roles/customer/tests/` for screens that need to render
  and assert on the output tree (`br-16.test.ts`, `br-17.test.tsx`). `react-native` itself is
  mocked with `vi.mock('react-native', () => ({...}))` returning bare string tags (`View: 'View'`,
  etc.) rather than pulling in the real native module, and `@tohfa/mobile-ui` is mocked the same
  way. `src/roles/farmer/tests/` leans more on pure-logic tests (theme contrast ratios,
  validation functions, countdown math) and source-as-text assertions (`accessibility.test.ts`
  `fs.readFileSync`s a screen file and asserts it contains the string `accessibilityRole`) —
  either style is fine; match whichever a role's existing `tests/` directory already uses for
  a given kind of check, rather than mixing conventions within one role.
- **Tests live flat under each role's own `src/roles/<role>/tests/`**, one file per feature area
  or per rule ID (`br-16.test.ts`, `br-17.test.tsx`, `br-22.test.tsx`, `auth.test.ts`, …), plus
  the app-wide structural guards under `apps/mobile/src/tests/` (currently just
  `cross_role_import_guard.test.ts`). Per root `CLAUDE.md` §2.6, a test for a business rule is
  **named with the rule ID** — this is already the convention for BR-16/17/22 under
  `src/roles/customer/tests/`; extend it (`BR-xx` prefix in the filename or at minimum the
  `describe` block) for any new rule-touching test, in any role.
- **Architecture/convention guards are tests, not lint rules**: `cross_role_import_guard.test.ts`
  (no per-role `src/roles/<role>/components`, cross-role imports confined to the one bridge
  file, `src/shell` never imports `src/roles`, required `mobile-ui` components present) and
  `store_submission.test.ts` / `performance_device_matrix.test.ts` (build-config assertions —
  Hermes enabled, min SDK 26, iOS 13 floor — read out of `android/build.gradle`, `ios/Podfile`
  etc.) follow this pattern: a structural rule gets a test that reads the filesystem/source and
  asserts on it, so a regression fails CI instead of relying on review. Prefer this pattern over
  a new ESLint rule for anything specific to this repo's structure (see root `eslint.config.js`'s
  own comment: "the type checker is the primary safety net, ESLint only covers what tsc cannot
  see").
- **Adding a fourth role, or a new role-to-role integration point**: extend
  `cross_role_import_guard.test.ts` rather than writing a parallel guard — add the role to its
  `ROLES` tuple and, if it needs one, a new entry in `ALLOWED_BRIDGES` naming the exact bridge
  file. Do not add a bridge "for convenience" from a screen or api file; the test will fail it,
  and that's the point.

### 6.2 E2E (Maestro)
There is no `.maestro/` directory under `apps/mobile` today. Each old app had its own
`golden-thread.yaml` (farmer: auth → create listing → respond to counter-offer; customer: auth →
farm-anonymous browse → cart → wallet checkout → order tracking) and a `test:e2e` script; neither
survived the merge. Re-establishing golden-thread E2E coverage for `apps/mobile` — one flow per
role, or a combined flow that also exercises the farmer→customer bridge in §4 — is unstarted
work, not a doc gap to silently paper over. If you're picking this up, keep the old flows'
shape (`optional: true` liberally on `tapOn` so the flow survives minor copy/layout changes,
`assertNotVisible: "Farmer:"` style checks for BR-16) rather than inventing a new style.

### 6.3 New-screen test checklist
For any new screen, before calling it done:
- [ ] Data hook has a loading, error, and empty state, each exercised by a test (or by the
      existing `mobile-ui` components' own tests, if you didn't write bespoke states).
- [ ] Every interactive element has `accessibilityRole` (and `accessibilityLabel` if the visible
      text doesn't already say what the control does).
- [ ] If the screen touches a rule in `docs/rules.md`, a test named with that rule's ID exists
      and failed before the implementation (root `CLAUDE.md` §2.6).
- [ ] If the screen is under `src/roles/customer/` and renders any data that could carry farm
      identity, a BR-16-style payload/tree walk test exists (see `br-16.test.ts` for the
      pattern) — don't rely on eyeballing the JSX.
- [ ] A new mutation that moves money or writes a ledger passes `idempotencyKey` and that is
      covered by a test (root `CLAUDE.md` §2.4).
- [ ] If the screen sits on a critical path, note it for the E2E work in §6.2 (there is currently
      no golden-thread flow to update, since none exists yet post-merge).

## 7. Performance (low-end Android)

`apps/mobile/package.json` names RN 0.74; `minSdkVersion 26` and Hermes-enabled are asserted as a
**tested** floor (`performance_device_matrix.test.ts` / `device_matrix.test.ts`), not aspirational
copy. Concretely:

- **List virtualization**: use `FlatList`, as every list screen already does (`ListingsScreen.tsx`,
  product grids). Don't reach for `ScrollView` + `.map()` for a list that can grow past a
  screenful.
- **Images**: no image-handling library is currently a dependency (no `react-native-fast-image`
  etc.) — if a screen needs it, evaluate adding one deliberately and note the addition and the
  reason in that change's summary rather than adding it silently; this app keeps dependencies
  deliberately minimal for bundle size on low-end devices.
- **Re-renders**: the existing pattern is `useCallback` for handlers passed to `FlatList`
  (`renderItem`, `onRefresh`) and `useMemo` for derived/filtered lists (`ListingsScreen.tsx`'s
  `filteredListings`) — keep using both where a list or a handler is recreated every render.
  Don't reach for `React.memo` on screen-level components; cross that bridge with a measurement,
  not preemptively.
- **Throttled-network budgets are asserted in tests today** (`performance_device_matrix.test.ts`
  targets product detail render <1500ms on a simulated throttled-4G round trip) — if you're
  touching a screen on the critical path, check whether a similar budget exists or should exist
  for it.

## 8. Accessibility

- **Touch targets, radii, colours**: `theme.minTouchTarget` / `MIN_TOUCH_TARGET` from
  `@tohfa/mobile-ui` (44pt minimum touch target), asserted in `accessibility.test.ts` under
  `src/roles/farmer/tests/`. This doc does not restate those numbers — read them there.
- **Every interactive control needs `accessibilityRole`** (`"button"`, `"tab"`, `"alert"` for an
  error region, `"tablist"` for a tab bar container) — enforced today by `accessibility.test.ts`
  reading specific source files and asserting the string is present, for a fixed file list, not
  universally. When you add a new screen with interactive controls, add it to a similar check
  rather than assuming an existing test already covers it.
- **Colour contrast**: `accessibility.test.ts` computes WCAG 2.1 contrast ratios for farmer's
  theme colour pairs (primary/white, onSurface/surface, etc.) and asserts ≥4.5:1. Customer's
  theme has no equivalent test today — if you add or change a colour pairing in
  `src/roles/customer/theme`, port this check rather than trusting the design-tokens source is
  automatically safe (tokens can be contrast-safe for one pairing and not another).
- **Icons carry meaning via `Icon`'s `aria-label`/`accessibilityRole="text"`** (see
  `packages/mobile-ui/src/Icon.tsx`) — an icon-only control still needs its own
  `accessibilityLabel` on the *pressable wrapper*, not just relying on the icon's internal
  label, because a screen reader announces the pressable, not the `Text` glyph inside it.

## 9. Role relationship (for context, not new policy)

- Farmer and customer each still keep their own `theme/index.ts` (same structure, different
  primary — TOHFA Teal vs Deep Blue) and their own `i18n/` catalogue data, on purpose: role
  screens read theme through their own role's theme module (§2), not through `@tohfa/mobile-ui`'s
  `buildThemeForRole` directly, and splitting i18n data per role (rather than one merged JSON) is
  what keeps Metro's per-entry-point bundle from embedding every role's strings into a build that
  only needs one role's — see `src/i18n/runtime.ts`'s doc-comment for the confirmed bundle-bloat
  regression this prevents.
- What *did* consolidate at the merge: `packages/mobile-ui`, `packages/design-tokens`,
  `packages/shared-types` (shared before and after), plus — new — the API client
  (`src/shell/api/client.ts`, though farmer hasn't migrated onto it yet, §3.2), the query client
  (`src/shell/api/queryClient.ts`), and the session/auth state machine (`src/shell/auth/session.ts`,
  though `index.js` doesn't mount its `RootShell` yet, §4).
- `cross_role_import_guard.test.ts` is what to extend, not retrofit, if a fourth role or a new
  bridge point is ever needed — see §6.1.

---

*Gaps and open questions surfaced while writing this doc are marked inline above: §1 duplicate
customer `HomeScreen.tsx` and two dead navigation-related files; §3.2 farmer's api layer not yet
migrated onto the shared shell client; §4 `index.js` mounting farmer's own auth screens rather
than the newer shared `RootShell`; §5 tokens not actually persisted despite Keychain-referencing
comments in two different token stores; §6.2 no `.maestro` E2E coverage exists yet for the merged
app; §8 missing contrast test for customer's theme. None of these were invented rules — they're
observations about the current code, flagged for whoever owns the relevant area to confirm and
resolve.*
