/* eslint-disable @typescript-eslint/no-require-imports */
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

const monorepoRoot = path.resolve(__dirname, '../..');

const defaultConfig = getDefaultConfig(__dirname);
const { assetExts, sourceExts } = defaultConfig.resolver;

const config = {
  watchFolders: [monorepoRoot],
  transformer: {
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
  },
  resolver: {
    assetExts: assetExts.filter(ext => ext !== 'svg'),
    sourceExts: [...sourceExts, 'svg'],
    nodeModulesPaths: [
      path.resolve(__dirname, 'node_modules'),
      path.resolve(monorepoRoot, 'node_modules'),
    ],
  },
};

module.exports = mergeConfig(defaultConfig, config);
