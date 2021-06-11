import { BuildOptions } from 'esbuild';
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
export type LoaderFunction<TData = Record<string, any>> = (ctx: {
  params: any;
}) => Promise<{
  props: TData;
}>;
export type ActionFunction = (request: Request, response: Response) => any;
export type LoadPathsFunction = () => Promise<{
  paths: { params: Record<string, string> }[];
}>;
export type HeadersFunction<TData = any> = (
  data: TData
) => Record<string, string>;

export interface PageConfig {
  noJs?: boolean;
}

export type Page = Promise<{
  default: (props: any) => ReactElement;
  meta?: MetaFunction;
  links?: LinksFunction;
  loader?: LoaderFunction;
  action?: ActionFunction;
  loadPaths?: LoadPathsFunction;
  headers?: HeadersFunction;
  config?: PageConfig;
}>;

export interface Route {
  path: string;
  page: () => Page;
}

export type RouteWithComponent = Route & {
  component?: (props: any) => ReactElement;
};

export interface PremixConfig {
  esbuild(config: BuildOptions, options: { isServer: boolean }): BuildOptions;
}

export interface PremixState {
  meta: Record<string, string>;
  links: {
    rel: string;
    as?: string;
    href: string;
    media?: string;
    [key: string]: string;
  }[];
  data: {
    props: any;
  };
  script: string;
  noJs: boolean;
}
