import React, {
  createContext,
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

const PremixContext = createContext(null);
const RouteDataContext = createContext(null);
const PendingFormDataContext = createContext(null);

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
  const data = useState(() => context.data.props);
  const formData = useState(null);

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <PremixContext.Provider value={premix}>
        <PendingFormDataContext.Provider value={formData}>
          <RouteDataContext.Provider value={data}>
            {children}
          </RouteDataContext.Provider>
        </PendingFormDataContext.Provider>
      </PremixContext.Provider>
    </ErrorBoundary>
  );
}

export const usePremix = () => useContext(PremixContext);
export const useRouteData = () => {
  const context = useContext(RouteDataContext);

  if (context == null) throw new Error('useRouteData called outside Context');

  return context;
};
const usePendingFormData = () => useContext(PendingFormDataContext);

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
      {meta.description && (
        <meta name="description" content={meta.description} />
      )}
    </>
  );
}

export function Links() {
  const [{ links }] = usePremix();

  return links.map(link => (
    <Fragment key={link.href}>
      {['preload', 'modulepreload'].includes(link.rel) ? (
        <link rel={link.rel} as={link.as} href={link.href} />
      ) : (
        <>
          <link rel="preload" as="style" href={link.href} media={link.media} />
          <link rel={link.rel} href={link.href} media={link.media} />
        </>
      )}
    </Fragment>
  ));
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
  const [, setPendingFormData] = usePendingFormData();
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(formRef.current);
    const json = Object.fromEntries((formData as any).entries());

    setPendingFormData(formData);

    const response = await fetch(action, {
      method: 'post',
      body: JSON.stringify(json),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    setPendingFormData(null);

    const redirectTo = response.url;
    window.location.href = redirectTo;
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

export function usePendingFormSubmit(): FormData {
  const [pendingFormData] = usePendingFormData();

  return pendingFormData;
}

export function makeRoutes(
  routes: (Route & { component?: (props: any) => ReactElement })[]
) {
  return routes.map(route => ({
    ...route,
    component: route.component || loadable(route.page),
  }));
}
