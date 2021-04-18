import { Route } from '../src/types';

export const routes: Route[] = [
  {
    path: '/',
    page: () => import('./pages'),
  },
  {
    path: '/post/:post',
    page: () => import('./pages/post'),
  },
  {
    path: '/action',
    page: () => import('./pages/action'),
  },
];
