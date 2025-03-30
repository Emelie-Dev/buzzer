import { NextFunction, Request, Response } from 'express';

export default (func: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    func(req, res, next).catch((err: Error) => next(err));
  };
};
