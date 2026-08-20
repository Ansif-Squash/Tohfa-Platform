# apps/farmer-mobile — instructions

React Native 0.74 · TypeScript · React Navigation · TanStack Query · dependency-free i18n.
Brand colour: TOHFA Teal #0F6E56. Read the root `CLAUDE.md` first.

## Audience
This app is used by farmers, many of whom are using a smartphone app of this complexity for the first time. Large touch targets, plain language, forgiving
validation, and a visible path back out of every screen.

## Design system, enforced
- Colours and spacing from `src/theme` (which reads `@tohfa/design-tokens`). No literal hex.
- Button minimum height 44pt, radius 12pt. Cards 12–16pt radius. Inputs 12pt with the teal
  focus ring. Spacing only from the scale: 4, 8, 12, 16, 24, 32, 48.
- Icons: Material Symbols Outlined, weight 400, fill 0, optical size 24. **No emoji in
  production** — the design system replaced them with Material Symbols.

## Every string is a key
`t('listing.create.title')`, never a literal. `src/i18n/en.json` is authoritative;
`ta.json` is filled by a translator later. Tamil renders noticeably longer than English —
design for text growth now rather than reflowing every screen in Phase 4.

### The i18n runtime is hand-rolled, and that is deliberate
`src/i18n/index.ts` is **not** i18next. It is ~60 lines with no dependency: a `t(key, params)`
that does `{{name}}` interpolation, `setLocale` / `getLocale`, a `ta -> en -> key` fallback
chain, `missingKeys(locale)` so a test can assert the translation gap is shrinking, and
`fontFamilyForLocale()`. Keys are typed (`TranslationKey = keyof typeof en`), so a typo in a
key is a compile error rather than a string that renders as itself.

What it does not do: plurals, gendered forms, ICU message format, date/number localisation,
lazy-loaded catalogues. If a story genuinely needs one of those, swapping in i18next is a
contained change — it happens behind the same `t(key, params)` signature, so screens do not
change; only `src/i18n/index.ts` and the app's dependencies do. Do not add the dependency
speculatively: this app targets low-end Android, where the bundle size is a user-facing cost.

## Offline
Deferred. Assume connectivity. Do handle the ordinary failure cases — a request that times out,
a token that expires mid-session, an upload that fails halfway — with a retry the user can see
and understand.

## State
TanStack Query for server state. Local component state for everything else. Do not add a global
store until something genuinely needs one.

## Farm-anonymity does not apply here
The farmer sees their own data in full. The anonymity rule (BR-16) governs the **customer** app.

## Deferred, deliberately
Interactive Leaflet FMB polygon drawing and the 26-zone editor are **not** in this scope. The
registration flow accepts a GPS point plus an uploaded sketch image. If a task seems to require
polygon drawing, stop and confirm — it is a multi-week piece of work that was consciously
deferred.
