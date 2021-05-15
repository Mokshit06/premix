import renderApp from '@premix/core/utils/render-app';
import fs from 'fs-extra';
import handleRequest from 'app/entry-server';
import { compile } from 'path-to-regexp';
import fetch, { Request, Response } from 'node-fetch';
import path from 'path';
import chalk from 'chalk';

const routes = globalThis.__PREMIX_MANIFEST__;

global.fetch = fetch as any;
global.Request = Request as any;
global.Response = Response as any;

async function writeHTMLFile(path: string) {
  const [App, data] = await renderApp(path);
  const fileName = path === '/' ? '/index.html' : `${path}.html`;
  await fs.outputFile(`out${fileName}`, handleRequest(App), 'utf8');
  await fs.outputJSON(
    `out/_premix/data${path === '/' ? '/index' : path}.json`,
    data
  );

  console.log(chalk.green`{underline pre-rendered} ${fileName}`);
}

async function prerender() {
  if (await fs.pathExists('out')) {
    await fs.rmdir('out');
  }

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

  await Promise.all(pages.map(page => writeHTMLFile(page)));

  await fs.copy('public', 'out');
}

prerender()
  .catch(error => {
    console.error(error);
  })
  .finally(() => process.exit(0));
