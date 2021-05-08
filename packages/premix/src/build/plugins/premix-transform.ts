import babel from '@babel/core';
import { Plugin } from 'esbuild';

const premixTransform: Plugin = {
  name: 'proxy-module',
  setup(build) {
    const fs = require('fs');

    build.onLoad({ filter: /\/pages\/.*\.(tsx|jsx|js)$/ }, async args => {
      const contents = await fs.promises.readFile(args.path, 'utf8');
      try {
        const transformOne = await babel.transformAsync(contents, {
          filename: 'noop.tsx',
          presets: ['@babel/preset-typescript'],
          plugins: ['@premix/core/babel'],
        });

        if (!transformOne || !transformOne.code) return;

        const transformTwo = await babel.transformAsync(transformOne.code, {
          filename: 'noop.tsx',
          presets: ['@babel/preset-typescript'],
          plugins: ['babel-plugin-remove-unused-import'],
        });

        if (!transformTwo || !transformTwo.code) return;

        return {
          contents: transformTwo.code,
          loader: 'jsx',
        };
      } catch (error) {
        console.log(error);
      }
    });
  },
};

export default premixTransform;
