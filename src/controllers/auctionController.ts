import { Request, Response } from 'express';
import * as auctionService from '../services/auctionService';
import { catchAsync } from '../utils/catchAsync';
import { BadRequestError, ForbiddenError } from '../utils/errors';

// Get active/ongoing auctions
export const getActiveAuctions = catchAsync(async (req: Request, res: Response) => {
  const auctions = await auctionService.getActiveAuctions();
  
  res.status(200).json({
    status: 'success',
    results: auctions.length,
    data: auctions
  });
});

// Get auction by ID
export const getAuctionById = catchAsync(async (req: Request, res: Response) => {
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
export const createAuction = catchAsync(async (req: Request, res: Response) => {
  if (!req.user || !req.user.isGuide) {
    throw new ForbiddenError('Only guides can create auctions');
  }
  
  // TODO: Get guide ID from user ID
  const guideId = 1; // This is a placeholder
  
  const auction = await auctionService.createAuction(guideId, req.body);
  
  res.status(201).json({
    status: 'success',
    data: auction
  });
});

// Update auction
export const updateAuction = catchAsync(async (req: Request, res: Response) => {
  if (!req.user || !req.user.isGuide) {
    throw new ForbiddenError('Only guides can update auctions');
  }
  
  const auctionId = parseInt(req.params.id);
  
  if (isNaN(auctionId)) {
    throw new BadRequestError('Invalid auction ID');
  }
  
  // TODO: Get guide ID from user ID
  const guideId = 1; // This is a placeholder
  
  const auction = await auctionService.updateAuction(auctionId, guideId, req.body);
  
  res.status(200).json({
    status: 'success',
    data: auction
  });
});

// Delete auction
export const deleteAuction = catchAsync(async (req: Request, res: Response) => {
  if (!req.user || !req.user.isGuide) {
    throw new ForbiddenError('Only guides can delete auctions');
  }
  
  const auctionId = parseInt(req.params.id);
  
  if (isNaN(auctionId)) {
    throw new BadRequestError('Invalid auction ID');
  }
  
  // TODO: Get guide ID from user ID
  const guideId = 1; // This is a placeholder
  
  await auctionService.deleteAuction(auctionId, guideId);
  
  res.status(204).send();
});

// End auction early
export const endAuction = catchAsync(async (req: Request, res: Response) => {
  if (!req.user || !req.user.isGuide) {
    throw new ForbiddenError('Only guides can end auctions');
  }
  
  const auctionId = parseInt(req.params.id);
  
  if (isNaN(auctionId)) {
    throw new BadRequestError('Invalid auction ID');
  }
  
  // TODO: Get guide ID from user ID
  const guideId = 1; // This is a placeholder
  
  const auction = await auctionService.closeAuction(auctionId, guideId);
  
  res.status(200).json({
    status: 'success',
    data: auction
  });
});

// Place bid on auction
export const placeBid = catchAsync(async (req: Request, res: Response) => {
  if (!req.user || !req.user.isTourist) {
    throw new ForbiddenError('Only tourists can place bids');
  }
  
  const auctionId = parseInt(req.params.id);
  
  if (isNaN(auctionId)) {
    throw new BadRequestError('Invalid auction ID');
  }
  
  // TODO: Get tourist ID from user ID
  const touristId = 1; // This is a placeholder
  
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
  
  // TODO: Get tourist ID from user ID
  const touristId = 1; // This is a placeholder
  
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
  
  // TODO: Get guide ID from user ID
  const guideId = 1; // This is a placeholder
  
  const auctions = await auctionService.getGuideAuctions(guideId);
  
  res.status(200).json({
    status: 'success',
    results: auctions.length,
    data: auctions
  });
}); 