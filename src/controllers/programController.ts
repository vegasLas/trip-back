import { Request, Response } from 'express';
import * as programService from '../services/programService';
import * as userService from '../services/userService';
import { catchAsync } from '../utils/catchAsync';
import { BadRequestError, ForbiddenError } from '../utils/errors';
import {
  IdParams,
  ProgramFilterRequest,
  CreateProgramRequest,
  UpdateProgramRequest
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

// Get all programs with filtering
export const getAllPrograms = catchAsync(async (req: ProgramFilterRequest, res: Response) => {
  const filters = req.query;
  const programs = await programService.getAllPrograms(filters);
  
  res.status(200).json({
    status: 'success',
    results: programs.length,
    data: programs
  });
});

// Get program by ID
export const getProgramById = catchAsync(async (req: IdParams, res: Response) => {
  const programId = parseInt(req.params.id);
  
  if (isNaN(programId)) {
    throw new BadRequestError('Invalid program ID');
  }
  
  const program = await programService.getProgramById(programId);
  
  res.status(200).json({
    status: 'success',
    data: program
  });
});

// Get program guides
export const getProgramGuides = catchAsync(async (req: Request, res: Response) => {
  const programId = parseInt(req.params.id);
  
  if (isNaN(programId)) {
    throw new BadRequestError('Invalid program ID');
  }
  
  const guides = await programService.getProgramGuides(programId);
  
  res.status(200).json({
    status: 'success',
    results: guides.length,
    data: guides
  });
});

// Create new program
export const createProgram = catchAsync(async (req: CreateProgramRequest, res: Response) => {
  if (!req.user || !req.user.isGuide) {
    throw new ForbiddenError('Only guides can create programs');
  }
  
  // Get guide ID from user ID
  const guideId = await getGuideIdFromUser(req.user.id);
  
  const program = await programService.createProgram(guideId, req.body);
  
  res.status(201).json({
    status: 'success',
    data: program
  });
});

// Update program
export const updateProgram = catchAsync(async (req: UpdateProgramRequest, res: Response) => {
  if (!req.user || !req.user.isGuide) {
    throw new ForbiddenError('Only guides can update programs');
  }
  
  const programId = parseInt(req.params.id);
  
  if (isNaN(programId)) {
    throw new BadRequestError('Invalid program ID');
  }
  
  // Get guide ID from user ID
  const guideId = await getGuideIdFromUser(req.user.id);
  
  const program = await programService.updateProgram(programId, guideId, req.body);
  
  res.status(200).json({
    status: 'success',
    data: program
  });
});

// Delete program
export const deleteProgram = catchAsync(async (req: IdParams, res: Response) => {
  if (!req.user || !req.user.isGuide) {
    throw new ForbiddenError('Only guides can delete programs');
  }
  
  const programId = parseInt(req.params.id);
  
  if (isNaN(programId)) {
    throw new BadRequestError('Invalid program ID');
  }
  
  // Get guide ID from user ID
  const guideId = await getGuideIdFromUser(req.user.id);
  
  await programService.deleteProgram(programId, guideId);
  
  res.status(204).send();
});

// Request guide availability
export const requestDirectBooking = catchAsync(async (req: Request, res: Response) => {
  if (!req.user || !req.user.isTourist) {
    throw new ForbiddenError('Only tourists can request direct bookings');
  }
  
  const programId = parseInt(req.params.id);
  
  if (isNaN(programId)) {
    throw new BadRequestError('Invalid program ID');
  }
  
  // Get tourist ID from user ID
  const touristId = await getTouristIdFromUser(req.user.id);
  
  const request = await programService.createDirectRequest(programId, touristId, req.body);
  
  res.status(201).json({
    status: 'success',
    data: request
  });
});

// Respond to availability request
export const respondToDirectRequest = catchAsync(async (req: Request, res: Response) => {
  if (!req.user || !req.user.isGuide) {
    throw new ForbiddenError('Only guides can respond to direct requests');
  }
  
  const programId = parseInt(req.params.id);
  const requestId = parseInt(req.params.requestId);
  
  if (isNaN(programId) || isNaN(requestId)) {
    throw new BadRequestError('Invalid program ID or request ID');
  }
  
  // Get guide ID from user ID
  const guideId = await getGuideIdFromUser(req.user.id);
  
  const response = await programService.respondToDirectRequest(requestId, guideId, req.body);
  
  res.status(200).json({
    status: 'success',
    data: response
  });
});

// Recommend a program
export const recommendProgram = catchAsync(async (req: Request, res: Response) => {
  if (!req.user || !req.user.isGuide) {
    throw new ForbiddenError('Only guides can recommend programs');
  }
  
  const programId = parseInt(req.params.id);
  
  if (isNaN(programId)) {
    throw new BadRequestError('Invalid program ID');
  }
  
  // Get guide ID from user ID
  const guideId = await getGuideIdFromUser(req.user.id);
  
  const recommendation = await programService.recommendProgram(programId, guideId, req.body);
  
  res.status(201).json({
    status: 'success',
    data: recommendation
  });
});

// Get all program recommendations
export const getAllProgramRecommendations = catchAsync(async (req: Request, res: Response) => {
  if (!req.user || !req.user.isAdmin) {
    throw new ForbiddenError('Only admins can see all program recommendations');
  }
  
  const recommendations = await programService.getAllProgramRecommendations();
  
  res.status(200).json({
    status: 'success',
    results: recommendations.length,
    data: recommendations
  });
});

// Approve program recommendation
export const approveRecommendation = catchAsync(async (req: Request, res: Response) => {
  if (!req.user || !req.user.isAdmin) {
    throw new ForbiddenError('Only admins can approve program recommendations');
  }
  
  const recommendationId = parseInt(req.params.id);
  
  if (isNaN(recommendationId)) {
    throw new BadRequestError('Invalid recommendation ID');
  }
  
  const recommendation = await programService.updateRecommendationStatus(
    recommendationId, 
    'APPROVED', 
    req.body.adminComment
  );
  
  res.status(200).json({
    status: 'success',
    data: recommendation
  });
});

// Reject program recommendation
export const rejectRecommendation = catchAsync(async (req: Request, res: Response) => {
  if (!req.user || !req.user.isAdmin) {
    throw new ForbiddenError('Only admins can reject program recommendations');
  }
  
  const recommendationId = parseInt(req.params.id);
  
  if (isNaN(recommendationId)) {
    throw new BadRequestError('Invalid recommendation ID');
  }
  
  const recommendation = await programService.updateRecommendationStatus(
    recommendationId, 
    'REJECTED', 
    req.body.adminComment
  );
  
  res.status(200).json({
    status: 'success',
    data: recommendation
  });
}); 