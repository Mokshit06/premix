import renderApp from '@premix/core/utils/render-app';
import handleRequest from 'app/entry-server';
import chalk from 'chalk';
import fs from 'fs-extra';
import fetch, { Request, Response } from 'node-fetch';
import { compile } from 'path-to-regexp';
import { Route } from './types';
import ora from 'ora';

global.fetch = fetch as any;
global.Request = Request as any;
global.Response = Response as any;

const routes = globalThis.__PREMIX_MANIFEST__ as Route[];

const shouldExport = process.argv[2] === '--export';

let numPagesSSR = 0;
let numPagesRendered = 0;

const spinner = ora({
  spinner: 'dots',
  text: 'Starting prerendering',
  color: 'blue',
}).start();

async function writeHTMLFile(path: string) {
  const [App, data] = await renderApp(path);
  const fileName = path === '/' ? '/index' : path;

  if (!spinner.isSpinning) return;

  try {
    spinner.text = `Prerendering ${path}`;

    fs.outputFileSync(
      `.premix/public${fileName}.html`,
      handleRequest(App),
      'utf8'
    );
    fs.outputJSONSync(`.premix/public/_premix/data${fileName}.json`, data);

    numPagesRendered++;
  } catch (error) {
    spinner.fail(`Error: ${path}\n${error}`);
  }
}

async function prerender() {
  const pages = [];

  await Promise.all(
    routes.map(async route => {
      const page = await route.page();
      if (shouldExport) {
        if (page.action) {
          if (!spinner.isSpinning) return;
          spinner.warn(
            chalk.yellow`{bold.underline WARNING}: Actions do not work with Prerendering [${route.path}]`
          );
        }

        if (page.serverLoader) {
          if (!spinner.isSpinning) return;
          spinner.warn(
            chalk.yellow`{bold.underline WARNING}: Server loaders do not work with Prerendering [${route.path}]`
          );
        }
      }

      if (page.loadPaths) {
        const { paths } = await page.loadPaths();
        paths.forEach(path => {
          const toPath = compile(route.path, { encode: encodeURIComponent });
          const url = toPath(path.params);

          pages.push(url);
        });
      } else if (page.staticLoader) {
        pages.push(route.path);
      } else if (page.serverLoader || page.action) {
        numPagesSSR++;
      }
    })
  );

  spinner.text = 'Writing files';

  await Promise.all(pages.map(writeHTMLFile));

  fs.copySync('.premix/public', 'out');
  if (!spinner.isSpinning) return;

  if (shouldExport) {
    return spinner.succeed(`Prerendered ${numPagesRendered} pages!`);
  }

  spinner.text = `Statically optimized ${numPagesRendered} pages`;
  spinner.succeed();
  spinner.succeed(`Server render ${numPagesSSR} pages`);
}

prerender()
  .catch(error => {
    spinner.fail(error.message ? error.message : error);
  })
  .finally(() => process.exit(0));
