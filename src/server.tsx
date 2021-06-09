import compression from 'compression';
import express, { RequestHandler, Router } from 'express';
import morgan from 'morgan';
import fetch from 'node-fetch';
import ReactDOMServer from 'react-dom/server';
import { ErrorOverlay } from '.';
import handleRequest from '../app/entry-server';
import matchRoute from './utils/matchRoute';
import renderApp from './utils/render-app';

global.fetch = fetch as any;

const routes = globalThis.__PREMIX_MANIFEST__;

export function createRequestHandler(): RequestHandler {
  const router = Router();

  router.use(compression());

  if (process.env.NODE_ENV === 'development') {
    router.use(
      morgan('dev', {
        skip(req, res) {
          return req.url.startsWith('/build/');
        },
      })
    );
  }

  // const revalidateState = {};

  // Promise.all(
  //   routes.map(async route => {
  //     const page = await route.page();

  //     if (page.loadPaths) {
  //       const { paths } = await page.loadPaths();
  //       paths.forEach(path => {
  //         const toPath = compile(route.path, { encode: encodeURIComponent });
  //         const url = toPath(path.params);

  //         revalidateState[url] = Date.now();
  //       });
  //     } else {
  //       revalidateState[route.path] = Date.now();
  //     }
  //   })
  // );

  // router.get('*', async (req, res, next) => {
  //   if (process.env.NODE_ENV === 'development') return next();

  //   res.on('finish', async () => {
  //     try {
  //       const [PremixApp, data] = await renderApp(req.originalUrl);

  //       if (PremixApp.notFound) {
  //         return;
  //       }

  //       if (
  //         !revalidateState[req.originalUrl] ||
  //         Date.now() - revalidateState[req.originalUrl] > 1_000
  //       ) {
  //         const fileName = req.originalUrl === '/' ? '/index' : req.originalUrl;

  //         await fs.outputFile(
  //           `.premix/public${fileName}.html`,
  //           handleRequest(PremixApp),
  //           'utf8'
  //         );
  //         await fs.outputJSON(
  //           `.premix/public/_premix/data${fileName}.json`,
  //           data
  //         );
  //         revalidateState[req.originalUrl] = Date.now();
  //       } else {
  //         console.log(Date.now() - revalidateState[req.originalUrl]);
  //       }
  //     } catch (error) {}
  //   });

  //   next();
  // });

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
      const [{ notFound }, meta] = await renderApp(href as string);
      if (notFound === true) {
        return res.status(404).json({
          error: 'Page not found',
        });
      }

      const { headers, ...data } = meta;

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

  router.get('*', async (req, res) => {
    try {
      const [PremixApp, data] = await renderApp(req.originalUrl);

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
