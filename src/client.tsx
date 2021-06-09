import { useCallback } from 'react';
import { useRouter } from './router';

export function formatDataURL(url: string) {
  return `/_premix/data${url === '/' ? '/index' : url}.json`;
}

export async function fetchRouteData(url: string) {
  const res = await fetch(formatDataURL(url));
  const data = await res.json();

  return data;
}

export function usePrefetchRouteData() {
  const router = useRouter();

  return useCallback(
    (href: string) => {
      router.navigate(router.href, {
        replace: true,
        state: {
          ...router.state,
          links: [
            ...router.state.links,
            {
              as: 'fetch',
              rel: 'prefetch',
              href: formatDataURL(href),
            },
          ],
          shallow: true,
        },
      });
    },
    [router]
  );
}
