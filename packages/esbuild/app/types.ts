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

export type LinksFunction<TData = any> = (data: TData) => Link[];
export type MetaFunction<TData = any> = (data: TData) => Meta;
export type LoaderFunction<TData = Record<string, any>> = ({
  params,
}: {
  params: any;
}) => Promise<{
  props: TData;
}>;

export type Page = Promise<{
  default: (props: any) => JSX.Element;
  meta?: MetaFunction;
  links?: LinksFunction;
  loader?: LoaderFunction;
}>;

export interface Route {
  path: string;
  page: () => Page;
}
