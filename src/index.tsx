import {
  createContext,
  Fragment,
  JSX,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'preact/compat';

const RemixContext = createContext(null);
const RouteDataContext = createContext(null);
const PendingFormDataContext = createContext(null);

export function RemixProvider({ context, children }) {
  const data = useState(() => context.data.props);
  const formData = useState(null);

  return (
    <RemixContext.Provider value={context}>
      <RouteDataContext.Provider value={data}>
        <PendingFormDataContext.Provider value={formData}>
          {children}
        </PendingFormDataContext.Provider>
      </RouteDataContext.Provider>
    </RemixContext.Provider>
  );
}

export const useRemix = () => useContext(RemixContext);
export const useRouteData = () => useContext(RouteDataContext);
const usePendingFormData = () => useContext(PendingFormDataContext);

export function Meta() {
  const { meta } = useRemix();

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
  const { links } = useRemix();

  return (
    <>
      <link rel="modulepreload" href="/build/entry-client.js" />
      {links.map(link => (
        <Fragment key={link.href}>
          <link rel="preload" as="style" href={link.href} media={link.media} />
          <link rel={link.rel} href={link.href} media={link.media} />
        </Fragment>
      ))}
    </>
  );
}

export function Scripts() {
  const remix = useRemix();

  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `window.__INITIAL_DATA__ = ${JSON.stringify(remix.data)}`,
        }}
      />
      <script type="module" src="/build/entry-client.js"></script>
    </>
  );
}

export function Form({ children, action }) {
  const [, setPendingFormData] = usePendingFormData();
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: JSX.TargetedEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fields = Object.entries(formRef.current.elements).filter(x => {
      return isNaN(x[0] as any);
    });
    const formData = Object.fromEntries(
      fields.map(x => [x[0], (x[1] as HTMLInputElement).value])
    );

    setPendingFormData(formData);

    const response = await fetch(action, {
      method: 'post',
      body: JSON.stringify(formData),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const redirectTo = response.url;
    window.location.href = redirectTo;
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit}>
      {children}
    </form>
  );
}

export function usePendingFormSubmit() {
  const [pendingFormData] = usePendingFormData();

  return pendingFormData;
}
