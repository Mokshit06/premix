/**
 * @type {(contentType: string) => import('esbuild').Loader}
 */
const contentTypeToLoader = contentType => {
  if (contentType.includes('application/json')) {
    return 'json';
  }
  if (contentType.includes('text/css')) {
    return 'css';
  }
  if (contentType.includes('image/')) {
    return 'file';
  }
  if (contentType.includes('text/javascript')) {
    return 'jsx';
  }

  return 'text';
};

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
      const contentType = res.headers.get('content-type');
      const loader = contentTypeToLoader(contentType);

      return {
        contents,
        loader,
      };
    });
  },
};

module.exports = httpPlugin;
