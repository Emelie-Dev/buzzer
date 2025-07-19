import { Request, NextFunction, Response } from 'express';

const devErrorHandler = (error: any, res: Response) => {
  return res.status(error.statusCode).json({
    status: error.status,
    message: error.message,
    stackTrace: error.stack,
    data: error.data,
    error,
  });
};

export default (error: any, _: Request, res: Response, __: NextFunction) => {
  error.status = error.status || 'error';
  error.statusCode = error.statusCode || 500;

  // delete user session if jwt is expired

  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({
      status: 'error',
      message: error.message,
      error,
    });
  } else {
    devErrorHandler(error, res);
  }
};
