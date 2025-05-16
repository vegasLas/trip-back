import { Request, Response } from 'express';
import * as programDayService from '../services/programDayService';
import * as userService from '../services/userService';
import { catchAsync } from '../utils/catchAsync';
import { BadRequestError, ForbiddenError } from '../utils/errors';
import {
  GetProgramDayByIdController,
  CreateProgramDayRequest,
  UpdateProgramDayRequest,
} from '../types';

// Helper function to get guide ID from user ID
const getGuideIdFromUser = async (userId: number): Promise<number> => {
  const user = await userService.getUserProfile(userId);
  if (!user.guide) {
    throw new BadRequestError('User is not a guide');
  }
  return user.guide.id;
};

// Custom interface for program and day ID parameters
interface ProgramDayParams extends Request {
  params: {
    programId: string;
    id: string;
  };
  user?: any;
}

// Get all days for a program
export const getProgramDays = catchAsync(async (req: Request, res: Response) => {
  const programId = parseInt(req.params.programId);
  
  if (isNaN(programId)) {
    throw new BadRequestError('Invalid program ID');
  }
  
  const days = await programDayService.getProgramDays(programId);
  
  res.status(200).json({
    status: 'success',
    results: days.length,
    data: days
  });
});

// Get day details with points
export const getProgramDayById: GetProgramDayByIdController = catchAsync(async (req: ProgramDayParams, res: Response) => {
  const programId = parseInt(req.params.programId);
  const dayId = parseInt(req.params.id);
  
  if (isNaN(programId) || isNaN(dayId)) {
    throw new BadRequestError('Invalid program ID or day ID');
  }
  
  const day = await programDayService.getProgramDayById(programId, dayId);
  
  res.status(200).json({
    status: 'success',
    data: day
  });
});

// Add new day to program
export const createProgramDay = catchAsync(async (req: CreateProgramDayRequest, res: Response) => {
  if (!req.user || !req.user.isGuide) {
    throw new ForbiddenError('Only guides can add days to programs');
  }
  
  const programId = parseInt(req.params.programId);
  
  if (isNaN(programId)) {
    throw new BadRequestError('Invalid program ID');
  }
  
  // Get guide ID from user ID
  const guideId = await getGuideIdFromUser(req.user.id);
  
  const day = await programDayService.createProgramDay(programId, guideId, req.body);
  
  res.status(201).json({
    status: 'success',
    data: day
  });
});

// Update day
export const updateProgramDay = catchAsync(async (req: UpdateProgramDayRequest & ProgramDayParams, res: Response) => {
  if (!req.user || !req.user.isGuide) {
    throw new ForbiddenError('Only guides can update program days');
  }
  
  const programId = parseInt(req.params.programId);
  const dayId = parseInt(req.params.id);
  
  if (isNaN(programId) || isNaN(dayId)) {
    throw new BadRequestError('Invalid program ID or day ID');
  }
  
  // Get guide ID from user ID
  const guideId = await getGuideIdFromUser(req.user.id);
  
  const day = await programDayService.updateProgramDay(programId, dayId, guideId, req.body);
  
  res.status(200).json({
    status: 'success',
    data: day
  });
});

// Delete day
export const deleteProgramDay = catchAsync(async (req: ProgramDayParams, res: Response) => {
  if (!req.user || !req.user.isGuide) {
    throw new ForbiddenError('Only guides can delete program days');
  }
  
  const programId = parseInt(req.params.programId);
  const dayId = parseInt(req.params.id);
  
  if (isNaN(programId) || isNaN(dayId)) {
    throw new BadRequestError('Invalid program ID or day ID');
  }
  
  // Get guide ID from user ID
  const guideId = await getGuideIdFromUser(req.user.id);
  
  await programDayService.deleteProgramDay(programId, dayId, guideId);
  
  res.status(204).send();
}); 