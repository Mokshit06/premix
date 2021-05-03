import { RequestHandler, Router } from 'express';
import fetch from 'node-fetch';
import handleRequest from '../app/entry-server';
import { routes } from '../app/routes';
import matchRoute from './utils/matchRoute';
import renderApp from './utils/renderApp';

global.fetch = fetch as any;

export function createRequestHandler(): RequestHandler {
  const router = Router();

  router.get('/_premix/data', async (req, res) => {
    const { href } = req.query;

    if (!href) return res.status(404).send();

    try {
      const [{ notFound }, { meta, links, data }] = await renderApp(
        href as string
      );

      if (notFound === true) {
        return res.status(404).send('Page not found');
      }

      res.json({ meta, links, data });
    } catch (error) {
      console.log(error.message);
      res.status(500).send();
    }
  });

  router.get('*', async (req, res) => {
    const [RemixApp] = await renderApp(req.originalUrl);

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
