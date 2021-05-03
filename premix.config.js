const { vanillaExtractPlugin } = require('@vanilla-extract/esbuild-plugin');

module.exports = {
  esbuild(config, options) {
    config.plugins.push(vanillaExtractPlugin());

    return config;
  },
};
