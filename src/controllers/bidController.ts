import { Request, Response } from 'express';
import * as bidService from '../services/bidService';
import { catchAsync } from '../utils/catchAsync';
import { BadRequestError, ForbiddenError } from '../utils/errors';

// Get all bids for an auction
export const getAuctionBids = catchAsync(async (req: Request, res: Response) => {
  const auctionId = parseInt(req.params.auctionId);
  
  if (isNaN(auctionId)) {
    throw new BadRequestError('Invalid auction ID');
  }
  
  const bids = await bidService.getAuctionBids(auctionId);
  
  res.status(200).json({
    status: 'success',
    results: bids.length,
    data: bids
  });
});

// Get all bids made by a tourist
export const getTouristBids = catchAsync(async (req: Request, res: Response) => {
  if (!req.user || !req.user.isTourist) {
    throw new ForbiddenError('Unauthorized access');
  }
  
  // TODO: Get tourist ID from user ID
  const touristId = 1; // This is a placeholder
  
  const bids = await bidService.getGuideBids(touristId);
  
  res.status(200).json({
    status: 'success',
    results: bids.length,
    data: bids
  });
});

// Create a new bid
export const createBid = catchAsync(async (req: Request, res: Response) => {
  if (!req.user || !req.user.isTourist) {
    throw new ForbiddenError('Only tourists can place bids');
  }
  
  // TODO: Get tourist ID from user ID
  const touristId = 1; // This is a placeholder
  
  const bid = await bidService.createBid(touristId, req.body);
  
  res.status(201).json({
    status: 'success',
    data: bid
  });
});

// Cancel a bid
export const cancelBid = catchAsync(async (req: Request, res: Response) => {
  if (!req.user || !req.user.isTourist) {
    throw new ForbiddenError('Only tourists can cancel their bids');
  }
  
  const bidId = parseInt(req.params.id);
  
  if (isNaN(bidId)) {
    throw new BadRequestError('Invalid bid ID');
  }
  
  // TODO: Get tourist ID from user ID
  const touristId = 1; // This is a placeholder
  
  await bidService.cancelBid(bidId, touristId);
  
  res.status(204).send();
});

// Get bids for a guide's auction
export const getGuideAuctionBids = catchAsync(async (req: Request, res: Response) => {
  if (!req.user || !req.user.isGuide) {
    throw new ForbiddenError('Unauthorized access');
  }
  
  const auctionId = parseInt(req.params.auctionId);
  
  if (isNaN(auctionId)) {
    throw new BadRequestError('Invalid auction ID');
  }
  
  // TODO: Get guide ID from user ID
  const guideId = 1; // This is a placeholder
  
  const bids = await bidService.getAuctionBids(auctionId);
  
  res.status(200).json({
    status: 'success',
    results: bids.length,
    data: bids
  });
});

// Get highest bids for all of guide's auctions
export const getHighestBidsForGuideAuctions = catchAsync(async (req: Request, res: Response) => {
  if (!req.user || !req.user.isGuide) {
    throw new ForbiddenError('Unauthorized access');
  }
  const touristId = req.body.touristId;
  
  const highestBids = await bidService.getHighestBidsForTouristAuctions(touristId);
  
  res.status(200).json({
    status: 'success',
    results: highestBids.length,
    data: highestBids
  });
}); 