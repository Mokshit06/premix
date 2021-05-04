import { routes } from 'app/routes';
import renderApp from 'src/utils/render-app';
import { promises as fs } from 'fs';
import handleRequest from 'app/entry-server';
import { compile } from 'path-to-regexp';
import fetch, { Request, Response } from 'node-fetch';
import path from 'path';
import chalk from 'chalk';

global.fetch = fetch as any;
global.Request = Request as any;
global.Response = Response as any;

async function writeHTMLFile(path: string) {
  const [App] = await renderApp(path);
  const fileName = path === '/' ? '/index.html' : `${path}.html`;
  fs.writeFile(`out${fileName}`, handleRequest(App), 'utf8');

  console.log(chalk.green`{underline pre-rendered} ${fileName}`);
}

async function copyFolder(from: string, to: string) {
  await fs.mkdir(to);
  const dir = await fs.readdir(from);
  const promises = dir.map(async element => {
    if ((await fs.lstat(path.join(from, element))).isFile()) {
      await fs.copyFile(path.join(from, element), path.join(to, element));
    } else {
      await copyFolder(path.join(from, element), path.join(to, element));
    }
  });

  await Promise.all(promises);
}

async function prerender() {
  const pages = [];

  await fs.mkdir('out');

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

  await copyFolder('public/build', 'out/build');
}

prerender()
  .catch(error => {
    console.error(error);
  })
  .finally(() => process.exit(0));
