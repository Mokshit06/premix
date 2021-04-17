// import ReactDOMServer from "react-dom/server";
import { Request } from 'express';
import { JSX } from 'preact';
import renderToString from 'preact-render-to-string';

export default function handleRequest(req: Request, App: () => JSX.Element) {
  const markup = renderToString(<App />);

  return `<!DOCTYPE html>${markup}`;
}
