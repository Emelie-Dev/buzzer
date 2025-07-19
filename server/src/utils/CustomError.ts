class CustomError extends Error {
  statusCode: number;
  status: 'fail' | 'error';
  isOperational: boolean;
  data: any;

  constructor(message: string, statusCode: number = 500, data: any = {}) {
    super(message);
    this.statusCode = statusCode;
    this.status = statusCode >= 400 && statusCode < 500 ? 'fail' : 'error';
    this.isOperational = true;
    this.data = data;

    Error.captureStackTrace(this, this.constructor);
  }
}

export default CustomError;
