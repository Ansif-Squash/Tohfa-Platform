# apps/customer-mobile — instructions

React Native 0.74 · TypeScript · React Navigation · TanStack Query · dependency-free i18n.
Brand colour: Deep Blue #0C447C. Read the root `CLAUDE.md` first.

## Audience
This app is used by retail customers buying groceries. Large touch targets, plain language, forgiving
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
speculatively: the customer base runs on low-end Android as well as iPhones, and bundle size is a
user-facing cost on the phones that matter most here.

## Offline
Deferred. Assume connectivity. Do handle the ordinary failure cases — a request that times out,
a token that expires mid-session, an upload that fails halfway — with a retry the user can see
and understand.

## State
TanStack Query for server state. Local component state for everything else. Do not add a global
store until something genuinely needs one.

## Farm-anonymity is the defining constraint
No farm name, farmer name, farm location, GPS or FMB data appears anywhere in this app — not in
a product card, not in search results, not in an order detail, not in a support message. The
customer sees grade, certification badges and TOHFA branding. That is all. This is BR-16, and
it is a client-locked business decision, not a preference.

If an API response contains a field that looks like farm provenance, do not render it — report
it as an API leak.
