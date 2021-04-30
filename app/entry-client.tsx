import { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter, Route, Switch, useHistory } from 'react-router-dom';
import { PremixProvider } from '../src';
import { useFetchRouteData } from '../src/client';
import matchRoute from '../src/utils/matchRoute';
import App from './App';
import { routes } from './routes';

const premixData = document.getElementById('__PREMIX_DATA__');
const initialData = JSON.parse(premixData.innerHTML);

function HistoryWrapper() {
  const history = useHistory();
  const fetchRouteData = useFetchRouteData();

  useEffect(() => {
    const unsubscribe = history.listen(location =>
      fetchRouteData(location.pathname)
    );

    return () => unsubscribe();
  }, []);

  return (
    <Switch>
      {routes.map(route => (
        <Route
          key={route.path}
          path={route.path}
          exact
          component={route.component}
        />
      ))}
    </Switch>
  );
}

async function init() {
  const route = routes.find(x => matchRoute(x.path, window.location.pathname));
  await route.page();

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
