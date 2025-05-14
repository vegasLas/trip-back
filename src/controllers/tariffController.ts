import { Request, Response } from 'express';
import * as tariffService from '../services/tariffService';
import { catchAsync } from '../utils/catchAsync';
import { BadRequestError, ForbiddenError } from '../utils/errors';

// Get pricing tiers for a program
export const getProgramTariffs = catchAsync(async (req: Request, res: Response) => {
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
export const createProgramTariff = catchAsync(async (req: Request, res: Response) => {
  if (!req.user || !req.user.isGuide) {
    throw new ForbiddenError('Only guides can create pricing tiers');
  }
  
  const programId = parseInt(req.params.programId);
  
  if (isNaN(programId)) {
    throw new BadRequestError('Invalid program ID');
  }
  
  // TODO: Get guide ID from user ID
  const guideId = 1; // This is a placeholder
  
  const tariff = await tariffService.createProgramTariff(programId, guideId, req.body);
  
  res.status(201).json({
    status: 'success',
    data: tariff
  });
});

// Update a pricing tier
export const updateProgramTariff = catchAsync(async (req: Request, res: Response) => {
  if (!req.user || !req.user.isGuide) {
    throw new ForbiddenError('Only guides can update pricing tiers');
  }
  
  const tariffId = parseInt(req.params.id);
  
  if (isNaN(tariffId)) {
    throw new BadRequestError('Invalid tariff ID');
  }
  
  // TODO: Get guide ID from user ID
  const guideId = 1; // This is a placeholder
  
  const tariff = await tariffService.updateProgramTariff(tariffId, guideId, req.body);
  
  res.status(200).json({
    status: 'success',
    data: tariff
  });
});

// Delete a pricing tier
export const deleteProgramTariff = catchAsync(async (req: Request, res: Response) => {
  if (!req.user || !req.user.isGuide) {
    throw new ForbiddenError('Only guides can delete pricing tiers');
  }
  
  const tariffId = parseInt(req.params.id);
  
  if (isNaN(tariffId)) {
    throw new BadRequestError('Invalid tariff ID');
  }
  
  // TODO: Get guide ID from user ID
  const guideId = 1; // This is a placeholder
  
  await tariffService.deleteProgramTariff(tariffId, guideId);
  
  res.status(204).send();
});

// Toggle tariff active status
export const toggleTariffStatus = catchAsync(async (req: Request, res: Response) => {
  if (!req.user || !req.user.isGuide) {
    throw new ForbiddenError('Only guides can update pricing tiers');
  }
  
  const tariffId = parseInt(req.params.id);
  
  if (isNaN(tariffId)) {
    throw new BadRequestError('Invalid tariff ID');
  }
  
  // TODO: Get guide ID from user ID
  const guideId = 1; // This is a placeholder
  
  const tariff = await tariffService.toggleTariffStatus(tariffId, guideId);
  
  res.status(200).json({
    status: 'success',
    data: tariff
  });
}); 