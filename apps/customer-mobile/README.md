# TOHFA Customer (React Native 0.74)

Customer app: farm-anonymous catalog, basket, wallet, orders and delivery
tracking.

**Supported platforms: Android 8.0 (API 26)+ and iOS 13.0+.** That baseline comes
from the Requirements document and is the same for both mobile apps; do not raise
it in a story without changing it there first.

## ⚠️ Day-0 toolchain spike is REQUIRED before feature work

These files are hand-written — `react-native init` was deliberately **not** run,
so there is no `android/` or `ios/` project yet. Before any story in this app is
picked up, a Day-0 spike must:

1. Generate the native projects for RN 0.74.5 (`npx @react-native-community/cli init`
   into a scratch dir, then copy `android/` and `ios/` here) and commit them.
2. Add `metro.config.js` + `babel.config.js` wired for a pnpm **monorepo** —
   Metro needs `watchFolders` pointing at the repo root and `nodeModulesPaths`
   including the root `node_modules`, or the workspace packages will not resolve.
3. Confirm a debug build runs on **iOS 13.0** as well as **Android 8.0 (API 26)** —
   unlike the farmer app, the customer base includes iPhones. Set
   `minSdkVersion 26` and `IPHONEOS_DEPLOYMENT_TARGET = 13.0` in the generated
   native projects.
4. Bundle **Noto Sans Tamil** as a local font asset.
5. Wire the Razorpay checkout SDK behind the `PAYMENT_PROVIDER=mock` switch so
   the app is testable without live keys.

Until that spike is signed off, treat build failures here as expected.

## Build the workspace packages first

`@tohfa/design-tokens` and `@tohfa/shared-types` resolve to their `dist/`
output, so run `pnpm build` at the repo root before `pnpm start`.

## Non-negotiable rule

Catalog and order responses are **farm-anonymous**: no farmer name, farm name,
village or photo may ever be rendered in this app. If a field like that appears
in an API response, that is an API bug — report it, do not display it.

## Layout

```
src/App.tsx        root screen (toolchain + tokens + i18n smoke test)
src/theme/         design tokens -> RN styles. Deep Blue brand.
src/api/client.ts  fetch wrapper: bearer token, correlation id, problem+json
src/i18n/          en.json + ta.json, dependency-free t()
```
