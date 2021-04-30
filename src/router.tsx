import { createBrowserHistory, createMemoryHistory, History } from 'history';
import { VNode } from 'preact';
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'preact/compat';

const RouterContext = createContext(null);

export function Router({
  children,
  history,
}: {
  children: (props: any) => VNode;
  history: History<any>;
}) {
  const [location, setLocation] = useState(history.location);
  const _isMounted = useIsMounted();
  const _pendingLocation = useRef(null);

  useEffect(() => {
    // if (!)
  }, []);

  useEffect(() => {
    if (_pendingLocation.current) {
      setLocation(_pendingLocation.current);
    }
  }, []);

  return <RouterContext.Provider value={{}}>{children}</RouterContext.Provider>;
}

function useIsMounted() {
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
  }, []);

  return isMounted;
}

// export const useRouter = () => useContext(RouterContext);
