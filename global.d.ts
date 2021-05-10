declare module 'url:*' {
  const fileUrl: string;
  export default fileUrl;
}

declare module 'img:*' {
  function Image({ className }: { className?: string }): React.ReactElement;
  export default Image;
}

declare module 'worker:*' {
  const workerConstructor: {
    new (): Worker;
  };
  export default workerConstructor;
}

declare interface Window {
  __LOADABLE_CACHE__: Record<string, (props: any) => React.ReactElement>;
}
