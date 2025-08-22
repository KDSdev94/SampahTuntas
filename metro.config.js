const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for Firebase
config.resolver.assetExts.push('json');

// Support for React Native Firebase
config.resolver.sourceExts.push('jsx', 'js', 'ts', 'tsx', 'json');

// Production build optimizations
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    ecma: 8,
    keep_fnames: true,
    mangle: {
      keep_fnames: true,
    },
  },
};

module.exports = config;
