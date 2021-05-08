import { pathToRegexp } from 'path-to-regexp';

export default function matchRoute(route: string, toMatch: string) {
  const routeRegex = pathToRegexp(route);
  return routeRegex.test(toMatch);
}
