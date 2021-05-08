import React, {
  createContext,
  Dispatch,
  forwardRef,
  Fragment,
  ReactElement,
  ReactNode,
  useContext,
  useRef,
  useState,
} from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useLocation, useNavigate } from 'react-router-dom';
import { fetchRouteData } from './client';
import { Route } from './types';
import loadable from './utils/loadable';

interface PremixContextState {
  meta: Record<string, string>;
  links: {
    rel: string;
    as?: string;
    href: string;
    media?: string;
    [key: string]: string | undefined;
  }[];
  data: {
    props: any;
  };
  script: string;
}

const PremixContext = createContext<
  [PremixContextState, Dispatch<PremixContextState>]
>(null);
const PendingLocationContext = createContext<[boolean, Dispatch<boolean>]>(
  null
);
const PendingFormDataContext = createContext<
  [FormData | null, Dispatch<FormData | null>]
>(null);

function ErrorFallback({ error }) {
  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre>{error.message}</pre>
    </div>
  );
}

export function PremixProvider({ context, children }) {
  const premix = useState(context);
  // const data = useState(() => context.data.props);
  const formData = useState<FormData | null>(null);
  const pendingLocation = useState(false);

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <PremixContext.Provider value={premix}>
        <PendingLocationContext.Provider value={pendingLocation}>
          <PendingFormDataContext.Provider value={formData}>
            {children}
          </PendingFormDataContext.Provider>
        </PendingLocationContext.Provider>
      </PremixContext.Provider>
    </ErrorBoundary>
  );
}

export const usePremix = () => {
  const context = useContext(PremixContext);
  if (context === null) {
    throw new Error('usePremix must be called inside <PremixContext />');
  }

  return context;
};
// export const usePremix = () => useContext(PremixContext);

const useSetPendingFormSubmit = () => useContext(PendingFormDataContext);
export function usePendingFormSubmit() {
  const [pendingFormData] = useSetPendingFormSubmit();
  return pendingFormData;
}

export const useSetPendingLocation = () => useContext(PendingLocationContext);
export function usePendingLocation() {
  const [data] = useContext(PendingLocationContext);
  return data;
}

export function useRouteData<TRouteData = any>(): TRouteData {
  const [{ data }] = useContext(PremixContext);
  return data.props;
}

export function Meta() {
  const [{ meta }] = usePremix();

  return (
    <>
      {meta.title && (
        <>
          <title>{meta.title}</title>
          <meta name="title" content={meta.title} />
        </>
      )}
      {Object.entries(meta).map(
        ([name, content]) =>
          name !== 'title' && <meta key={name} name={name} content={content} />
      )}
    </>
  );
}

export function Links() {
  const [{ links }] = usePremix();

  return (
    <>
      {links.map(link => (
        <Fragment key={link.href}>
          {['preload', 'modulepreload'].includes(link.rel) ? (
            <link rel={link.rel} as={link.as} href={link.href} />
          ) : (
            <>
              <link
                rel="preload"
                as="style"
                href={link.href}
                media={link.media}
              />
              <link rel={link.rel} href={link.href} media={link.media} />
            </>
          )}
        </Fragment>
      ))}
    </>
  );
}

export function Scripts() {
  const [premix] = usePremix();

  return (
    <>
      <script
        id="__PREMIX_DATA__"
        type="application/json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(premix) }}
      />
      <script type="module" src={premix.script}></script>
    </>
  );
}

export function LiveReload({ url = 'http://localhost:3456' }) {
  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
      const eventSource = new EventSource('${url}/__premix/livereload');
      console.log('premix: connecting');
      eventSource.addEventListener('open', () => {
        console.log('premix: connected');
      });
      eventSource.addEventListener('message', e => {
        console.log(e.data);
        window.location.reload();
      });
      eventSource.addEventListener('error', () => {
        console.log('premix: error');
        window.location.reload()
      });      
    `.trim(),
      }}
    />
  );
}

function mergeRefs<T = any>(
  ...refs: Array<React.MutableRefObject<T> | React.LegacyRef<T>>
): React.RefCallback<T> {
  return value => {
    refs.forEach(ref => {
      if (typeof ref === 'function') {
        ref(value);
      } else if (ref != null) {
        (ref as React.MutableRefObject<T | null>).current = value;
      }
    });
  };
}

type Method = 'post' | 'put' | 'delete' | 'patch';

export function useSubmit(action?: string) {
  const location = useLocation();
  const navigate = useNavigate();
  const [, setPremix] = usePremix();

  const pathname = action || location.pathname;

  return async (
    data: any,
    {
      replace = false,
      method = 'post',
    }: { replace?: boolean; method?: Method } = {}
  ) => {
    const response = await fetch(pathname, {
      method,
      body: new URLSearchParams(data),
    });

    const redirectTo = new URL(response.url).pathname;

    if (response.redirected) {
      if (redirectTo === window.location.pathname) {
        const data = await fetchRouteData(redirectTo);
        setPremix(data);
      } else {
        window.location.assign(redirectTo);
      }
    } else {
      console.log(response);
      if (process.env.NODE_ENV === 'development') {
        throw new Error('You must redirect to a path from your `actions`');
      }
    }
  };
}

export interface FormProps {
  action: string;
  children: ReactNode;
  replace?: boolean;
  method?: Method;
}

export const Form = forwardRef<HTMLFormElement, FormProps>(
  ({ children, action, replace = false, method = 'post' }, ref) => {
    const [, setPendingFormData] = useSetPendingFormSubmit();
    const formRef = useRef<HTMLFormElement>(null);
    const submit = useSubmit(action);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(formRef.current);
      setPendingFormData(formData);

      await submit(formData, {
        replace,
        method,
      });

      setPendingFormData(null);
    };

    return (
      <form
        method="post"
        action={action}
        ref={mergeRefs(formRef, ref)}
        onSubmit={handleSubmit}
      >
        {children}
      </form>
    );
  }
);

export function makeRoutes(
  routes: (Route & { component?: (props: any) => ReactElement })[]
) {
  return routes.map(route => ({
    ...route,
    component: route.component || loadable(route.page),
  }));
}

export { default as loadable } from './utils/loadable';
// export * from './server';
export * from './types';
export { default as matchRoute } from './utils/matchRoute';
