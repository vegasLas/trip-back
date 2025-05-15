import { Request, Response } from 'express';
import * as userService from '../services/userService';
import { catchAsync } from '../utils/catchAsync';
import { BadRequestError, ValidationError } from '../utils/errors';
import {
  GetProfileController,
  GetUserByIdController,
  UpdateUserController,
  UpdateGuideProfileController,
  IdParams,
  UpdateUserRequest,
  UpdateGuideRequest
} from '../types';

// Helper function to get guide ID from user ID
const getGuideIdFromUser = async (userId: number): Promise<number> => {
  const user = await userService.getUserProfile(userId);
  if (!user.guide) {
    throw new BadRequestError('User is not a guide');
  }
  return user.guide.id;
};

// Helper function to get tourist ID from user ID
const getTouristIdFromUser = async (userId: number): Promise<number> => {
  const user = await userService.getUserProfile(userId);
  if (!user.tourist) {
    throw new BadRequestError('User is not a tourist');
  }
  return user.tourist.id;
};

// Get current user profile
export const getCurrentUser: GetProfileController = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }
  
  const userProfile = await userService.getUserProfile(req.user.id);
  
  res.status(200).json({
    status: 'success',
    data: userProfile
  });
});

// Get public user profile
export const getUser: GetUserByIdController = catchAsync(async (req: IdParams, res: Response) => {
  const userId = parseInt(req.params.id);
  
  if (isNaN(userId)) {
    throw new BadRequestError('Invalid user ID');
  }
  
  const userProfile = await userService.getPublicUserProfile(userId);
  
  res.status(200).json({
    status: 'success',
    data: userProfile
  });
});

// Update user profile
export const updateUser: UpdateUserController = catchAsync(async (req: UpdateUserRequest, res: Response) => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }
  
  const updatedUser = await userService.updateUserProfile(req.user.id, req.body);
  
  res.status(200).json({
    status: 'success',
    data: updatedUser
  });
});

// Register as a guide
export const registerAsGuide: UpdateGuideProfileController = catchAsync(async (req: UpdateGuideRequest, res: Response) => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }
  
  // Validate required fields
  const { languages, specialties } = req.body;
  const errors: Record<string, string> = {};
  
  if (!languages || !Array.isArray(languages) || languages.length === 0) {
    errors.languages = 'At least one language is required';
  }
  
  if (!specialties || !Array.isArray(specialties) || specialties.length === 0) {
    errors.specialties = 'At least one specialty is required';
  }
  
  if (Object.keys(errors).length > 0) {
    throw new ValidationError('Validation error', errors);
  }
  
  const guide = await userService.registerAsGuide(req.user.id, req.body);
  
  res.status(201).json({
    status: 'success',
    data: guide
  });
});

// Update guide's active status
export const updateGuideStatus: UpdateGuideProfileController = catchAsync(async (req: UpdateGuideRequest, res: Response) => {
  if (!req.user || !req.user.isGuide) {
    throw new BadRequestError('User is not a guide');
  }
  
  const { isActive } = req.body;
  
  if (typeof isActive !== 'boolean') {
    throw new BadRequestError('isActive must be a boolean value');
  }
  
  // Get guide ID from user ID
  const guideId = await getGuideIdFromUser(req.user.id);
  
  const guide = await userService.updateGuideStatus(guideId, isActive);
  
  res.status(200).json({
    status: 'success',
    data: guide
  });
});

// Update guide's selected programs
export const updateGuidePrograms = catchAsync(async (req: Request, res: Response) => {
  if (!req.user || !req.user.isGuide) {
    throw new BadRequestError('User is not a guide');
  }
  
  const { programIds } = req.body;
  
  if (!programIds || !Array.isArray(programIds)) {
    throw new BadRequestError('programIds must be an array of program IDs');
  }
  
  // Get guide ID from user ID
  const guideId = await getGuideIdFromUser(req.user.id);
  
  const guide = await userService.updateGuidePrograms(guideId, programIds);
  
  res.status(200).json({
    status: 'success',
    data: guide.selectedPrograms
  });
});

// Get guide's selected programs
export const getGuidePrograms = catchAsync(async (req: Request, res: Response) => {
  if (!req.user || !req.user.isGuide) {
    throw new BadRequestError('User is not a guide');
  }
  
  // Get guide ID from user ID
  const guideId = await getGuideIdFromUser(req.user.id);
  
  const programs = await userService.getGuidePrograms(guideId);
  
  res.status(200).json({
    status: 'success',
    data: programs
  });
}); 