import { Request, Response } from 'express';
import * as userService from '../services/userService';
import { catchAsync } from '../utils/catchAsync';
import { BadRequestError, ValidationError } from '../utils/errors';
import { filePathToUrl } from '../middlewares/uploadMiddleware';
import {
  IdParams,
  UpdateUserRequest,
  UpdateGuideRequest,
  ManageGuideImagesRequest
} from '../types';

// Helper function to get guide ID from user ID
const getGuideIdFromUser = async (userId: number): Promise<number> => {
  const user = await userService.getUserProfile(userId);
  if (!user.guide) {
    throw new BadRequestError('User is not a guide');
  }
  return user.guide.id;
};


// Get current user profile
export const getCurrentUser = catchAsync(async (req: Request, res: Response) => {
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
export const getUser = catchAsync(async (req: IdParams, res: Response) => {
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
export const updateUser = catchAsync(async (req: UpdateUserRequest, res: Response) => {
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
export const registerAsGuide = catchAsync(async (req: UpdateGuideRequest, res: Response) => {
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
export const updateGuideStatus = catchAsync(async (req: UpdateGuideRequest, res: Response) => {
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

// Add image to guide profile
export const addGuideImage = catchAsync(async (req: ManageGuideImagesRequest, res: Response) => {
  if (!req.user || !req.user.isGuide) {
    throw new BadRequestError('User is not a guide');
  }
  
  // Check if file was uploaded
  if (!req.file) {
    throw new BadRequestError('No image file provided');
  }
  
  // Convert file path to URL
  const imageUrl = filePathToUrl(req.file.path);
  
  // Get guide ID from user ID
  const guideId = await getGuideIdFromUser(req.user.id);
  
  // Add image to guide profile
  const updatedGuide = await userService.addGuideImage(guideId, imageUrl);
  
  res.status(200).json({
    status: 'success',
    data: updatedGuide
  });
});

// Remove image from guide profile
export const removeGuideImage = catchAsync(async (req: ManageGuideImagesRequest, res: Response) => {
  if (!req.user || !req.user.isGuide) {
    throw new BadRequestError('User is not a guide');
  }
  
  // Get the image index from the request params
  const imageIndex = parseInt(req.params.imageIndex || '0');
  
  if (isNaN(imageIndex)) {
    throw new BadRequestError('Invalid image index');
  }
  
  // Get guide ID from user ID
  const guideId = await getGuideIdFromUser(req.user.id);
  
  // Remove image from guide profile
  const updatedGuide = await userService.removeGuideImage(guideId, imageIndex);
  
  res.status(200).json({
    status: 'success',
    data: updatedGuide
  });
});

// Update order of guide images
export const updateGuideImagesOrder = catchAsync(async (req: ManageGuideImagesRequest, res: Response) => {
  if (!req.user || !req.user.isGuide) {
    throw new BadRequestError('User is not a guide');
  }
  
  // Get new image order from request body
  const { images } = req.body;
  
  if (!images || !Array.isArray(images)) {
    throw new BadRequestError('Images must be an array of image URLs');
  }
  
  // Get guide ID from user ID
  const guideId = await getGuideIdFromUser(req.user.id);
  
  // Update guide images order
  const updatedGuide = await userService.updateGuideImagesOrder(guideId, images);
  
  res.status(200).json({
    status: 'success',
    data: updatedGuide
  });
});

// Get all pending guide approval requests (admin only)
export const getPendingGuideApprovals = catchAsync(async (req: Request, res: Response) => {
  if (!req.user || !req.user.isAdmin) {
    throw new BadRequestError('Only admins can access this resource');
  }
  
  const pendingGuides = await userService.getPendingGuideApprovals();
  
  res.status(200).json({
    status: 'success',
    data: pendingGuides
  });
});

// Approve or reject a guide (admin only)
export const updateGuideApprovalStatus = catchAsync(async (req: Request, res: Response) => {
  if (!req.user || !req.user.isAdmin) {
    throw new BadRequestError('Only admins can approve guides');
  }
  
  const guideId = parseInt(req.params.id);
  const { isApproved } = req.body;
  
  if (isNaN(guideId)) {
    throw new BadRequestError('Invalid guide ID');
  }
  
  if (typeof isApproved !== 'boolean') {
    throw new BadRequestError('isApproved must be a boolean value');
  }
  
  const guide = await userService.updateGuideApprovalStatus(guideId, isApproved);
  
  res.status(200).json({
    status: 'success',
    data: guide
  });
}); 