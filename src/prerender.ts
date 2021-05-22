import renderApp from '@premix/core/utils/render-app';
import handleRequest from 'app/entry-server';
import chalk from 'chalk';
import fs from 'fs-extra';
import fetch, { Request, Response } from 'node-fetch';
import { compile } from 'path-to-regexp';

const routes = globalThis.__PREMIX_MANIFEST__;

global.fetch = fetch as any;
global.Request = Request as any;
global.Response = Response as any;

async function writeHTMLFile(path: string) {
  const [App, data] = await renderApp(path);
  const fileName = path === '/' ? '/index' : path;
  try {
    fs.outputFileSync(`out${fileName}.html`, handleRequest(App), 'utf8');
    fs.outputJSONSync(`out/_premix/data${fileName}.json`, data);

    console.log(chalk.green`{underline pre-rendered} ${fileName}`);
  } catch (error) {
    console.log(chalk.red`Error: ${path}`);
  }
}

async function prerender() {
  fs.copySync('.premix/public', 'out');

  const pages = [];

  await Promise.all(
    routes.map(async route => {
      const page = await route.page();
      if (page.action) {
        console.log(
          chalk.yellow`{bold.underline WARNING}: Actions do not work with Prerendering [${route.path}]`
        );
      }

      if (page.loadPaths) {
        const { paths } = await page.loadPaths();
        paths.forEach(path => {
          const toPath = compile(route.path, { encode: encodeURIComponent });
          const url = toPath(path.params);

          pages.push(url);
        });
      } else {
        pages.push(route.path);
      }
    })
  );

  await Promise.all(pages.map(writeHTMLFile));
}

prerender()
  .catch(error => {
    console.error(error);
  })
  .finally(() => process.exit(0));
