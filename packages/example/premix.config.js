const { vanillaExtractPlugin } = require('@vanilla-extract/esbuild-plugin');

/** @type {import('./src/types').PremixConfig} */
module.exports = {
  esbuild(config, options) {
    config.plugins.push(vanillaExtractPlugin());

    return config;
  },
};
