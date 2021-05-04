import { makeRoutes } from '../src';

export const routes = makeRoutes([
  {
    path: '/',
    page: () => import('./pages'),
  },
  {
    path: '/todos',
    page: () => import('./pages/todos'),
  },
  {
    path: '/:post',
    page: () => import('./pages/$post'),
  },
]);
