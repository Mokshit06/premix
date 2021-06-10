import { PremixServerRouter } from '@premix/core/router';
import { Metafile } from 'esbuild';
import { match } from 'path-to-regexp';
import React, { Suspense } from 'react';
import { URL } from 'url';
import { PremixProvider } from '..';
import App from '../../app/App';
import { Page, Route } from '../types';
import {
  getMetaFile,
  getPageChunk,
  getRootScript,
  getScripts,
  getStylesheetMap,
} from './extract';
import matchRoute from './matchRoute';

type Unwrap<T> = T extends Promise<infer U> ? U : T;

let metafile: Metafile;
let scripts: string[];
let rootScript: string;
let stylesheetMap: Record<string, string>;

if (process.env.NODE_ENV === 'production') {
  metafile = getMetaFile();
  rootScript = getRootScript(metafile);
  scripts = getScripts(metafile, rootScript);
  stylesheetMap = getStylesheetMap(metafile);
}

export default async function renderApp(url: string) {
  const urlWithoutQuery = new URL(url, 'https://example.com').pathname;

  if (process.env.NODE_ENV === 'development') {
    metafile = getMetaFile();
    rootScript = getRootScript(metafile);
    scripts = getScripts(metafile, rootScript);
    stylesheetMap = getStylesheetMap(metafile);
  }

  const route: Route & {
    pagePath: string;
  } = globalThis.__PREMIX_MANIFEST__.find(x =>
    matchRoute(x.path, urlWithoutQuery)
  );

  if (!route) {
    return [{ notFound: true }] as any;
  }

  const file = route.pagePath;
  const chunk = getPageChunk(metafile, file) || '';

  const routerPage = await route.page();

  const page: Unwrap<Page> = {
    links: routerPage.links || (() => []),
    meta: routerPage.meta || (() => ({})),
    loader: routerPage.loader || (async () => ({ props: {} })),
    default: routerPage.default || (() => <h1>404</h1>),
    headers: routerPage.headers || (() => ({})),
    config: routerPage.config || {},
  };

  // const params = exec(urlWithoutQuery, param(route.path));
  const matchedRoute = match(route.path, { decode: decodeURIComponent })(
    urlWithoutQuery
  );

  if (!matchedRoute) return;

  const { params } = matchedRoute;

  const data = await page.loader({ params });
  const meta = page.meta(data.props);
  const headers = page.headers(data.props);
  const Component = routerPage.default;

  const script = rootScript.replace(/^\.premix\/public/, '');
  const links = page.links(data.props);

  if (stylesheetMap[chunk]) {
    links.push({
      rel: 'stylesheet',
      href: stylesheetMap[chunk].replace(/^\.premix\/public/, ''),
    });
  }

  if (!page.config.noJs) {
    links.push(
      { rel: 'modulepreload', href: script },
      { rel: 'modulepreload', href: chunk.replace(/^\.premix\/public/, '') },
      ...scripts.map(i => ({ rel: 'modulepreload', href: i }))
    );
  }

  const RemixApp = () => (
    <PremixProvider>
      <PremixServerRouter
        value={{
          meta,
          links,
          data,
          script,
          noJs: page.config.noJs,
        }}
        location={url}
      >
        {/* <ReactDevOverlay> */}
        <App
          Component={props => (
            <Suspense fallback="Loading...">
              <Component {...props} />
            </Suspense>
          )}
        />
        {/* </ReactDevOverlay> */}
      </PremixServerRouter>
    </PremixProvider>
  );

  return [
    RemixApp,
    {
      links,
      data,
      meta,
      params,
      script,
      headers,
    },
  ];
}
