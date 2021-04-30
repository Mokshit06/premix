import * as Express from 'express';
import { Headers, Request } from 'node-fetch';

export function transformRequest(req: Express.Request) {
  const headers = new Headers();

  Object.entries(req.headers).map(([key, value]) => {
    headers.append(key, value.toString());
  });

  return new Request(`${req.protocol}://${req.hostname}${req.url}`, {
    method: req.method,
    body: ['get', 'head'].includes(req.method.toLowerCase())
      ? null
      : JSON.stringify(req.body),
    headers: new Headers(),
  });
}

export function transformResponse(res: Express.Response) {}
