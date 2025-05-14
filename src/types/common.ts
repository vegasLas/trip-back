import { Request, Response, NextFunction } from 'express';

// User type based on the auth middleware
export interface AuthUser {
  id: number;
  telegramId: string;
  isTourist?: boolean;
  isGuide?: boolean;
  isAdmin?: boolean;
}

// Common response type
export interface ApiResponse<T = any> {
  status: string;
  message?: string;
  data?: T;
  results?: number;
}

// Common paginated response type
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  page: number;
  limit: number;
  totalPages: number;
  totalResults: number;
}

// Common error response type
export interface ErrorResponse {
  status: string;
  message: string;
  stack?: string;
}

// Pagination query parameters
export interface PaginationQuery {
  page?: string;
  limit?: string;
  sort?: string;
}

// Basic ID parameter request
export interface IdParams extends Request {
  params: {
    id: string;
  };
  user?: AuthUser;
}

// Basic controller type that matches the catchAsync signature
export type ControllerFunction = (req: Request, res: Response, next: NextFunction) => Promise<void> | void; 