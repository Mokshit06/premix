import chalk from 'chalk';
import compression from 'compression';
import flash from 'connect-flash';
import express, { RequestHandler, Router } from 'express';
import session, { SessionOptions } from 'express-session';
import fs from 'fs-extra';
import morgan from 'morgan';
import fetch from 'node-fetch';
import ReactDOMServer from 'react-dom/server';
import { ErrorOverlay } from '.';
import handleRequest from '../app/entry-server';
import { Route } from './types';
import matchRoute from './utils/matchRoute';
import renderApp from './utils/render-app';

global.fetch = fetch as any;

const routes = globalThis.__PREMIX_MANIFEST__ as Route[];

export function createRequestHandler({
  session: sessionOptions,
}: {
  session: Partial<SessionOptions> & { secret: string };
}): RequestHandler {
  const router = Router();

  router.use(compression());
  router.use(
    session({
      resave: false,
      saveUninitialized: true,
      cookie: { secure: process.env.NODE_ENV === 'production' },
      ...sessionOptions,
    })
  );
  router.use(flash());

  if (process.env.NODE_ENV === 'development') {
    router.use(
      morgan('dev', {
        skip(req, res) {
          return req.url.startsWith('/build/');
        },
      })
    );
  }

  router.use((req, res, next) => {
    res.setHeader('x-powered-by', 'Premix');
    next();
  });

  const revalidateState = new Map<string, number>();

  router.get('*', async (req, res, next) => {
    if (process.env.NODE_ENV === 'development') return next();

    res.on('finish', async () => {
      try {
        const url = new URL(req.originalUrl, 'https://example.com');

        const route: Route & {
          pagePath: string;
        } = globalThis.__PREMIX_MANIFEST__.find(x =>
          matchRoute(x.path, url.pathname)
        );

        if (!route) return;

        const page = await route.page();

        if (page.serverLoader || page.action) return;

        const [PremixApp, data] = await renderApp(req.originalUrl);

        if (PremixApp.notFound) return;

        let pageState = revalidateState.get(req.originalUrl);

        if (!data.revalidate) return;

        if (!pageState) {
          revalidateState.set(req.originalUrl, data.revalidate);
          pageState = Date.now();
        }

        if (Date.now() - pageState > data.revalidate * 1000) {
          const fileName = req.originalUrl === '/' ? '/index' : req.originalUrl;

          await fs.outputFile(
            `.premix/public${fileName}.html`,
            handleRequest(PremixApp),
            'utf8'
          );
          await fs.outputJSON(
            `.premix/public/_premix/data${fileName}.json`,
            data
          );
          revalidateState.set(req.originalUrl, Date.now());
        } else {
          console.log(Date.now() - pageState);
        }
      } catch (error) {
        console.log(
          chalk`{red ✖} Error during regenerating ${req.originalUrl}`
        );
        console.error(error);
      }
    });

    next();
  });

  router.use(
    express.static('.premix/public', {
      extensions: ['html'],
    })
  );

  if (process.env.NODE_ENV === 'development') {
    router.use(
      express.static('public', {
        extensions: ['html'],
      })
    );
  }

  router.use(express.json());
  router.use(express.urlencoded({ extended: true }));

  router.get('/_premix/data/*', async (req, res) => {
    const href = req.url
      .replace(/^\/_premix\/data/, '')
      .replace(/\.json$/, '')
      .replace(/index$/, '');

    try {
      const [{ notFound }, pageData] = await renderApp(href as string, req);

      if (notFound === true) {
        return res.status(404).json({
          error: 'Page not found',
        });
      }

      const { headers, ...data } = pageData;

      Object.entries(headers).forEach(([key, value]) =>
        res.setHeader(key, value as string)
      );

      res.json(data);
    } catch (error) {
      console.log(error.message);
      res.status(500).send({
        message: 'Something went wrong',
      });
    }
  });

  router.get('/api/*', async (req, res) => {
    const apiRoute = (
      globalThis.__API_ROUTES__ as Array<{
        path: string;
        handler: any;
      }>
    ).find(route => {
      return matchRoute(route.path, req.url);
    });

    if (!apiRoute) {
      return res.status(404).send('Page not found');
    }

    await apiRoute.handler.default(req, res);
  });

  router.get('*', async (req, res) => {
    try {
      const [PremixApp, data] = await renderApp(req.originalUrl, req);

      if ((PremixApp as any).notFound === true) {
        return res.status(404).send('Page not found');
      }

      const { headers } = data;

      const html = handleRequest(PremixApp);

      Object.entries(headers).forEach(([key, value]) =>
        res.setHeader(key, value as string)
      );

      res.send(html);
    } catch (error) {
      console.error(error);

      if (process.env.NODE_ENV === 'development') {
        const html = ReactDOMServer.renderToString(
          <ErrorOverlay error={error} />
        );

        return res.status(500).send(`<!DOCTYPE html>${html}`);
      }

      res.status(500).send(`Something went wrong!`);
    }
  });

  router.all('*', async (req, res) => {
    const route = routes.find(x => matchRoute(x.path, req.originalUrl));

    if (!route) {
      return res.status(404).send('Page not found');
    }

    const { action } = await route.page();

    if (!action) return res.status(404).send("Loader doesn't exist");

    try {
      await action(req, res);
    } catch (error) {
      res.end();
    }
  });

  return router;
}
