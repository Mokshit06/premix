declare module 'url:*' {
  const fileUrl: string;
  export default fileUrl;
}

declare module 'img:*' {
  function Image({
    className,
  }: {
    className?: string;
  }): import('react').ReactElement;
  export default Image;
}

declare interface Window {
  __LOADABLE_CACHE__: Record<
    string,
    (props: any) => import('react').ReactElement
  >;
}
