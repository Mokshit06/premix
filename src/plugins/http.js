/** @type {import('esbuild').Plugin} */
const httpPlugin = {
  name: 'http',
  setup(build) {
    const { default: fetch } = require('node-fetch');

    build.onResolve({ filter: /^https?:\/\// }, args => ({
      path: args.path,
      namespace: 'http-url',
    }));

    build.onResolve({ filter: /.*/, namespace: 'http-url' }, args => ({
      path: new URL(args.path, args.importer).toString(),
      namespace: 'http-url',
    }));

    build.onLoad({ filter: /.*/, namespace: 'http-url' }, async args => {
      const res = await fetch(args.path);
      const contents = await res.text();

      return { contents };
    });
  },
};

module.exports = httpPlugin;
