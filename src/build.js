const esbuild = require('esbuild');
const pkg = require('../package.json');
const fs = require('fs');
const path = require('path');

const imagePlugin = require('./plugins/image');
const urlPlugin = require('./plugins/url');
const premixTransformPlugin = require('./plugins/premix-transform');
const { getRoutes } = require('./utils/routes');

const isProd = process.env.NODE_ENV === 'production';
const shouldWatch = process.env.WATCH === 'true';
const shouldPrerender = process.env.PRERENDER === 'true';

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
  chunkNames: 'chunks/[name].[hash]',
  banner: {
    js: `
/**
* Built with Premix
* Learn more at https://github.com/Mokshit06/premix
*/
    `.trim(),
  },
  entryNames: '[dir]/[name]',
  plugins: [urlPlugin, imagePlugin],
  external: [],
  define: {
    'process.env.NODE_ENV': isProd ? "'production'" : "'development'",
  },
  sourcemap: true,
  minify: isProd,
  treeShaking: true,
  publicPath: '/build',
};

const routes = getRoutes();

const entryClient = `
import ReactDOM from 'react-dom';
import { Route, Routes, PremixBrowserRouter } from '@premix/core/router';
import { PremixProvider, makeRoutes } from '@premix/core';
import matchRoute from '@premix/core/utils/matchRoute';
import App from './App';

globalThis.__PREMIX_MANIFEST__ = makeRoutes([
  ${routes
    .map(route => {
      return `{
      path: '${route.path}',
      page: () => import('${route.page}'),
    }`;
    })
    .join(',\n')}
]);

const routes = globalThis.__PREMIX_MANIFEST__;

const premixData = document.getElementById('__PREMIX_DATA__');
const initialData = JSON.parse(premixData.innerHTML);

async function init() {
  const route = routes.find(x => matchRoute(x.path, window.location.pathname));
  const { default: Component } = await route.page();

  globalThis.__LOADABLE_CACHE__ = {};
  globalThis.__LOADABLE_CACHE__[route.page.toString()] = Component;

  ReactDOM.hydrate(
    <PremixProvider>
      <PremixBrowserRouter value={initialData}>
        <App
          Component={() => (
            <Routes>
              {routes.map(route => (
                <Route
                  key={route.path}
                  path={route.path}
                  element={<route.component />}
                />
              ))}
            </Routes>
          )}
        />
      </PremixBrowserRouter>
    </PremixProvider>,
    document
  );
}

init();
`;

/** @type {esbuild.BuildOptions} */
const clientConfig = {
  ...commonConfig,
  stdin: {
    contents: entryClient,
    loader: 'tsx',
    resolveDir: 'app',
    sourcefile: 'entry-client.tsx',
  },
  platform: 'browser',
  outdir: 'public/build',
  format: 'esm',
  entryNames: '[dir]/entry-client.[hash]',
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
  // entryPoints: ['./server.ts', './prerender.ts'],
  stdin: {
    contents: `
    import { makeRoutes } from '@premix/core'

    globalThis.__PREMIX_MANIFEST__ = makeRoutes([
      ${routes
        .map(route => {
          return `{
          path: '${route.path}',
          page: () => import('${route.page}'),
          pagePath: '${route.page}'
        }`;
        })
        .join(',\n')}
    ]);

    require('${shouldPrerender ? '@premix/core/prerender' : './server'}');
    `,
    loader: 'tsx',
    resolveDir: '.',
  },
  entryNames: `[dir]/${shouldPrerender ? 'prerender' : 'server'}`,
  platform: 'node',
  outdir: 'build/',
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

  const [{ metafile }] = await Promise.all([
    buildClient(config),
    buildServer(config),
  ]);

  await fs.promises.writeFile(
    'build/meta.json',
    JSON.stringify(metafile),
    'utf8'
  );
}

build();
