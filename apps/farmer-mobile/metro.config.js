const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

// Path to repository root
const monorepoRoot = path.resolve(__dirname, '../..');

/**
 * Metro configuration for PNPM monorepo
 * https://reactnative.dev/docs/metro
 */
const config = {
  watchFolders: [monorepoRoot],
  resolver: {
    nodeModulesPaths: [
      path.resolve(__dirname, 'node_modules'),
      path.resolve(monorepoRoot, 'node_modules'),
    ],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
