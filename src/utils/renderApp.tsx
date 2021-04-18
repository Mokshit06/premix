import param from 'regexparam';
import { RemixProvider } from '..';
import App from '../../app/App';
import { routes } from '../../app/routes';
import { Page } from '../types';
import exec from './exec';
import matchRoute from './matchRoute';

type Unwrap<T> = T extends Promise<infer U> ? U : T;

export default async function renderApp(
  url: string
): Promise<() => JSX.Element> {
  const route = routes.find(x => matchRoute(x.path, url));

  if (!route) {
    return { notFound: true } as any;
  }

  const routerPage = await route.page();

  const page: Unwrap<Page> = {
    links: () => [],
    meta: () => ({}),
    loader: async () => ({ props: {} }),
    default: () => <h1>404</h1>,
    ...routerPage,
  };

  const params = exec(url, param(route.path));
  const data = await page.loader({ params });
  const meta = page.meta(data.props);
  const links = page.links(data.props);

  const RemixApp = () => (
    <RemixProvider
      context={{
        meta,
        links,
        data,
      }}
    >
      <App Component={page.default} />
    </RemixProvider>
  );

  return RemixApp;
}
