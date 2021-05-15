import {
  BrowserHistory,
  createBrowserHistory,
  parsePath,
  Location,
  PartialLocation,
  Action,
  createPath,
  To,
} from 'history';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  Router,
  Link as ReactRouterLink,
  LinkProps as ReactRouterLinkProps,
  useLocation as useReactRouterLocation,
} from 'react-router-dom';
import { useSetPendingLocation, useSetPendingFormSubmit } from 'src';
import { fetchRouteData } from './client';

interface PremixState {
  meta: Record<string, string>;
  links: {
    rel: string;
    as?: string;
    href: string;
    media?: string;
    [key: string]: string;
  }[];
  data: {
    props: any;
  };
  script: string;
}

const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export * from 'react-router-dom';

export function useLocation() {
  return useReactRouterLocation() as Location<PremixState>;
}

export interface LinkProps extends Omit<ReactRouterLinkProps, 'to'> {
  href: string;
}

export function Link({ href, ...props }: LinkProps) {
  const fetchedData = useRef(false);

  const prefetch = async () => {
    if (fetchedData.current) return;
    await fetchRouteData(href);
    fetchedData.current = true;
  };

  return (
    <ReactRouterLink
      to={href}
      {...props}
      onTouchStart={async e => {
        await prefetch();
        props.onTouchStart && props.onTouchStart(e);
      }}
      onMouseOver={async e => {
        await prefetch();
        props.onMouseOver && props.onMouseOver(e);
      }}
    />
  );
}

export function PremixBrowserRouter({
  children,
  value,
}: {
  children: React.ReactNode;
  value: any;
}) {
  const [, setPendingLocation] = useSetPendingLocation();
  const [, setPendingFormSubmit] = useSetPendingFormSubmit();
  const historyRef = useRef<BrowserHistory>();

  if (historyRef.current == null) {
    const browserHistory = createBrowserHistory({ window });

    historyRef.current = {
      ...browserHistory,
      location: {
        ...browserHistory.location,
        state: value,
      },
    };
  }

  const history = historyRef.current;

  const [state, setState] = useState({
    action: history.action,
    location: history.location,
  });

  useIsomorphicLayoutEffect(() => {
    return history.listen(async update => {
      try {
        setPendingLocation(true);
        const data = await fetchRouteData(update.location.pathname);

        setState({
          ...update,
          location: {
            ...update.location,
            state: data,
          },
        });
        setPendingLocation(false);
        setPendingFormSubmit(null);
      } catch (error) {
        throw new Error(`Error fetching route data: ${error.message}`);
      }
    });
  }, [history]);

  return (
    <Router
      children={children}
      action={state.action}
      location={state.location}
      navigator={history}
    />
  );
}

export function PremixServerRouter({
  children,
  value,
  location: loc,
}: {
  children: React.ReactNode;
  value: any;
  location: string | PartialLocation;
}) {
  if (typeof loc === 'string') {
    loc = parsePath(loc);
  }

  let action = Action.Pop;
  let location: Location = {
    pathname: loc.pathname || '/',
    search: loc.search || '',
    hash: loc.hash || '',
    state: value,
    key: loc.key || 'default',
  };

  let staticNavigator = {
    createHref(to: To) {
      return typeof to === 'string' ? to : createPath(to);
    },
    push(to: To) {
      throw new Error(
        `You cannot use navigator.push() on the server because it is a stateless ` +
          `environment. This error was probably triggered when you did a ` +
          `\`navigate(${JSON.stringify(to)})\` somewhere in your app.`
      );
    },
    replace(to: To) {
      throw new Error(
        `You cannot use navigator.replace() on the server because it is a stateless ` +
          `environment. This error was probably triggered when you did a ` +
          `\`navigate(${JSON.stringify(to)}, { replace: true })\` somewhere ` +
          `in your app.`
      );
    },
    go(delta: number) {
      throw new Error(
        `You cannot use navigator.go() on the server because it is a stateless ` +
          `environment. This error was probably triggered when you did a ` +
          `\`navigate(${delta})\` somewhere in your app.`
      );
    },
    back() {
      throw new Error(
        `You cannot use navigator.back() on the server because it is a stateless ` +
          `environment.`
      );
    },
    forward() {
      throw new Error(
        `You cannot use navigator.forward() on the server because it is a stateless ` +
          `environment.`
      );
    },
    block() {
      throw new Error(
        `You cannot use navigator.block() on the server because it is a stateless ` +
          `environment.`
      );
    },
  };

  return (
    <Router
      children={children}
      action={action}
      location={location}
      navigator={staticNavigator}
      static={true}
    />
  );
}
