import { usePremix, useRouteData } from '.';
import { routes } from '../app/routes';
import matchRoute from './utils/matchRoute';

export function useFetchRouteData() {
  const [, setRouteData] = useRouteData();
  const [, setRemix] = usePremix();

  return async (url: string) => {
    console.log('FETCHING');
    const route = routes.find(x => matchRoute(x.path, url));
    const res = await fetch(`/data?path=${route.path}&href=${url}`);
    const data = await res.json();

    setRouteData(data.data.props);
    setRemix(data);
    console.log('SET');
  };
}
