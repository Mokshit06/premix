import { useCallback, useEffect, useRef, useState } from 'react';

function useForceUpdate() {
  const [, dispatch] = useState({});

  const forceUpdate = useCallback(() => {
    dispatch({});
  }, []);

  return forceUpdate;
}

export default function loadable(importFn, { fallback = props => null } = {}) {
  return function LoadableComponent(props) {
    const component = useRef(fallback);
    const forceUpdate = useForceUpdate();

    if (globalThis.__LOADABLE_CACHE__?.[importFn.toString()]) {
      component.current = globalThis.__LOADABLE_CACHE__[importFn.toString()];
    }

    useEffect(() => {
      if (globalThis.__LOADABLE_CACHE__?.[importFn.toString()]) return;

      importFn(props).then(mod => {
        component.current = mod.default;
        forceUpdate();
      });
    }, []);

    return <component.current {...props} />;
  };
}
