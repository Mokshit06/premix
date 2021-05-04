import { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import {
  BrowserRouter,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { fetchRouteData } from 'src/client';
import { PremixProvider, usePremix, useSetPendingLocation } from '../src';
import matchRoute from '../src/utils/matchRoute';
import App from './App';
import { routes } from './routes';

const premixData = document.getElementById('__PREMIX_DATA__');
const initialData = JSON.parse(premixData.innerHTML);

function useIsMounted() {
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
    };
  }, []);

  return isMounted.current;
}

function HistoryWrapper() {
  // const navigate = useNavigate();
  // const isMounted = useIsMounted();
  // const location = useLocation();
  // const [, setPremix] = usePremix();
  // const [, setPendingLocation] = useSetPendingLocation();

  // useEffect(() => {
  //   if (!isMounted) return;

  //   setPendingLocation(true);

  //   fetchRouteData(location.pathname).then(data => {
  //     console.log('DONE FETCHING');
  //     console.log({ data });

  //     setPremix(data);
  //     // setPendingLocation(false);
  //   });
  // }, [location]);

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

  globalThis.__LOADABLE_CACHE__ = {};
  globalThis.__LOADABLE_CACHE__[route.page.toString()] = Component;

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
