import { Request, Response } from 'express';

export default (req: Request, res: Response) => {
  res.json({
    hello: 'world',
  });
};
