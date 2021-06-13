// @ts-check
const esbuild = require('esbuild');
const pkg = require('../package.json');
const fs = require('fs-extra');
const path = require('path');

const imagePlugin = require('./plugins/image');
const urlPlugin = require('./plugins/url');
const httpPlugin = require('./plugins/http');
const workerPlugin = require('./plugins/worker');
const premixTransformPlugin = require('./plugins/premix-transform');
const { getRoutes, getApiRoutes } = require('./utils/routes');
const chalk = require('chalk');

const isProd = process.env.NODE_ENV === 'production';
const shouldWatch = process.env.WATCH === 'true';
const shouldBundleServer = true;

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

const userConfig = getUserConfig();

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
  plugins: [
    urlPlugin,
    imagePlugin,
    httpPlugin,
    workerPlugin,
    {
      name: 'next-dev-overlay',
      setup(build) {
        build.onLoad({ filter: /@next\/react-dev-overlay\/*/ }, args => {
          if (process.env.NODE_ENV === 'production') {
            return {
              contents: `module.exports = {}`,
            };
          }
        });
      },
    },
  ],
  external: [],
  define: {
    'process.env.NODE_ENV': JSON.stringify(
      isProd ? 'production' : 'development'
    ),
    'process.env.PREMIX_CONFIG': JSON.stringify(userConfig),
  },
  sourcemap: true,
  minify: isProd,
  publicPath: '/build',
  loader: {
    '.js': 'jsx',
  },
};

const routes = getRoutes();
const apiRoutes = getApiRoutes();

const entryClient = `
import { register, ReactDevOverlay } from '@next/react-dev-overlay/lib/client';
import ReactDOM from 'react-dom';
import { Route, Routes, PremixBrowserRouter } from '@premix/core/router';
import { PremixProvider, makeRoutes } from '@premix/core';
import matchRoute from '@premix/core/utils/matchRoute';
import App from './App';
import { Fragment } from 'react';

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

if (process.env.NODE_ENV === 'development') {
  register();
}

const routes = globalThis.__PREMIX_MANIFEST__;

const premixData = document.getElementById('__PREMIX_DATA__');
const initialData = JSON.parse(premixData.innerHTML);

const DevOverlay = process.env.NODE_ENV === 'development'
    ? ReactDevOverlay
    : Fragment

async function init() {
  const route = routes.find(x => matchRoute(x.path, window.location.pathname));
  const { default: Component } = await route.page();

  globalThis.__LOADABLE_CACHE__ = {};
  globalThis.__LOADABLE_CACHE__[route.page.toString()] = Component;

  ReactDOM.hydrate(
    <PremixProvider>
      <PremixBrowserRouter value={initialData}>
        <App
          Component={(props) => (
            <DevOverlay>
              <Routes>
                {routes.map(route => (
                  <Route
                    key={route.path}
                    path={route.path}
                    element={<route.component {...props} />}
                  />
                ))}
              </Routes>
            </DevOverlay>
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
  outdir: '.premix/public/build',
  metafile: true,
  define: {
    ...commonConfig.define,
    'process.env.PREMIX_ENV': '"client"',
  },
  plugins: [premixTransformPlugin, serverScriptPlugin, ...commonConfig.plugins],
  watch: shouldWatch
    ? {
        async onRebuild(error, result) {
          if (error) return;
          console.log('REBUILDING CLIENT');
          fs.outputJsonSync('.premix/build/meta.json', result.metafile);
        },
      }
    : false,
};

/** @type {esbuild.BuildOptions} */
const esmConfig = {
  ...clientConfig,
  format: 'esm',
  splitting: true,
  entryNames: '[dir]/entry-client.[hash]',
};

/** @type {esbuild.BuildOptions} */
const errorConfig = {
  ...clientConfig,
  stdin: undefined,
  entryPoints: ['src/error-entry.tsx'],
};

/** @type {esbuild.BuildOptions} */
const noModuleConfig = {
  ...clientConfig,
  entryNames: '[dir]/nomodule',
};

/** @type {esbuild.BuildOptions} */
const serverConfig = {
  ...commonConfig,
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

    globalThis.__API_ROUTES__ = [
      ${apiRoutes.map(route => {
        return `{
          path: ${JSON.stringify(route.path)},
          handler: require(${JSON.stringify(route.page)})
        }`;
      })}
    ];

    require('./server');
    `,
    loader: 'tsx',
    resolveDir: '.',
  },
  entryNames: `[dir]/server`,
  platform: 'node',
  define: {
    ...commonConfig.define,
    'process.env.PREMIX_ENV': '"ssr"',
  },
  target: 'node12',
  outdir: '.premix/build/',
  external: [
    ...commonConfig.external,
    ...Object.keys(pkg.dependencies),
    ...Object.keys(pkg.devDependencies),
  ],
  plugins: [clientScriptPlugin, ...commonConfig.plugins],
  sourcemap: 'inline',
  watch: shouldWatch
    ? {
        onRebuild(err) {
          console.error(err);
          console.log('REBUILDING');
        },
      }
    : false,
};
/** @type {esbuild.BuildOptions} */
const prerenderConfig = {
  ...commonConfig,
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

    globalThis.__API_ROUTES__ = [
      ${apiRoutes.map(route => {
        return `{
          path: ${JSON.stringify(route.path)},
          handler: require(${JSON.stringify(route.page)})
        }`;
      })}
    ];

    require('@premix/core/prerender');
    `,
    loader: 'tsx',
    resolveDir: '.',
  },
  entryNames: `[dir]/prerender`,
  platform: 'node',
  define: {
    ...commonConfig.define,
    'process.env.PREMIX_ENV': '"prerender"',
  },
  target: 'node12',
  outdir: '.premix/build/',
  external: [
    ...commonConfig.external,
    ...Object.keys(pkg.dependencies),
    ...Object.keys(pkg.devDependencies),
  ],
  plugins: [clientScriptPlugin, ...commonConfig.plugins],
  sourcemap: 'inline',
};

/** @param {import('./types').PremixConfig} config */
function buildServer(config) {
  return esbuild.build(config.esbuild(serverConfig, { isServer: true }));
}

/** @param {import('./types').PremixConfig} config */
function buildPrerender(config) {
  return esbuild.build(config.esbuild(prerenderConfig, { isServer: true }));
}

/** @param {import('./types').PremixConfig} config */
function bundleEsm(config) {
  return esbuild.build(config.esbuild(esmConfig, { isServer: false }));
}

/** @param {import('./types').PremixConfig} config */
function bundleNoModule(config) {
  return esbuild.build(config.esbuild(noModuleConfig, { isServer: false }));
}

function getUserConfig() {
  let userConfig;

  try {
    userConfig = require(path.resolve('premix.config.js'));
    console.log(chalk.green`Loaded premix.config.js`);
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

async function build() {
  fs.copySync('public', '.premix/public');

  const promises = [bundleEsm(userConfig), buildPrerender(userConfig)];

  if (shouldBundleServer) {
    promises.push(buildServer(userConfig));
  }

  if (isProd) {
    promises.push(bundleNoModule(userConfig));
  } else {
    promises.push(esbuild.build(errorConfig));
  }

  const [{ metafile }] = await Promise.all(promises);

  fs.outputJsonSync('.premix/build/meta.json', metafile, {
    spaces: isProd ? 0 : 2,
  });
}

build();
