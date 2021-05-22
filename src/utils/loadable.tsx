import { useCallback, useRef, useState } from 'react';

function useForceUpdate() {
  const [, dispatch] = useState({});

  const forceUpdate = useCallback(() => {
    dispatch({});
  }, []);

  return forceUpdate;
}

export default function loadable(
  importFn,
  { fallback = (props: any) => null } = {}
) {
  return function LoadableComponent(props) {
    const component = useRef(fallback);
    const forceUpdate = useForceUpdate();

    if (!globalThis.__LOADABLE_CACHE__) {
      globalThis.__LOADABLE_CACHE__ = {};
    }

    if (globalThis.__LOADABLE_CACHE__[importFn.toString()]) {
      component.current = globalThis.__LOADABLE_CACHE__[importFn.toString()];
    } else {
      importFn(props).then(mod => {
        component.current = mod.default;
        globalThis.__LOADABLE_CACHE__[importFn.toString()] = mod.default;
        forceUpdate();
      });
    }

    return <component.current {...props} />;
  };
}
