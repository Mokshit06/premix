const esbuild = require('esbuild');
const pkg = require('../package.json');
const fs = require('fs');
const path = require('path');

const imagePlugin = require('../src/plugins/image');
const urlPlugin = require('../src/plugins/url');
const premixTransformPlugin = require('../src/plugins/premix-transform');

const isProd = process.env.NODE_ENV === 'production';
const shouldWatch = process.env.WATCH === 'true';

/** @type {esbuild.Plugin} */
const clientScriptPlugin = {
  name: 'client-script',
  setup(build) {
    build.onLoad({ filter: /\.client\.(ts|js)$/ }, () => {
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
    build.onLoad({ filter: /\.server\.(ts|js)/ }, () => {
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
  chunkNames: 'chunks/chunk.[hash]',
  banner: {
    js: `
/**
* Built with Premix
* Learn more at https://github.com/Mokshit06/premix
*/
    `.trim(),
  },
  entryNames: '[dir]/[name]',
  publicPath: '/build',
  plugins: [urlPlugin, imagePlugin],
  external: [],
  define: {
    'process.env.NODE_ENV': isProd ? "'production'" : "'development'",
  },
  sourcemap: !isProd,
  minify: isProd,
  treeShaking: true,
};

/** @type {esbuild.BuildOptions} */
const clientConfig = {
  ...commonConfig,
  entryPoints: ['./app/entry-client.tsx'],
  platform: 'browser',
  outdir: 'public/build',
  format: 'esm',
  entryNames: '[dir]/[name].[hash]',
  splitting: true,
  metafile: true,
  plugins: [premixTransformPlugin, serverScriptPlugin, ...commonConfig.plugins],
  watch: shouldWatch
    ? {
        async onRebuild(error, result) {
          if (error) return;
          await fs.promises.writeFile(
            'build/meta.json',
            JSON.stringify(result.metafile),
            'utf8'
          );
        },
      }
    : false,
};

/** @type {esbuild.BuildOptions} */
const serverConfig = {
  ...commonConfig,
  entryPoints: ['./server.ts', './prerender.ts'],
  platform: 'node',
  outdir: 'build',
  external: [
    ...commonConfig.external,
    ...Object.keys(pkg.dependencies),
    ...Object.keys(pkg.devDependencies),
  ],
  plugins: [clientScriptPlugin, ...commonConfig.plugins],
};

function getUserConfig() {
  let userConfig;

  try {
    userConfig = require(path.resolve('premix.config.js'));
  } catch (error) {
    if (error.code !== 'MODULE_NOT_FOUND') {
      throw new Error(error);
    }
    userConfig = {
      esbuild: config => config,
    };
  }

  return userConfig;
}

function buildServer(config) {
  return esbuild.build(config.esbuild(serverConfig, { isServer: true }));
}

function buildClient(config) {
  return esbuild.build(config.esbuild(clientConfig, { isServer: false }));
}

async function build() {
  const config = getUserConfig();
  const [, { metafile }] = await Promise.all([
    buildServer(config),
    buildClient(config),
  ]);
  await fs.promises.writeFile(
    'build/meta.json',
    JSON.stringify(metafile),
    'utf8'
  );
}

build();
