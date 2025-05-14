import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../utils/errors';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Default error response
  let statusCode = 500;
  let message = 'Internal server error';
  let errors: Record<string, string> | undefined;
  
  console.error(err);
  
  // Handle operational errors
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    
    if (err instanceof ValidationError) {
      errors = err.errors;
    }
  }
  
  // Handle Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    statusCode = 400;
    message = 'Database operation failed';
  }
  
  // Send error response
  const errorResponse: Record<string, any> = {
    status: statusCode >= 500 ? 'error' : 'fail',
    message,
  };
  
  if (errors) {
    errorResponse.errors = errors;
  }
  
  // Only include stack trace in development
  if (process.env.NODE_ENV !== 'production' && err.stack) {
    errorResponse.stack = err.stack;
  }
  
  res.status(statusCode).json(errorResponse);
}; 