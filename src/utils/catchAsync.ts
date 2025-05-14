import { Request, Response, NextFunction } from 'express';

// Higher-order function that wraps async controller functions
// to avoid try-catch blocks in every controller
export const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}; 