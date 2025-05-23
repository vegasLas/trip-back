import { Request, Response } from 'express';
import * as bidService from '../services/bidService';
import * as userService from '../services/userService';
import { catchAsync } from '../utils/catchAsync';
import { BadRequestError, ForbiddenError } from '../utils/errors';
import {
  CreateBidRequest,
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

// Helper function to get tourist ID from user ID
const getTouristIdFromUser = async (userId: number): Promise<number> => {
  const user = await userService.getUserProfile(userId);
  if (!user.tourist) {
    throw new BadRequestError('User is not a tourist');
  }
  return user.tourist.id;
};

// Custom interface for auction ID parameters
interface AuctionParams extends Request {
  params: {
    auctionId: string;
  };
  user?: any;
}

// Get all bids for an auction
export const getAuctionBids = catchAsync(async (req: AuctionParams, res: Response) => {
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

// Get all bids made by a guide
export const getTouristBids = catchAsync(async (req: Request, res: Response) => {
  if (!req.user || !req.user.isTourist) {
    throw new ForbiddenError('Unauthorized access');
  }
  
  // Get tourist ID from user ID
  const touristId = await getTouristIdFromUser(req.user.id);
  
  // Get all auctions created by this tourist
  const touristAuctions = await bidService.getHighestBidsForTouristAuctions(touristId);
  
  res.status(200).json({
    status: 'success',
    results: touristAuctions.length,
    data: touristAuctions
  });
});

// Create a new bid
export const createBid = catchAsync(async (req: CreateBidRequest, res: Response) => {
  if (!req.user || !req.user.isGuide) {
    throw new ForbiddenError('Only guides can place bids');
  }
  
  // Get guide ID from user ID
  const guideId = await getGuideIdFromUser(req.user.id);
  
  const bid = await bidService.createBid(guideId, req.body);
  
  res.status(201).json({
    status: 'success',
    data: bid
  });
});

// Cancel a bid
export const cancelBid = catchAsync(async (req: IdParams, res: Response) => {
  if (!req.user || !req.user.isGuide) {
    throw new ForbiddenError('Only guides can cancel their bids');
  }
  
  const bidId = parseInt(req.params.id);
  
  if (isNaN(bidId)) {
    throw new BadRequestError('Invalid bid ID');
  }
  
  // Get guide ID from user ID
  const guideId = await getGuideIdFromUser(req.user.id);
  
  await bidService.cancelBid(bidId, guideId);
  
  res.status(204).send();
});

// Get bids for a guide's auction (only if the guide has placed a bid on it)
export const getGuideAuctionBids = catchAsync(async (req: AuctionParams, res: Response) => {
  if (!req.user || !req.user.isGuide) {
    throw new ForbiddenError('Unauthorized access');
  }
  
  const auctionId = parseInt(req.params.auctionId);
  
  if (isNaN(auctionId)) {
    throw new BadRequestError('Invalid auction ID');
  }
  
  // Get the guide's ID from user
  const guideId = await getGuideIdFromUser(req.user.id);
  
  // Check if the guide has a bid on this auction
  const guideBids = await bidService.getGuideBids(guideId);
  const hasBidOnAuction = guideBids.some(bid => bid.auctionId === auctionId);
  
  if (!hasBidOnAuction) {
    throw new ForbiddenError('You can only view bids for auctions you have bid on');
  }
  
  const bids = await bidService.getAuctionBids(auctionId);
  
  res.status(200).json({
    status: 'success',
    results: bids.length,
    data: bids
  });
});

// Get highest bids for all of tourist's auctions
export const getHighestBidsForGuideAuctions = catchAsync(async (req: Request, res: Response) => {
  if (!req.user || !req.user.isTourist) {
    throw new ForbiddenError('Unauthorized access');
  }
  
  const touristId = await getTouristIdFromUser(req.user.id);
  
  const highestBids = await bidService.getHighestBidsForTouristAuctions(touristId);
  
  res.status(200).json({
    status: 'success',
    results: highestBids.length,
    data: highestBids
  });
}); 