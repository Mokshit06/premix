import { RequestHandler } from 'express';
import fetch, { Request, Response } from 'node-fetch';
import { RemixProvider } from '.';
import App from '../app/App';
import handleRequest from '../app/entry-server';
import { routes } from '../app/routes';
import matchRoute from './utils/matchRoute';
import param from 'regexparam';

global.fetch = fetch as any;
global.Response = Response as any;
global.Request = Request as any;

function exec(
  path: string,
  result: {
    keys: Array<string>;
    pattern: RegExp;
  }
) {
  let i = 0;
  const out = {};
  const matches = result.pattern.exec(path);
  while (i < result.keys.length) {
    out[result.keys[i]] = matches[++i] || null;
  }

  return out;
}

export function createRequestHandler(): RequestHandler {
  return async (req, res) => {
    const route = routes.find(x => matchRoute(x.path, req.originalUrl));

    if (!route) {
      return res.status(404).send('Page not found');
    }

    const page = await route.page();

    const params = exec(req.originalUrl, param(route.path));
    const data = page.loader ? await page.loader({ params }) : { props: {} };
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

    const html = handleRequest(req, RemixApp);

    res.setHeader('content-type', 'text/html');
    res.send(html);
  };
}
