import param from 'regexparam';

export default function matchRoute(route: string, toMatch: string) {
  const routeRegex = param(route);
  return routeRegex.pattern.test(toMatch);
}
