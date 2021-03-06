import { ReactDevOverlay } from '@next/react-dev-overlay/lib/client';
import { useRouter } from '@premix/core/router';
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

interface PendingFormData {
  method: Method;
  data: FormData;
}

const PendingLocationContext =
  createContext<[boolean, React.Dispatch<React.SetStateAction<boolean>>]>(null);
const PendingFormDataContext =
  createContext<
    [PendingFormData, React.Dispatch<React.SetStateAction<PendingFormData>>]
  >(null);

const ErrorFallbackComponent =
  process.env.NODE_ENV === 'development'
    ? ReactDevOverlay
    : () => <h1>Something went wrong!</h1>;

function ErrorFallback({ error }) {
  console.error(error);

  return (
    <html>
      <body>
        <ErrorFallbackComponent />
      </body>
    </html>
  );
}

export function PremixProvider({ children }) {
  const pendingFormData = useState<PendingFormData>(null);
  const pendingLocation = useState(false);

  return (
    <React.StrictMode>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <PendingLocationContext.Provider value={pendingLocation}>
          <PendingFormDataContext.Provider value={pendingFormData}>
            {children}
          </PendingFormDataContext.Provider>
        </PendingLocationContext.Provider>
      </ErrorBoundary>
    </React.StrictMode>
  );
}

export const useSetPendingFormSubmit = () => useContext(PendingFormDataContext);
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
  const {
    state: { data },
  } = useRouter();

  return data.props;
}

export function Meta() {
  const {
    state: { meta },
  } = useRouter();

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
  const {
    state: { links },
  } = useRouter();

  return (
    <>
      {links.map(link => (
        <Fragment key={link.href}>
          {['preload', 'modulepreload', 'prefetch', 'prerender'].includes(
            link.rel
          ) ? (
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
  const { state: premix } = useRouter();

  return (
    !premix.noJs && (
      <>
        <script
          id="__PREMIX_DATA__"
          type="application/json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(premix) }}
        />
        {process.env.NODE_ENV === 'production' && (
          <script noModule src="/build/nomodule.js"></script>
        )}
        <script type="module" src={premix.script}></script>
      </>
    )
  );
}

export function LiveReload() {
  if (process.env.NODE_ENV !== 'development') return null;

  const { watchServer } = process.env.PREMIX_CONFIG as any;
  const url = (watchServer?.url || 'http://localhost:[port]').replace(
    '[port]',
    '3456'
  );

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
  const router = useRouter();
  const pathname = action || router.href;

  return async (
    data: any,
    {
      replace = true,
      method = 'post',
    }: { replace?: boolean; method?: Method } = {}
  ) => {
    const response = await fetch(pathname, {
      method,
      body: new URLSearchParams(data),
      redirect: 'manual',
    });

    const redirectTo = new URL(response.url).pathname;

    if (response.type === 'opaqueredirect') {
      router.navigate(redirectTo, {
        replace: true,
      });
    } else {
      if (process.env.NODE_ENV === 'development') {
        throw new Error('You must redirect to a path from your `action`');
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
  ({ children, action, replace = true, method = 'post' }, ref) => {
    const [, setPendingFormSubmit] = useSetPendingFormSubmit();
    const formRef = useRef<HTMLFormElement>(null);
    const submit = useSubmit(action);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(formRef.current);
      setPendingFormSubmit({ data: formData, method });

      await submit(formData, {
        replace,
        method,
      });
    };

    return (
      <form
        method={method}
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

export function ErrorOverlay({ error }: { error: Error }) {
  return (
    <html>
      <head>
        <title>Premix Error</title>
      </head>
      <body>
        <div id="__premix">
          <ReactDevOverlay />
        </div>
        <script
          id="__PREMIX_DATA__"
          type="application/json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              err: {
                name: error.name,
                message: error.message,
                stack: error.stack,
              },
            }),
          }}
        />
        <script src="/build/error-entry.js" />
      </body>
    </html>
  );
}
