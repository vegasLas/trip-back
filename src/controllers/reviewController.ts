import { Request, Response } from 'express';
import * as reviewService from '../services/reviewService';
import * as userService from '../services/userService';
import { catchAsync } from '../utils/catchAsync';
import { BadRequestError, ForbiddenError } from '../utils/errors';
import {
  IdParams,
  CreateReviewRequest,
  UpdateReviewRequest
} from '../types';

// Helper function to get tourist ID from user ID
const getTouristIdFromUser = async (userId: number): Promise<number> => {
  const user = await userService.getUserProfile(userId);
  if (!user.tourist) {
    throw new BadRequestError('User is not a tourist');
  }
  return user.tourist.id;
};

// Get reviews for a program
export const getProgramReviews = catchAsync(async (req: IdParams, res: Response) => {
  const programId = parseInt(req.params.id);
  
  if (isNaN(programId)) {
    throw new BadRequestError('Invalid program ID');
  }
  
  const reviews = await reviewService.getProgramReviews(programId);
  
  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: reviews
  });
});

// Get reviews for a guide
export const getGuideReviews = catchAsync(async (req: Request, res: Response) => {
  const guideId = parseInt(req.params.guideId);
  
  if (isNaN(guideId)) {
    throw new BadRequestError('Invalid guide ID');
  }
  
  const reviews = await reviewService.getGuideReviews(guideId);
  
  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: reviews
  });
});

// Get review by ID
export const getReviewById = catchAsync(async (req: IdParams, res: Response) => {
  const reviewId = parseInt(req.params.id);
  
  if (isNaN(reviewId)) {
    throw new BadRequestError('Invalid review ID');
  }
  
  const review = await reviewService.getReviewById(reviewId);
  
  res.status(200).json({
    status: 'success',
    data: review
  });
});

// Create new review
export const createReview = catchAsync(async (req: CreateReviewRequest, res: Response) => {
  if (!req.user || !req.user.isTourist) {
    throw new ForbiddenError('Only tourists can create reviews');
  }
  
  // Get tourist ID from user ID
  const touristId = await getTouristIdFromUser(req.user.id);
  
  const review = await reviewService.createReview(touristId, req.body);
  
  res.status(201).json({
    status: 'success',
    data: review
  });
});

// Update review
export const updateReview = catchAsync(async (req: UpdateReviewRequest, res: Response) => {
  if (!req.user || !req.user.isTourist) {
    throw new ForbiddenError('Only tourists can update reviews');
  }
  
  const reviewId = parseInt(req.params.id);
  
  if (isNaN(reviewId)) {
    throw new BadRequestError('Invalid review ID');
  }
  
  // Get tourist ID from user ID
  const touristId = await getTouristIdFromUser(req.user.id);
  
  const review = await reviewService.updateReview(reviewId, touristId, req.body);
  
  res.status(200).json({
    status: 'success',
    data: review
  });
});

// Delete review
export const deleteReview = catchAsync(async (req: IdParams, res: Response) => {
  if (!req.user || !req.user.isTourist) {
    throw new ForbiddenError('Only tourists can delete reviews');
  }
  
  const reviewId = parseInt(req.params.id);
  
  if (isNaN(reviewId)) {
    throw new BadRequestError('Invalid review ID');
  }
  
  // Get tourist ID from user ID
  const touristId = await getTouristIdFromUser(req.user.id);
  
  await reviewService.deleteReview(reviewId, touristId);
  
  res.status(204).send();
}); 