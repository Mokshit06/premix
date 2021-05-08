import ReactDOMServer from 'react-dom/server';
import { ReactElement } from 'react';
import React from 'react';

export default function handleRequest(App: () => ReactElement) {
  const markup = ReactDOMServer.renderToString(<App />);

  return `<!DOCTYPE html>${markup}`;
}
