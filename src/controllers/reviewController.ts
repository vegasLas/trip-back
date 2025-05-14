import { Request, Response } from 'express';
import * as reviewService from '../services/reviewService';
import { catchAsync } from '../utils/catchAsync';
import { BadRequestError, ForbiddenError } from '../utils/errors';

// Get reviews for a program
export const getProgramReviews = catchAsync(async (req: Request, res: Response) => {
  const programId = parseInt(req.params.programId);
  
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
export const getReviewById = catchAsync(async (req: Request, res: Response) => {
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
export const createReview = catchAsync(async (req: Request, res: Response) => {
  if (!req.user || !req.user.isTourist) {
    throw new ForbiddenError('Only tourists can create reviews');
  }
  
  // TODO: Get tourist ID from user ID
  const touristId = 1; // This is a placeholder
  
  const review = await reviewService.createReview(touristId, req.body);
  
  res.status(201).json({
    status: 'success',
    data: review
  });
});

// Update review
export const updateReview = catchAsync(async (req: Request, res: Response) => {
  if (!req.user || !req.user.isTourist) {
    throw new ForbiddenError('Only tourists can update reviews');
  }
  
  const reviewId = parseInt(req.params.id);
  
  if (isNaN(reviewId)) {
    throw new BadRequestError('Invalid review ID');
  }
  
  // TODO: Get tourist ID from user ID
  const touristId = 1; // This is a placeholder
  
  const review = await reviewService.updateReview(reviewId, touristId, req.body);
  
  res.status(200).json({
    status: 'success',
    data: review
  });
});

// Delete review
export const deleteReview = catchAsync(async (req: Request, res: Response) => {
  if (!req.user || !req.user.isTourist) {
    throw new ForbiddenError('Only tourists can delete reviews');
  }
  
  const reviewId = parseInt(req.params.id);
  
  if (isNaN(reviewId)) {
    throw new BadRequestError('Invalid review ID');
  }
  
  // TODO: Get tourist ID from user ID
  const touristId = 1; // This is a placeholder
  
  await reviewService.deleteReview(reviewId, touristId);
  
  res.status(204).send();
}); 