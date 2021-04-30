const esbuild = require('esbuild');
const pkg = require('../package.json');

const isProd = process.env.NODE_ENV === 'production';
const shouldWatch = process.env.WATCH === 'true';

/** @type {esbuild.Plugin} */
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
        watchFiles: shouldWatch ? [args.path] : [],
      };
    });
  },
};

/** @type {esbuild.Plugin} */
const clientScriptPlugin = {
  name: 'client-script',
  setup(build) {
    build.onLoad({ filter: /\.client\.(ts|js)$/ }, args => {
      return {
        contents: `module.exports = {}`,
        loader: 'js',
      };
    });
  },
};

/** @type {esbuild.Plugin} */
const serverScriptPlugin = {
  name: 'server-script',
  setup(build) {
    build.onLoad({ filter: /\.server\.(ts|js)/ }, args => {
      return {
        contents: `module.exports = {}`,
        loader: 'js',
      };
    });
  },
};

/** @type {esbuild.BuildOptions} */
const commonConfig = {
  inject: ['./src/react-shim.js'],
  bundle: true,
  watch: shouldWatch,
  publicPath: '/build',
  plugins: [urlPlugin],
  define: {
    'process.env.NODE_ENV': isProd ? "'production'" : "'development'",
  },
  external: ['@prisma/client'],
  metafile: true,
  sourcemap: true,
  ...(isProd
    ? {
        minify: true,
        treeShaking: true,
      }
    : {}),
};

const buildServer = () =>
  esbuild.build({
    ...commonConfig,
    entryPoints: ['./server.ts'],
    platform: 'node',
    outdir: 'build',
    external: [
      ...commonConfig.external,
      ...Object.keys(pkg.dependencies),
      ...Object.keys(pkg.devDependencies),
    ],
    plugins: [...commonConfig.plugins, clientScriptPlugin],
  });

const buildClient = () =>
  esbuild.build({
    ...commonConfig,
    entryPoints: ['./app/entry-client.tsx'],
    platform: 'node',
    outdir: 'public/build',
    format: 'esm',
    metafile: true,
    splitting: true,
    plugins: [...commonConfig.plugins, serverScriptPlugin],
  });

async function build() {
  await Promise.all([buildServer(), buildClient()]);
}

build();
