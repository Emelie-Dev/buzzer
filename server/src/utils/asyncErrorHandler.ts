import { NextFunction, Request, Response } from 'express';

export interface AuthRequest extends Request {
  user?: Record<string, any>;
  activeSession?: string;
}

export default (func: Function) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    func(req, res, next).catch((err: Error) => next(err));
  };
};
