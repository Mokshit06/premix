import esbuild, { BuildOptions } from 'esbuild';
// import pkg from '../package.json';
import fs from 'fs';
import path from 'path';
import imagePlugin from './plugins/image';
import urlPlugin from './plugins/url';
import premixTransformPlugin from './plugins/premix-transform';
import { getRoutes } from '../utils/routes';
import { clientScriptPlugin, serverScriptPlugin } from './plugins/script';
import { PremixConfig } from 'src/types';
import premixPkg from '../../package.json';

interface Build {
  production: boolean;
  watch: boolean;
  prerender: boolean;
}

function toAbsolute(p: string) {
  return path.join(process.cwd(), p);
}

export default async function build({ production, watch, prerender }: Build) {
  const pkg = require(toAbsolute('package.json'));

  console.log(__dirname);

  const commonConfig: BuildOptions = {
    inject: [path.join(__dirname, '../../src/build/react-shim.js')],
    bundle: true,
    watch,
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
      'process.env.NODE_ENV': production ? "'production'" : "'development'",
    },
    sourcemap: true,
    minify: production,
    treeShaking: true,
    publicPath: '/build',
  };

  const routes = getRoutes();

  const entryClient = `
import ReactDOM from 'react-dom';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { PremixProvider } from '@premix/core';
import {matchRoute} from '@premix/core';
import App from './App';
import { makeRoutes } from '@premix/core'

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

  ReactDOM.render(
    <PremixProvider context={initialData}>
      <BrowserRouter>
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
      </BrowserRouter>
    </PremixProvider>,
    document
  );
}

init();
`;

  const clientConfig: BuildOptions = {
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
    plugins: [
      premixTransformPlugin,
      serverScriptPlugin,
      ...(commonConfig.plugins || []),
    ],
    watch: watch
      ? {
          async onRebuild(error, result) {
            if (error || !result) return;

            await fs.promises.writeFile(
              'build/meta.json',
              JSON.stringify(result.metafile),
              'utf8'
            );
          },
        }
      : false,
  };

  // const App = readFile('app/App.tsx')

  const serverConfig: BuildOptions = {
    ...commonConfig,
    // entryPoints: ['./server.ts', './prerender.ts'],
    stdin: {
      contents: `
    import { makeRoutes } from '@premix/core'
    import App from './app/App'

    globalThis.App = App;

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

    require('./server');
    `,
      loader: 'tsx',
      resolveDir: '.',
    },
    entryNames: `[dir]/${prerender ? 'prerender' : 'server'}`,
    platform: 'node',
    outdir: 'build/',
    external: [
      ...(commonConfig.external || []),
      ...Object.keys(pkg.dependencies).filter(x => x !== '@premix/core'),
      ...Object.keys(premixPkg.dependencies),
      ...Object.keys(pkg.devDependencies),
      ...Object.keys(premixPkg.devDependencies),
    ],
    plugins: [clientScriptPlugin, ...(commonConfig.plugins || [])],
  };

  function getUserConfig() {
    let userConfig: PremixConfig;

    try {
      userConfig = require(toAbsolute('premix.config.js'));
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

  function buildServer(config: PremixConfig) {
    return esbuild.build(config.esbuild(serverConfig, { isServer: true }));
  }

  function buildClient(config: PremixConfig) {
    return esbuild.build(config.esbuild(clientConfig, { isServer: false }));
  }

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

function readFile(file: string) {
  try {
    const contents = fs.readFileSync(file, 'utf8');
    return contents;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return fileMap[file.replace(/\.(js|ts|tsx)$/, '')];
    } else {
      throw error;
    }
  }
}

const fileMap: Record<string, string> = {
  'app/entry-server': `
    import ReactDOMServer from 'react-dom/server';
    import { ReactElement } from 'react';

    export default function handleRequest(App: () => ReactElement) {
      const markup = ReactDOMServer.renderToString(<App />);
    
      return \`<!DOCTYPE html>\${markup}\`;
    }
  `,
  'app/App': `
    import { Links, LiveReload, Meta, Scripts } from '@premix/core';
    export default function App({ Component }) {
      return (
        <html lang="en">
          <head>
            <meta charSet="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <Meta />
            <Links />
          </head>
          <body>
            <div id="__premix">
              <Component />
            </div>
            <Scripts />
            <LiveReload />
          </body>
        </html>
      );
    }
  `,
};
