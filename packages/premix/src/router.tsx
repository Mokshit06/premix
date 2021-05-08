import { useRef } from 'react';
import {
  NavLink,
  useLocation,
  useNavigate,
  NavLinkProps,
  useInRouterContext,
} from 'react-router-dom';
import { usePremix, useSetPendingLocation } from 'src';
import { fetchRouteData } from './client';

function isModifiedEvent(event: React.MouseEvent) {
  return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);
}

export function Link({
  replace = false,
  ...props
}: NavLinkProps & {
  replace?: boolean;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [, setPremix] = usePremix();
  const [, setPendingLocation] = useSetPendingLocation();
  const isFetched = useRef(false);
  const routeData = useRef(null);

  const handleFetch = async () => {
    // if (isFetched.current) return;
    // console.log('FETCHING');
    // const data = await fetchRouteData(
    //   typeof props.to === 'string' ? props.to : props.to.pathname
    // );
    // console.log('DONE FETCHING');
    // console.log({ data });
    // routeData.current = data;
    // isFetched.current = true;
  };

  const handleClick: React.MouseEventHandler<HTMLAnchorElement> = async e => {
    if (props.onClick) props.onClick(e);

    if (
      !e.defaultPrevented && // onClick prevented default
      e.button === 0 && // ignore right clicks
      !props.target && // let browser handle "target=_blank" etc.
      !isModifiedEvent(e) // ignore clicks with modifier keys
    ) {
      // e.preventDefault();
      // setPendingLocation(true);
      // await handleFetch();
      // navigate(props.to);
      // setPremix(routeData.current);
      // setPendingLocation(false);
    }
  };

  return (
    <NavLink
      {...props}
      onMouseOver={e => {
        props.onMouseOver && props.onMouseOver(e);
        handleFetch();
      }}
      onTouchStart={e => {
        props.onTouchStart && props.onTouchStart(e);
        handleFetch();
      }}
      onClick={handleClick}
    />
  );
}
