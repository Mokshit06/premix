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

export default async function renderApp(
  url: string,
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

  const RemixApp = () => (
    <PremixProvider
      context={{
        meta,
        links,
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
