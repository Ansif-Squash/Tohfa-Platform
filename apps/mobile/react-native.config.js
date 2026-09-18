/**
 * Native asset linking config for `npx react-native-asset` (and any future
 * tooling that reads this file's `assets` field).
 *
 * The Material Symbols Outlined icon font (see packages/mobile-ui/src/Icon.tsx)
 * is the one custom font this app ships. Its source of truth lives at
 * src/assets/fonts/ — this file just tells the asset linker where to find it.
 *
 * `react-native-asset` is effectively unmaintained for RN 0.74, so the Android
 * copy at android/app/src/main/assets/fonts/MaterialSymbolsOutlined.ttf is
 * committed directly rather than relying on the linker to have run. This
 * config is kept so the linker still works if re-run, and so the convention
 * is discoverable for the next custom font this app adds.
 */
module.exports = {
  dependencies: {
    '@rnmapbox/maps': {
      platforms: {
        android: null, // disabled until a real Mapbox secret downloads token (sk.ey...) is configured
        ios: null,
      },
    },
  },
  assets: ['./src/assets/fonts'],
};
