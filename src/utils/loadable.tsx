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

    useEffect(() => {
      importFn(props).then(mod => {
        component.current = mod.default;
        forceUpdate();
      });
    }, []);

    return <component.current {...props} />;
  };
}
