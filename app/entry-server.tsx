import render from 'preact-render-to-string';
import { Request } from 'express';
import { JSX } from 'preact';

export default function handleRequest(App: () => JSX.Element) {
  const markup = render(<App />);

  return `<!DOCTYPE html>${markup}`;
}
