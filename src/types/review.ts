import { Review } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';
import { AuthUser, ControllerFunction, IdParams, ApiResponse } from './common';
import { ParsedQs } from 'qs';

// Request Types
export interface CreateReviewRequest extends Request {
  body: {
    programId: number;
    guideId: number;
    rating: number;
    comment?: string;
  };
  user: AuthUser;
}

export interface UpdateReviewRequest extends Request {
  body: {
    rating?: number;
    comment?: string;
    active?: boolean;
  };
  params: {
    id: string;
  };
  user: AuthUser;
}

// Query parameters for filtering reviews
export interface ReviewQueryParams extends ParsedQs {
  programId?: string;
  guideId?: string;
  touristId?: string;
  minRating?: string;
  maxRating?: string;
  active?: string;
  page?: string;
  limit?: string;
  sort?: string;
}

export interface ReviewFilterRequest extends Request {
  query: ReviewQueryParams;
  user?: AuthUser;
}

// Service Types
export interface ReviewData {
  programId: number;
  touristId: number;
  guideId: number;
  rating: number;
  comment?: string;
  active?: boolean;
}

export interface ReviewFilters {
  programId?: number;
  guideId?: number;
  touristId?: number;
  minRating?: number;
  maxRating?: number;
  active?: boolean;
}

// Response Types
export interface ReviewResponse extends ApiResponse<Review | Review[]> {}

// Controller Types
export type GetReviewsController = (req: ReviewFilterRequest, res: Response, next: NextFunction) => Promise<void> | void;
export type GetReviewByIdController = (req: IdParams, res: Response, next: NextFunction) => Promise<void> | void;
export type CreateReviewController = (req: CreateReviewRequest, res: Response, next: NextFunction) => Promise<void> | void;
export type UpdateReviewController = (req: UpdateReviewRequest, res: Response, next: NextFunction) => Promise<void> | void;
export type DeleteReviewController = (req: IdParams, res: Response, next: NextFunction) => Promise<void> | void;
export type GetGuideReviewsController = ControllerFunction;
export type GetTouristReviewsController = ControllerFunction;
export type GetProgramReviewsController = (req: IdParams, res: Response, next: NextFunction) => Promise<void> | void; 