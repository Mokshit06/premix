import { useRef, useEffect, useCallback, useState } from 'react';

function useForceUpdate() {
  const [, dispatch] = useState({});

  const forceUpdate = useCallback(() => {
    dispatch({});
  }, []);

  return forceUpdate;
}

export default function loadable(importFn, { fallback = () => null } = {}) {
  return function LoadableComponent(props) {
    const component = useRef(fallback);
    const forceUpdate = useForceUpdate();

    if (typeof window !== 'undefined') {
      if ((window as any).__LOADABLE_CACHE__?.[importFn.toString()]) {
        component.current = (window as any).__LOADABLE_CACHE__[
          importFn.toString()
        ];
      }
    }

    useEffect(() => {
      if ((window as any).__LOADABLE_CACHE__?.[importFn.toString()]) return;

      importFn(props).then(mod => {
        component.current = mod.default;
        forceUpdate();
      });
    }, []);

    return <component.current {...props} />;
  };
}
