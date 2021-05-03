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
import { Route } from './types';
import loadable from './utils/loadable';

interface PremixContextState {
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
}

const PremixContext = createContext<
  [PremixContextState, Dispatch<PremixContextState>]
>(null);
const PendingLocationContext = createContext<[boolean, Dispatch<boolean>]>(
  null
);
const PendingFormDataContext = createContext<[FormData, Dispatch<FormData>]>(
  null
);

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
  const formData = useState(null);
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

export const usePremix = () => useContext(PremixContext);

const useSetPendingFormSubmit = () => useContext(PendingFormDataContext);
export function usePendingFormSubmit(): FormData {
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
      {Object.entries(meta).map(([name, content]) => (
        <meta key={name} name={name} content={content} />
      ))}
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
      <script type="module" src="/build/entry-client.js"></script>
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

export const Form = forwardRef<
  HTMLFormElement,
  { action: string; children: ReactNode }
>(({ children, action }, ref) => {
  const [, setPendingFormData] = useSetPendingFormSubmit();
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(formRef.current);

    setPendingFormData(formData);

    const response = await fetch(action, {
      method: 'post',
      body: new URLSearchParams(formData as any),
    });

    setPendingFormData(null);

    const redirectTo = response.url;

    if (response.redirected) {
      window.location.href = redirectTo;
    }
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
});

export function makeRoutes(
  routes: (Route & { component?: (props: any) => ReactElement })[]
) {
  return routes.map(route => ({
    ...route,
    component: route.component || loadable(route.page),
  }));
}
