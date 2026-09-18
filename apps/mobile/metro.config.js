/* eslint-disable @typescript-eslint/no-require-imports */
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

// Path to repository root
const monorepoRoot = path.resolve(__dirname, '../..');

/**
 * Metro configuration for PNPM monorepo.
 *
 * Single entry point (index.js) for every role — farmer, customer and admin
 * screens all ship in one bundle, and which ones a signed-in user sees is
 * decided at runtime by their account's role, not by which entry file was
 * built. BR-16 farm-anonymity is enforced server-side (the catalog
 * serializer's allow-list), not by bundler config; the import-graph
 * discipline between role directories is still worth keeping, see
 * src/tests/cross_role_import_guard.test.ts.
 *
 * https://reactnative.dev/docs/metro
 */
const defaultConfig = getDefaultConfig(__dirname);
const { assetExts, sourceExts } = defaultConfig.resolver;

const exclusionList = require('metro-config/src/defaults/exclusionList');

const config = {
  watchFolders: [monorepoRoot],
  // .svg files are compiled to React components by react-native-svg-transformer
  // rather than bundled as static assets, so svg moves from assetExts to
  // sourceExts. Farmer's registration/profile screens import icons this way.
  transformer: {
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
  },
  resolver: {
    blockList: exclusionList([
      /.*\/android\/.gradle\/.*/,
      /.*\/android\/build\/.*/,
      /.*\/android\/app\/build\/.*/,
      /.*\/ios\/build\/.*/,
    ]),
    assetExts: assetExts.filter((ext) => ext !== 'svg'),
    sourceExts: [...sourceExts, 'svg'],
    nodeModulesPaths: [
      path.resolve(__dirname, 'node_modules'),
      path.resolve(monorepoRoot, 'node_modules'),
    ],
    // Follow pnpm symlinks into the .pnpm virtual store
    unstable_enableSymlinks: true,
    // Watchman crashes here whenever macOS revokes its Full Disk Access grant
    // (happens on every reinstall since it lives under ~/Downloads, a
    // TCC-protected folder) -- fall back to Metro's built-in Node crawler
    // instead of depending on that grant staying in place.
    useWatchman: false,
  },
};

module.exports = mergeConfig(defaultConfig, config);
