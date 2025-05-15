import { Request, Response } from 'express';
import * as tariffService from '../services/tariffService';
import * as userService from '../services/userService';
import { catchAsync } from '../utils/catchAsync';
import { BadRequestError, ForbiddenError } from '../utils/errors';
import {
  GetTariffsController,
  CreateTariffController,
  UpdateTariffController,
  DeleteTariffController,
  CreateTariffRequest,
  UpdateTariffRequest,
  IdParams
} from '../types';

// Helper function to get guide ID from user ID
const getGuideIdFromUser = async (userId: number): Promise<number> => {
  const user = await userService.getUserProfile(userId);
  if (!user.guide) {
    throw new BadRequestError('User is not a guide');
  }
  return user.guide.id;
};

// Custom interface for program ID parameters
interface ProgramParams extends Request {
  params: {
    programId: string;
  };
  user?: any;
}

// Get pricing tiers for a program
export const getProgramTariffs: GetTariffsController = catchAsync(async (req: ProgramParams, res: Response) => {
  const programId = parseInt(req.params.programId);
  
  if (isNaN(programId)) {
    throw new BadRequestError('Invalid program ID');
  }
  
  const tariffs = await tariffService.getProgramTariffs(programId);
  
  res.status(200).json({
    status: 'success',
    results: tariffs.length,
    data: tariffs
  });
});

// Create new pricing tier for a program
export const createProgramTariff: CreateTariffController = catchAsync(async (req: CreateTariffRequest & ProgramParams, res: Response) => {
  if (!req.user || !req.user.isGuide) {
    throw new ForbiddenError('Only guides can create pricing tiers');
  }
  
  const programId = parseInt(req.params.programId);
  
  if (isNaN(programId)) {
    throw new BadRequestError('Invalid program ID');
  }
  
  // Get guide ID from user ID
  const guideId = await getGuideIdFromUser(req.user.id);
  
  const tariff = await tariffService.createProgramTariff(programId, guideId, req.body);
  
  res.status(201).json({
    status: 'success',
    data: tariff
  });
});

// Update a pricing tier
export const updateProgramTariff: UpdateTariffController = catchAsync(async (req: UpdateTariffRequest, res: Response) => {
  if (!req.user || !req.user.isGuide) {
    throw new ForbiddenError('Only guides can update pricing tiers');
  }
  
  const tariffId = parseInt(req.params.id);
  
  if (isNaN(tariffId)) {
    throw new BadRequestError('Invalid tariff ID');
  }
  
  // Get guide ID from user ID
  const guideId = await getGuideIdFromUser(req.user.id);
  
  const tariff = await tariffService.updateProgramTariff(tariffId, guideId, req.body);
  
  res.status(200).json({
    status: 'success',
    data: tariff
  });
});

// Delete a pricing tier
export const deleteProgramTariff: DeleteTariffController = catchAsync(async (req: IdParams, res: Response) => {
  if (!req.user || !req.user.isGuide) {
    throw new ForbiddenError('Only guides can delete pricing tiers');
  }
  
  const tariffId = parseInt(req.params.id);
  
  if (isNaN(tariffId)) {
    throw new BadRequestError('Invalid tariff ID');
  }
  
  // Get guide ID from user ID
  const guideId = await getGuideIdFromUser(req.user.id);
  
  await tariffService.deleteProgramTariff(tariffId, guideId);
  
  res.status(204).send();
});

// Toggle tariff active status
export const toggleTariffStatus: UpdateTariffController = catchAsync(async (req: UpdateTariffRequest, res: Response) => {
  if (!req.user || !req.user.isGuide) {
    throw new ForbiddenError('Only guides can update pricing tiers');
  }
  
  const tariffId = parseInt(req.params.id);
  
  if (isNaN(tariffId)) {
    throw new BadRequestError('Invalid tariff ID');
  }
  
  // Get guide ID from user ID
  const guideId = await getGuideIdFromUser(req.user.id);
  
  const tariff = await tariffService.toggleTariffStatus(tariffId, guideId);
  
  res.status(200).json({
    status: 'success',
    data: tariff
  });
}); 