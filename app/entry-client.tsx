import { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { PremixProvider } from '../src';
import matchRoute from '../src/utils/matchRoute';
import App from './App';
import { routes } from './routes';

const premixData = document.getElementById('__PREMIX_DATA__');
const initialData = JSON.parse(premixData.innerHTML);

function HistoryWrapper() {
  return (
    <Routes>
      {routes.map(route => (
        <Route
          key={route.path}
          path={route.path}
          element={<route.component />}
        />
      ))}
    </Routes>
  );
}

async function init() {
  const route = routes.find(x => matchRoute(x.path, window.location.pathname));
  const { default: Component } = await route.page();

  (window as any).__LOADABLE_CACHE__ = {};
  (window as any).__LOADABLE_CACHE__[route.page.toString()] = Component;

  ReactDOM.hydrate(
    <PremixProvider context={initialData}>
      <BrowserRouter>
        <App Component={HistoryWrapper} />
      </BrowserRouter>
    </PremixProvider>,
    document
  );
}

init();
