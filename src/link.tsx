import { Link as ReactRouterLink, LinkProps } from 'react-router-dom';
import { useFetchRouteData } from './client';

export default function Link({
  href,
  ...props
}: Omit<LinkProps, 'to'> & {
  href: string;
}) {
  const fetchRouteData = useFetchRouteData();

  return (
    <ReactRouterLink
      {...props}
      to={href}
      onClick={e => {
        fetchRouteData(href);
        props.onClick && props.onClick(e);
      }}
    />
  );
}
