import { Request, Response } from 'express';
import * as programPointService from '../services/programPointService';
import * as userService from '../services/userService';
import { catchAsync } from '../utils/catchAsync';
import { BadRequestError, ForbiddenError } from '../utils/errors';
import {
  CreateProgramPointRequest
} from '../types';

// Helper function to get guide ID from user ID
const getGuideIdFromUser = async (userId: number): Promise<number> => {
  const user = await userService.getUserProfile(userId);
  if (!user.guide) {
    throw new BadRequestError('User is not a guide');
  }
  return user.guide.id;
};

// Custom interface for program, day and point ID parameters
interface ProgramPointParams extends Request {
  params: {
    programId: string;
    dayId: string;
    pointId?: string;
    id?: string;
  };
  user?: any;
}

// Get all points for a day
export const getProgramPoints = catchAsync(async (req: ProgramPointParams, res: Response) => {
  const programId = parseInt(req.params.programId);
  const dayId = parseInt(req.params.dayId);
  
  if (isNaN(programId) || isNaN(dayId)) {
    throw new BadRequestError('Invalid program ID or day ID');
  }
  
  const points = await programPointService.getProgramPoints(programId, dayId);
  
  res.status(200).json({
    status: 'success',
    results: points.length,
    data: points
  });
});

// Add new point to a day
export const createProgramPoint = catchAsync(async (req: CreateProgramPointRequest & ProgramPointParams, res: Response) => {
  if (!req.user || !req.user.isGuide) {
    throw new ForbiddenError('Only guides can add points to program days');
  }
  
  const programId = parseInt(req.params.programId);
  const dayId = parseInt(req.params.dayId);
  
  if (isNaN(programId) || isNaN(dayId)) {
    throw new BadRequestError('Invalid program ID or day ID');
  }
  
  // Get guide ID from user ID
  const guideId = await getGuideIdFromUser(req.user.id);
  
  const point = await programPointService.createProgramPoint(programId, dayId, guideId, req.body);
  
  res.status(201).json({
    status: 'success',
    data: point
  });
});

// Update a point
export const updateProgramPoint = catchAsync(async (req: any, res: Response) => {
  if (!req.user || !req.user.isGuide) {
    throw new ForbiddenError('Only guides can update program points');
  }
  
  const programId = parseInt(req.params.programId);
  const dayId = parseInt(req.params.dayId);
  const pointId = parseInt(req.params.id || req.params.pointId || '');
  
  if (isNaN(programId) || isNaN(dayId) || isNaN(pointId)) {
    throw new BadRequestError('Invalid program ID, day ID, or point ID');
  }
  
  // Get guide ID from user ID
  const guideId = await getGuideIdFromUser(req.user.id);
  
  const point = await programPointService.updateProgramPoint(
    programId, 
    dayId, 
    pointId, 
    guideId, 
    req.body
  );
  
  res.status(200).json({
    status: 'success',
    data: point
  });
});

// Delete a point
export const deleteProgramPoint = catchAsync(async (req: ProgramPointParams, res: Response) => {
  if (!req.user || !req.user.isGuide) {
    throw new ForbiddenError('Only guides can delete program points');
  }
  
  const programId = parseInt(req.params.programId);
  const dayId = parseInt(req.params.dayId);
  const pointId = parseInt(req.params.id || req.params.pointId || '');
  
  if (isNaN(programId) || isNaN(dayId) || isNaN(pointId)) {
    throw new BadRequestError('Invalid program ID, day ID, or point ID');
  }
  
  // Get guide ID from user ID
  const guideId = await getGuideIdFromUser(req.user.id);
  
  await programPointService.deleteProgramPoint(programId, dayId, pointId, guideId);
  
  res.status(204).send();
}); 