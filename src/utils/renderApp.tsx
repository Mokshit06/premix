import { Metafile } from 'esbuild';
import { StaticRouter } from 'react-router-dom';
import param from 'regexparam';
import { URL } from 'url';
import { PremixProvider } from '..';
import App from '../../app/App';
import { routes } from '../../app/routes';
import { Page } from '../types';
import exec from './exec';
import {
  getMetaFile,
  getPageChunk,
  getScripts,
  getStylesheetMap,
} from './extract';
import matchRoute from './matchRoute';

type Unwrap<T> = T extends Promise<infer U> ? U : T;

let metafile: Metafile;
let scripts: string[];
let stylesheetMap: Record<string, string[]>;

if (process.env.NODE_ENV === 'production') {
  metafile = getMetaFile();
  scripts = getScripts(metafile, 'public/build/entry-client.js');
  stylesheetMap = getStylesheetMap(metafile);
}

// TODO get this data from file based routing
const routeFileMap = {
  '/': 'app/pages/index.tsx',
  '/:post': 'app/pages/$post.tsx',
  '/action': 'app/pages/action.tsx',
};

export default async function renderApp(
  url: string
): Promise<() => JSX.Element> {
  const urlWithoutQuery = new URL(`https://example.com${url}`).pathname;
  const route = routes.find(x => matchRoute(x.path, urlWithoutQuery));

  if (!route) {
    return { notFound: true } as any;
  }

  if (process.env.NODE_ENV === 'development') {
    metafile = getMetaFile();
    scripts = getScripts(metafile, 'public/build/entry-client.js');
    stylesheetMap = getStylesheetMap(metafile);
  }

  const file: string = routeFileMap[route.path];
  const chunk = getPageChunk(metafile, file);

  const routerPage = await route.page();

  const page: Unwrap<Page> = {
    links: routerPage.links || (() => []),
    meta: routerPage.meta || (() => ({})),
    loader: routerPage.loader || (async () => ({ props: {} })),
    default: routerPage.default || (() => <h1>404</h1>),
  };

  const params = exec(urlWithoutQuery, param(route.path));
  const data = await page.loader({ params });
  const meta = page.meta(data.props);
  const links = page.links(data.props);
  const Component = routerPage.default;

  const pageStyles = [];

  for (const [cssFile, pageChunks] of Object.entries(stylesheetMap)) {
    const url = cssFile.replace(/^public/, '');

    if (pageChunks.some(x => x === chunk)) {
      pageStyles.push(url);
    }
  }

  const RemixApp = () => (
    <PremixProvider
      context={{
        meta,
        links: [
          { rel: 'modulepreload', href: '/build/entry-client.js' },
          ...scripts.map(i => ({ rel: 'modulepreload', href: i })),
          ...pageStyles.map(style => ({ rel: 'stylesheet', href: style })),
          ...links,
        ],
        data,
      }}
    >
      <StaticRouter location={url} context={{}}>
        <App Component={Component} />
      </StaticRouter>
    </PremixProvider>
  );

  return RemixApp;
}
