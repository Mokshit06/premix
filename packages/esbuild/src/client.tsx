import { routes } from '../app/routes';
import matchRoute from './utils/matchRoute';

export async function currentPage() {
  const path = window.location.pathname;
  const page = await routes.find(x => matchRoute(x.path, path)).page();

  return page.default;
}
