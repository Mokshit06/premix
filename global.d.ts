declare module 'url:*' {
  const fileUrl: string;
  export default fileUrl;
}

declare module 'img:*' {
  const Image: ({
    className,
  }: {
    className?: string;
  }) => import('react').ReactElement;
  export default Image;
}
