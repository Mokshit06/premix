import { hydrate } from 'preact/compat';
import App from './app/App';
import { routes } from './app/routes';

const initialData = JSON.parse((window as any).__INITIAL_DATA__);

async function start() {
  const path = window.location.pathname;
  const page = await routes.find(x => x.path === path).page();

  hydrate(
    <App Component={page.default} pageProps={initialData} />,
    document.getElementById('root')
  );
}

start();
