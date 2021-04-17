const esbuild = require('esbuild');
const pkg = require('../package.json');

const urlPlugin = {
  name: 'url-loader',
  setup(build) {
    const path = require('path');

    build.onResolve({ filter: /^url:/ }, args => {
      const filePath = path.join(
        args.resolveDir,
        args.path.replace(/^url:/, '')
      );

      return {
        path: filePath,
        namespace: 'url-file',
      };
    });

    build.onLoad({ filter: /.*/, namespace: 'url-file' }, async args => {
      const result = await esbuild.build({
        entryPoints: [args.path],
        bundle: true,
        write: false,
      });

      return {
        contents: result.outputFiles[0].text,
        loader: 'file',
        watchFiles: [args.path],
      };
    });
  },
};

/** @type {esbuild.BuildOptions} */
const commonConfig = {
  inject: ['./preact-shim.js'],
  bundle: true,
  watch: true,
  publicPath: '/build',
  plugins: [urlPlugin],
  sourcemap: true,
};

Promise.all([
  esbuild.build({
    ...commonConfig,
    entryPoints: ['./server.tsx'],
    platform: 'node',
    outdir: 'build',
    external: Object.keys(pkg.dependencies),
  }),
  esbuild.build({
    ...commonConfig,
    entryPoints: ['./client.tsx'],
    platform: 'neutral',
    outdir: 'public/build',
    format: 'esm',
    splitting: true,
  }),
]).catch(() => process.exit(1));
