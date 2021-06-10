import { useCallback } from 'react';
import { useRouter, PremixState } from './router';
import uniqueLinks from './utils/links';

export function formatDataURL(url: string) {
  return `/_premix/data${url === '/' ? '/index' : url}.json`;
}

export async function fetchRouteData(url: string) {
  const res = await fetch(formatDataURL(url));
  const data = await res.json();

  return data as PremixState;
}

export function usePrefetchRouteData() {
  const router = useRouter();

  return useCallback(
    async (href: string) => {
      const data = await fetchRouteData(href);

      router.navigate(router.href, {
        replace: true,
        state: {
          ...router.state,
          links: uniqueLinks([
            ...router.state.links,
            ...data.links.map(link => {
              const isJs = link.href.endsWith('.js');

              return {
                href: link.href,
                rel: isJs ? 'modulepreload' : 'preload',
                as: link.as || isJs ? null : 'style',
              };
            }),
            {
              as: 'fetch',
              rel: 'prefetch',
              href: formatDataURL(href),
            },
          ]),
          shallow: true,
        },
      });
    },
    [router]
  );
}
