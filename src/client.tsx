import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocation } from './router';
import { PremixState } from './types';

export function formatDataURL(url: string) {
  return `/_premix/data${url === '/' ? '/index' : url}.json`;
}

export async function fetchRouteData(url: string) {
  const res = await fetch(formatDataURL(url));
  const data = await res.json();

  return data as PremixState;
}

export default function filterUnique<TArr extends Array<any>>(arr: TArr) {
  const uniqueItems = [] as TArr;

  for (let i = 0; i < arr.length; i++) {
    const arrItem = arr[i];
    if (uniqueItems.findIndex(x => x.href === arrItem.href) === -1) {
      uniqueItems.push(arrItem);
    }
  }

  return uniqueItems;
}

export function usePrefetchRouteData() {
  // Can't use `useRouter`
  // because of circular function call
  // useRouter -> usePrefetchRouteData -> useRouter
  const navigate = useNavigate();
  const location = useLocation();

  return useCallback(
    async (href: string) => {
      const data = await fetchRouteData(href);

      navigate(location.pathname, {
        replace: true,
        state: {
          ...location.state,
          links: filterUnique([
            ...location.state.links,
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
    [navigate, location]
  );
}
