import { Metafile } from 'esbuild';
import fs from 'fs';
import { StaticRouter } from 'react-router-dom';
import param from 'regexparam';
import { URL } from 'url';
import { PremixProvider } from '..';
import App from '../../app/App';
import { routes } from '../../app/routes';
import { Page } from '../types';
import exec from './exec';
import matchRoute from './matchRoute';

type Unwrap<T> = T extends Promise<infer U> ? U : T;

let metafile: Metafile;
let imports: string[];

function getMetaFile(): Metafile {
  const file = fs.readFileSync('build/meta.json', 'utf8');
  if (!file) {
    throw new Error('`build/meta.json` not found. Run `yarn build`');
  }

  return JSON.parse(file);
}

function getImports(metafile: Metafile, file: string) {
  const info = metafile.outputs[file];

  return [
    ...new Set(
      info.imports
        .filter(i => i.kind === 'import-statement')
        .flatMap(i => {
          return [
            i.path.replace(/^public/, ''),
            ...getImports(metafile, i.path),
          ];
        })
    ),
  ];
}

if (process.env.NODE_ENV === 'production') {
  metafile = getMetaFile();
  imports = getImports(metafile, 'public/build/entry-client.js');
}

export default async function renderApp(
  url: string
): Promise<() => JSX.Element> {
  const urlWithoutQuery = new URL(`https://example.com${url}`).pathname;
  const route = routes.find(x => matchRoute(x.path, urlWithoutQuery));

  if (!route) {
    return { notFound: true } as any;
  }

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

  if (process.env.NODE_ENV === 'development') {
    metafile = getMetaFile();
    imports = getImports(metafile, 'public/build/entry-client.js');
  }

  const RemixApp = () => (
    <PremixProvider
      context={{
        meta,
        links: [
          { rel: 'modulepreload', href: '/build/entry-client.js' },
          ...imports.map(i => ({ rel: 'modulepreload', href: i })),
          ...links,
        ],
        data,
      }}
    >
      <StaticRouter location={url} context={{}}>
        <App Component={Component} />
        {/* <Switch>
          {routes.map(route => (
            <Route key={route.path} path={route.path} exact>
              <App Component={route.component} />
            </Route>
          ))}
        </Switch> */}
      </StaticRouter>
    </PremixProvider>
  );

  return RemixApp;
}
