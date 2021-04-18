import { routes } from './app/routes';
import renderApp from './src/utils/renderApp';
import handleRequest from './app/entry-server';
import { promises as fs } from 'fs';
import path from 'path';
import fetch from 'node-fetch';

global.fetch = fetch as any;

async function prerender() {
  for (const route of routes) {
    const RemixApp = await renderApp(route.path);
    const html = handleRequest(RemixApp);

    const fileName = `public/${
      route.path === '/' ? 'index' : route.path.replace(/^\//, '')
    }.html`;

    const folder = fileName.split('/').slice(0, -1).join('/');

    await fs.mkdir(path.join(process.cwd(), folder), { recursive: true });

    await fs.writeFile(path.join(process.cwd(), fileName), html, 'utf8');
    console.log(`PRERENDERED: ${fileName}`);
  }

  process.exit(0);
}

prerender();
