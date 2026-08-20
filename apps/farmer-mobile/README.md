# TOHFA Farmer (React Native 0.74)

Tamil-first farmer app: listings, counter-offers, certificates, wallet.

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
   including the root `node_modules`, otherwise the workspace packages
   (`@tohfa/shared-types`, `@tohfa/design-tokens`) will not resolve.
3. Confirm a debug build runs on the real baseline — **Android 8.0 (API 26)** on
   a low-end handset, not a flagship emulator — and set `minSdkVersion 26` in the
   generated `android/` project.
4. Bundle **Noto Sans Tamil** as a local font asset. Tamil rendering must not
   depend on a network font or on what the OEM happens to ship.
5. Decide and record the release channel (Play Internal Testing vs APK sideload
   for field pilots).

Until that spike is signed off, treat build failures here as expected.

## Build the workspace packages first

`@tohfa/design-tokens` and `@tohfa/shared-types` resolve to their `dist/`
output, so run `pnpm build` at the repo root before `pnpm start`.

## Layout

```
src/App.tsx        root screen (toolchain + tokens + i18n smoke test)
src/theme/         design tokens -> RN styles. No hex literals anywhere else.
src/api/client.ts  fetch wrapper: bearer token, correlation id, problem+json
src/i18n/          en.json + ta.json, dependency-free t()
```
