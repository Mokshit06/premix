import { Route } from './types';

export const routes: Route[] = [
  {
    page: () => import('./pages'),
    path: '/',
    loader: () => import('./loaders'),
  },
  {
    path: '/about',
    page: () => import('./pages/about'),
  },
];
