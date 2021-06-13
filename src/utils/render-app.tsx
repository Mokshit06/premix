import { PremixServerRouter } from '@premix/core/router';
import { Metafile } from 'esbuild';
import { Request } from 'express';
import { match } from 'path-to-regexp';
import React from 'react';
import { URL } from 'url';
import { PremixProvider } from '..';
import App from '../../app/App';
import { Link, Meta, Page, Route } from '../types';
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

export default async function renderApp(
  href: string,
  req?: Request
): Promise<
  [
    { (): JSX.Element; notFound?: boolean },
    {
      links: Link[];
      data: any;
      meta: Meta;
      params: object;
      script: string;
      headers: Record<string, string>;
      revalidate?: number;
    }
  ]
> {
  const url = new URL(href, 'https://example.com');

  if (process.env.NODE_ENV === 'development') {
    metafile = getMetaFile();
    rootScript = getRootScript(metafile);
    scripts = getScripts(metafile, rootScript);
    stylesheetMap = getStylesheetMap(metafile);
  }

  const route: Route & {
    pagePath: string;
  } = globalThis.__PREMIX_MANIFEST__.find(x =>
    matchRoute(x.path, url.pathname)
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
    serverLoader: routerPage.serverLoader,
    staticLoader: routerPage.staticLoader || (async () => ({ props: {} })),
    default: routerPage.default || (() => <h1>404</h1>),
    headers: routerPage.headers || (() => ({})),
    config: routerPage.config || {},
  };

  const matchedRoute = match(route.path, { decode: decodeURIComponent })(
    url.pathname
  );

  if (!matchedRoute) return;

  const { params } = matchedRoute;

  let data: {
    props: any;
    revalidate?: number;
  };

  if (page.serverLoader) {
    const reqParams = req.params;
    req.params = params as any;
    data = await page.serverLoader(req);
    req.params = reqParams;
  } else {
    data = await page.staticLoader({
      params,
      query: Object.fromEntries(url.searchParams),
    });
  }

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
        location={href}
      >
        <App Component={Component} />
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
      revalidate: data.revalidate,
    },
  ];
}
