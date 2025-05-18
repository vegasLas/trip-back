import { Request, Response } from 'express';
import * as userService from '../services/userService';
import * as guideService from '../services/guideService';
import { catchAsync } from '../utils/catchAsync';
import { BadRequestError, ValidationError } from '../utils/errors';
import { filePathToUrl } from '../middlewares/uploadMiddleware';
import {
  IdParams,
  UpdateUserRequest,
  UpdateGuideRequest
} from '../types';

// Helper function to get guide ID from user ID
const getGuideIdFromUser = async (userId: number): Promise<number> => {
  try {
    const guide = await guideService.getGuideByUserId(userId);
    return guide.id;
  } catch (error) {
    throw new BadRequestError('User is not a guide');
  }
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
  const { bio } = req.body;
  const errors: Record<string, string> = {};
  
  
  if (!bio) {
    errors.bio = 'Bio is required';
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
  
  const programs = await guideService.getGuidePrograms(guideId);
  
  res.status(200).json({
    status: 'success',
    data: programs
  });
});

// Consolidated endpoint to update all guide profile information
export const updateGuideProfile = catchAsync(async (req: Request, res: Response) => {
  if (!req.user || !req.user.isGuide) {
    throw new BadRequestError('User is not a guide');
  }
  
  // Get guide ID from user ID
  const guideId = await getGuideIdFromUser(req.user.id);
  
  // Extract update data from request body
  const { 
    bio, 
    specialties, 
    phoneNumber, 
    email, 
    isActive, 
    programIds,
    firstName,
    lastName,
    username,
    existingImages
  } = req.body;
  
  // Handle file uploads (newImages)
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  let newImages: string[] = [];
  
  // Check if we have uploaded files
  if (files && files.newImages) {
    // Convert file paths to URLs
    newImages = files.newImages.map(file => filePathToUrl(file.path));
  }
  
  // Call consolidated service function
  const result = await guideService.updateGuide(
    guideId, 
    req.user.id, 
    {
      bio,
      phoneNumber,
      email,
      isActive,
      programIds,
      firstName,
      lastName,
      username,
      newImages,
      existingImages: existingImages ? JSON.parse(existingImages) : undefined
    }
  );
  
  res.status(200).json({
    status: 'success',
    data: result.guide,
    pendingChanges: result.pendingChanges,
    message: result.pendingChangeMessage || 'Guide profile updated successfully'
  });
});

// Get all pending guide approval requests (admin only)
export const getPendingGuideApprovals = catchAsync(async (req: Request, res: Response) => {
  if (!req.user || !req.user.isAdmin) {
    throw new BadRequestError('Only admins can access this resource');
  }
  
  const pendingGuides = await guideService.getPendingGuideApprovals();
  
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
  
  const guide = await guideService.updateGuideApprovalStatus(guideId, isApproved);
  
  res.status(200).json({
    status: 'success',
    data: guide
  });
});

// Get all pending guide profile change requests (admin only)
export const getPendingGuideProfileChangeRequests = catchAsync(async (req: Request, res: Response) => {
  if (!req.user || !req.user.isAdmin) {
    throw new BadRequestError('Only admins can access this resource');
  }
  
  const requests = await guideService.getPendingGuideProfileChangeRequests();
  
  res.status(200).json({
    status: 'success',
    data: requests
  });
});

// Process a guide profile change request (admin only)
export const processGuideProfileChangeRequest = catchAsync(async (req: Request, res: Response) => {
  if (!req.user || !req.user.isAdmin) {
    throw new BadRequestError('Only admins can process change requests');
  }
  
  const requestId = parseInt(req.params.id);
  const { approve, adminComment } = req.body;
  
  if (isNaN(requestId)) {
    throw new BadRequestError('Invalid request ID');
  }
  
  if (typeof approve !== 'boolean') {
    throw new BadRequestError('approve must be a boolean value');
  }
  
  const result = await guideService.processGuideProfileChangeRequest(requestId, approve, adminComment);
  
  res.status(200).json({
    status: 'success',
    data: result
  });
}); 