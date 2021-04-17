import { Route } from './types';

export const routes: Route[] = [
  {
    path: '/',
    page: () => import('./pages'),
  },
  {
    path: '/post/:post',
    page: () => import('./pages/post'),
  },
];
