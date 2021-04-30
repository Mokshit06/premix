import { ReactElement } from 'react';
import { Route } from '../src/types';
import loadable from '../src/utils/loadable';

export const routes = makeRoutes([
  {
    path: '/',
    page: () => import('./pages'),
  },
  {
    path: '/action',
    page: () => import('./pages/action'),
  },
  {
    path: '/:post',
    page: () => import('./pages/$post'),
  },
]);

function makeRoutes(
  routes: (Route & { component?: (props: any) => ReactElement })[]
) {
  return routes.map(route => ({
    ...route,
    component: route.component || loadable(route.page),
  }));
}
