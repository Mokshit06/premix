import type { Request, Response } from 'express';
import type { ReactElement } from 'react';

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
export type ActionFunction = (request: Request, response: Response) => any;

export type Page = Promise<{
  default: (props: any) => ReactElement;
  meta?: MetaFunction;
  links?: LinksFunction;
  loader?: LoaderFunction;
  action?: ActionFunction;
}>;

export interface Route {
  path: string;
  page: () => Page;
}
