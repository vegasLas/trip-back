import { Request, Response } from 'express';
import * as auctionService from '../services/auctionService';
import * as userService from '../services/userService';
import { catchAsync } from '../utils/catchAsync';
import { BadRequestError, ForbiddenError } from '../utils/errors';
import {
  IdParams,
  CreateAuctionRequest,
  UpdateAuctionRequest,
  PlaceBidRequest
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

// Get active/ongoing auctions
export const getActiveAuctions = catchAsync(async (_: Request, res: Response) => {
  const auctions = await auctionService.getActiveAuctions();
  
  res.status(200).json({
    status: 'success',
    results: auctions.length,
    data: auctions
  });
});

// Get auction by ID
export const getAuctionById = catchAsync(async (req: IdParams, res: Response) => {
  const auctionId = parseInt(req.params.id);
  
  if (isNaN(auctionId)) {
    throw new BadRequestError('Invalid auction ID');
  }
  
  const auction = await auctionService.getAuctionById(auctionId);
  
  res.status(200).json({
    status: 'success',
    data: auction
  });
});

// Create new auction (guide only)
export const createAuction = catchAsync(async (req: CreateAuctionRequest, res: Response) => {
  if (!req.user || !req.user.isGuide) {
    throw new ForbiddenError('Only guides can create auctions');
  }
  
  // Get guide ID from user ID
  const guideId = await getGuideIdFromUser(req.user.id);
  
  const auction = await auctionService.createAuction(guideId, req.body);
  
  res.status(201).json({
    status: 'success',
    data: auction
  });
});

// Update auction
export const updateAuction = catchAsync(async (req: UpdateAuctionRequest, res: Response) => {
  if (!req.user || !req.user.isGuide) {
    throw new ForbiddenError('Only guides can update auctions');
  }
  
  const auctionId = parseInt(req.params.id);
  
  if (isNaN(auctionId)) {
    throw new BadRequestError('Invalid auction ID');
  }
  
  // Get guide ID from user ID
  const guideId = await getGuideIdFromUser(req.user.id);
  
  const auction = await auctionService.updateAuction(auctionId, guideId, req.body);
  
  res.status(200).json({
    status: 'success',
    data: auction
  });
});

// Delete auction
export const deleteAuction = catchAsync(async (req: IdParams, res: Response) => {
  if (!req.user || !req.user.isGuide) {
    throw new ForbiddenError('Only guides can delete auctions');
  }
  
  const auctionId = parseInt(req.params.id);
  
  if (isNaN(auctionId)) {
    throw new BadRequestError('Invalid auction ID');
  }
  
  // Get guide ID from user ID
  const guideId = await getGuideIdFromUser(req.user.id);
  
  await auctionService.deleteAuction(auctionId, guideId);
  
  res.status(204).send();
});

// End auction early
export const endAuction = catchAsync(async (req: IdParams, res: Response) => {
  if (!req.user || !req.user.isGuide) {
    throw new ForbiddenError('Only guides can end auctions');
  }
  
  const auctionId = parseInt(req.params.id);
  
  if (isNaN(auctionId)) {
    throw new BadRequestError('Invalid auction ID');
  }
  
  // Get guide ID from user ID
  const guideId = await getGuideIdFromUser(req.user.id);
  
  const auction = await auctionService.closeAuction(auctionId, guideId);
  
  res.status(200).json({
    status: 'success',
    data: auction
  });
});

// Place bid on auction
export const placeBid = catchAsync(async (req: PlaceBidRequest, res: Response) => {
  if (!req.user || !req.user.isTourist) {
    throw new ForbiddenError('Only tourists can place bids');
  }
  
  const auctionId = parseInt(req.params.id);
  
  if (isNaN(auctionId)) {
    throw new BadRequestError('Invalid auction ID');
  }
  
  // Get tourist ID from user ID
  const touristId = await getTouristIdFromUser(req.user.id);
  
  const bid = await auctionService.placeBid(auctionId, touristId, req.body);
  
  res.status(201).json({
    status: 'success',
    data: bid
  });
});

// Get auctions a tourist has bid on
export const getTouristBiddedAuctions = catchAsync(async (req: Request, res: Response) => {
  if (!req.user || !req.user.isTourist) {
    throw new ForbiddenError('Unauthorized access');
  }
  
  // Get tourist ID from user ID
  const touristId = await getTouristIdFromUser(req.user.id);
  
  const auctions = await auctionService.getTouristBiddedAuctions(touristId);
  
  res.status(200).json({
    status: 'success',
    results: auctions.length,
    data: auctions
  });
});

// Get guide's own auctions
export const getGuideAuctions = catchAsync(async (req: Request, res: Response) => {
  if (!req.user || !req.user.isGuide) {
    throw new ForbiddenError('Unauthorized access');
  }
  
  // Get guide ID from user ID
  const guideId = await getGuideIdFromUser(req.user.id);
  
  const auctions = await auctionService.getGuideAuctions(guideId);
  
  res.status(200).json({
    status: 'success',
    results: auctions.length,
    data: auctions
  });
}); 