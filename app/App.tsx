import { Links, LiveReload, Meta, Scripts } from '../src';

export default function App({ Component }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <Meta />
        <Links />
      </head>
      <body>
        <div id="__premix">
          <Component />
        </div>
        <Scripts />
        <LiveReload url="https://3456.code.mokshitjain.co" />
      </body>
    </html>
  );
}
