import express from 'express';
import path from 'path';
import render from 'preact-render-to-string';
import { routes } from './app/routes';
import App from './app/App';

function createServer() {
  const app = express();

  const publicPath = path.join(process.cwd(), 'public');

  app.use(express.static(publicPath));

  app.use('*', async (req, res) => {
    const pathInRouter = routes.find(x => x.path === req.originalUrl);

    if (!pathInRouter) {
      return res.status(404).send('Page not found');
    }

    const page = await pathInRouter.page();
    const meta = page.meta ? page.meta() : {};
    const links = page.links ? page.links() : [];
    const loader = pathInRouter.loader
      ? (await pathInRouter.loader()).default
      : () => ({});

    const data = loader();

    const app = render(<App Component={page.default} pageProps={data} />);
    const head = render(
      <>
        {meta.title && (
          <>
            <title>{meta.title}</title>
            <meta name="title" content={meta.title} />
          </>
        )}
        {meta.description && (
          <meta name="description" content={meta.description} />
        )}
        {links.map(link => (
          <link rel={link.rel} href={link.href} media={link.media} />
        ))}
      </>
    );

    let html = /* html */ `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <!-- META -->
      </head>
      <body>
        <div id="root">
          <!-- APP -->
        </div>

        <script>
          window.__INITIAL_DATA__ = '${JSON.stringify(data)}'
        </script>
        <script type="module" src="/build/client.js"></script>
      </body>
    </html>
    `;

    html = html.replace('<!-- APP -->', app);
    html = html.replace('<!-- META -->', head);

    res.send(html);
  });

  return app;
}

const app = createServer();

app.listen(3000, () => {
  console.log('Server started on http://localhost:3000');
});
