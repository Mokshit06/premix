import { Metafile } from 'esbuild';
import { match } from 'path-to-regexp';
import { StaticRouter } from 'react-router-dom/server';
import { URL } from 'url';
import { PremixProvider } from '..';
import App from '../../app/App';
import { Page } from '../types';
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
let stylesheetMap: Record<string, string[]>;

if (process.env.NODE_ENV === 'production') {
  metafile = getMetaFile();
  rootScript = getRootScript(metafile);
  scripts = getScripts(metafile, rootScript);
  stylesheetMap = getStylesheetMap(metafile);
}

export default async function renderApp(url: string) {
  const urlWithoutQuery = new URL(`https://example.com${url}`).pathname;

  if (process.env.NODE_ENV === 'development') {
    metafile = getMetaFile();
    rootScript = getRootScript(metafile);
    scripts = getScripts(metafile, rootScript);
    stylesheetMap = getStylesheetMap(metafile);
  }

  const route = globalThis.__PREMIX_MANIFEST__.find(x =>
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

  const pageStyles = [];

  for (const [cssFile, pageChunks] of Object.entries(stylesheetMap)) {
    const url = cssFile.replace(/^public/, '');

    if (pageChunks.some(x => x === chunk)) {
      pageStyles.push(url);
    }
  }

  const script = rootScript.replace(/^public/, '');
  const links = [
    { rel: 'modulepreload', href: script },
    { rel: 'modulepreload', href: chunk.replace(/^public/, '') },
    ...scripts.map(i => ({ rel: 'modulepreload', href: i })),
    ...pageStyles.map(style => ({ rel: 'stylesheet', href: style })),
    ...page.links(data.props),
  ];

  const RemixApp = () => (
    <PremixProvider
      context={{
        meta,
        links,
        data,
        script,
      }}
    >
      <StaticRouter location={url}>
        <App Component={Component} />
      </StaticRouter>
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
