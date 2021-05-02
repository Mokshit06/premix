declare module 'url:*' {
  const fileUrl: string;
  export default fileUrl;
}

declare module 'img:*' {
  const image: {
    src: string;
  };
  export default image;
}
