import { createContext, useContext } from 'preact/compat';

const RemixContext = createContext(null);

export function RemixProvider({ context, children }) {
  return (
    <RemixContext.Provider value={context}>{children}</RemixContext.Provider>
  );
}

export const useRemix = () => {
  const context = useContext(RemixContext);

  if (!context) {
    throw new Error('"useRemix" should be called inside "RemixProvider"');
  }

  return context;
};
export const useRouteData = () => {
  const { data } = useRemix();

  return data.props;
};

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

  return links.map(link => (
    <link rel={link.rel} href={link.href} media={link.media} />
  ));
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
