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
export type StaticLoaderFunction<TData = any> = (ctx: {
  params: Record<string, string>;
}) => Promise<{
  props: TData;
  revalidate?: number;
}>;
export type ServerLoaderFunction<TData = any> = (req: Request) => Promise<{
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
  staticLoader?: StaticLoaderFunction;
  serverLoader?: ServerLoaderFunction;
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
  watchServer?: {
    url: string;
  };
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
