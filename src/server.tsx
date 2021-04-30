import { RequestHandler, Router } from 'express';
import fetch from 'node-fetch';
import param from 'regexparam';
import handleRequest from '../app/entry-server';
import { routes } from '../app/routes';
import exec from './utils/exec';
import matchRoute from './utils/matchRoute';
import renderApp from './utils/renderApp';

global.fetch = fetch as any;

export function createRequestHandler(): RequestHandler {
  const router = Router();

  router.get('/data', async (req, res) => {
    const { path, href } = req.query;

    if (!path) return res.status(404).send();

    const route = routes.find(x => matchRoute(x.path, path as string));
    const page = await route.page();

    const params = exec(href as string, param(route.path));
    const data = await page.loader({ params });
    const meta = page.meta(data.props);
    const links = page.links(data.props);

    res.json({ meta, links, data });
  });

  router.get('*', async (req, res) => {
    const RemixApp = await renderApp(req.originalUrl);

    if ((RemixApp as any).notFound === true) {
      return res.status(404).send('Page not found');
    }

    const html = handleRequest(RemixApp);
    res.setHeader('content-type', 'text/html');
    res.send(html);
  });

  router.post('*', async (req, res) => {
    const route = routes.find(x => matchRoute(x.path, req.originalUrl));

    if (!route) {
      return res.status(404).send('Page not found');
    }

    const { action } = await route.page();

    if (!action) return res.end();

    await action(req, res);
    // const redirectTo = await action(req, res);

    // if (req.header('Content-Type') === 'application/json') {
    //   res.setHeader('x-remix-redirect')
    // }
  });

  return router;
}
