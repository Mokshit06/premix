import { createContext, useContext } from 'preact/compat';

const RouterContext = createContext(null);

export function RouterProvider({ children }) {
  return <RouterContext.Provider value={{}}>{children}</RouterContext.Provider>;
}

export const useRouter = () => useContext(RouterContext);
