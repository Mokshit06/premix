import { makeRoutes } from '../src';

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
