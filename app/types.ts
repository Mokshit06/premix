import { JSX } from 'preact';

export interface Meta {
  title?: string;
  description?: string;
  [key: string]: string;
}

export interface Link {
  rel: string;
  href: string;
  media?: string;
}

export type LinksFunction = () => Link[];
export type MetaFunction = () => Meta;

export type Page = Promise<{
  default: (props: any) => JSX.Element;
  meta?: MetaFunction;
  links?: LinksFunction;
}>;

export interface Route {
  path: string;
  page: () => Page;
  loader?: () => Promise<{
    default: () => Record<string, any>;
  }>;
}
