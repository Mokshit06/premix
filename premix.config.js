const { vanillaExtractPlugin } = require('@vanilla-extract/esbuild-plugin');

/** @type {import('@premix/core/types').PremixConfig} */
module.exports = {
  esbuild(config, options) {
    config.plugins.push(vanillaExtractPlugin());

    return config;
  },
};
