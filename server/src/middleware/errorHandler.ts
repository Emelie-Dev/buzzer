import { Response } from 'express';

const devErrorHandler = (error: any, res: Response) => {
  return res.status(error.statusCode).json({
    status: error.status,
    message: error.message,
    stackTrace: error.stack,
    error,
  });
};

export default (error: any, req: any, res: any, next: any) => {
  error.status = error.status || 'error';
  error.statusCode = error.statusCode || 500;

  if (process.env.NODE_ENV) {
    devErrorHandler(error, res);
  }
};
