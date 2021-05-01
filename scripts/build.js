const esbuild = require('esbuild');
const pkg = require('../package.json');
const fs = require('fs');

const imagePlugin = require('../src/plugins/image');
const urlPlugin = require('../src/plugins/url');
const premixTransformPlugin = require('../src/plugins/premix-transform');

const isProd = process.env.NODE_ENV === 'production';
const shouldWatch = process.env.WATCH === 'true';

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
  external: [],
  define: {
    'process.env.NODE_ENV': isProd ? "'production'" : "'development'",
  },
  sourcemap: !isProd,
  minify: isProd,
  treeShaking: true,
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
    plugins: [clientScriptPlugin, ...commonConfig.plugins],
  });

const buildClient = () =>
  esbuild.build({
    ...commonConfig,
    entryPoints: ['./app/entry-client.tsx'],
    platform: 'browser',
    outdir: 'public/build',
    format: 'esm',
    splitting: true,
    metafile: true,
    plugins: [
      premixTransformPlugin,
      serverScriptPlugin,
      ...commonConfig.plugins,
    ],
  });

async function build() {
  const [, { metafile }] = await Promise.all([buildServer(), buildClient()]);
  await fs.promises.writeFile(
    'build/meta.json',
    JSON.stringify(metafile),
    'utf8'
  );
}

build();
