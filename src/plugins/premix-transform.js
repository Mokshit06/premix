const babel = require('@babel/core');

/** @type {import('esbuild').Plugin} */
const premixTransform = {
  name: 'proxy-module',
  setup(build) {
    const fs = require('fs');

    build.onLoad(
      { filter: /(\/app\/pages\/|\\app\\pages\\)(.*)\.(tsx|jsx|js)$/ },
      async args => {
        const contents = fs.readFileSync(args.path, 'utf8');
        try {
          const transformOne = await babel.transformAsync(contents, {
            filename: args.path,
            presets: ['@babel/preset-typescript'],
            plugins: ['./src/babel/transform'],
          });
          const transformTwo = await babel.transformAsync(transformOne.code, {
            filename: args.path,
            presets: ['@babel/preset-typescript'],
            plugins: ['babel-plugin-remove-unused-import'],
          });

          return {
            contents: transformTwo.code,
            loader: 'jsx',
          };
        } catch (error) {
          console.log(error);
        }
      }
    );
  },
};

module.exports = premixTransform;
