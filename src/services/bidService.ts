import prisma from './prismaService';
import { NotFoundError, BadRequestError } from '../utils/errors';

export const getAuctionBids = async (auctionId: number) => {
  // Check if auction exists
  const auction = await prisma.auction.findUnique({
    where: { id: auctionId },
    select: { id: true }
  });
  
  if (!auction) {
    throw new NotFoundError('Auction not found');
  }
  
  // Get all bids for the auction, ordered by price descending
  const bids = await prisma.bid.findMany({
    where: { auctionId },
    include: {
      guide: {
        include: {
          baseUser: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      }
    },
    orderBy: {
      price: 'desc'
    }
  });
  
  return bids;
};

export const getGuideBids = async (guideId: number) => {
  // Get all bids made by the guide
  const bids = await prisma.bid.findMany({
    where: { guideId },
    include: {
      auction: true
    },
    orderBy: [
      {
        createdAt: 'desc'
      }
    ]
  });
  
  return bids;
};

export const createBid = async (guideId: number, bidData: any) => {
  // Validate required fields
  const { auctionId, price, description } = bidData;
  
  if (!auctionId || !price || !description) {
    throw new BadRequestError('Auction ID, price, and description are required');
  }
  
  // Check if auction exists and is active
  const auction = await prisma.auction.findFirst({
    where: { 
      id: parseInt(auctionId),
      status: 'OPEN',
      expiresAt: {
        gt: new Date()
      }
    }
  });
  
  if (!auction) {
    throw new NotFoundError('Active auction not found');
  }
  
  // Check if guide already has a bid on this auction
  const existingBid = await prisma.bid.findFirst({
    where: {
      auctionId: parseInt(auctionId),
      guideId
    }
  });
  
  if (existingBid) {
    throw new BadRequestError('You already have a bid on this auction. Please update your existing bid.');
  }
  
  // Create the bid
  const bid = await prisma.bid.create({
    data: {
      auctionId: parseInt(auctionId),
      guideId,
      price: parseFloat(price),
      description
    },
    include: {
      auction: true,
      guide: {
        include: {
          baseUser: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      }
    }
  });
  
  return bid;
};

export const cancelBid = async (bidId: number, guideId: number) => {
  // Check if bid exists and belongs to the guide
  const bid = await prisma.bid.findFirst({
    where: { 
      id: bidId,
      guideId
    },
    include: {
      auction: true
    }
  });
  
  if (!bid) {
    throw new NotFoundError('Bid not found or you are not authorized to cancel it');
  }
  
  // Check if the auction is still active
  if (bid.auction.status !== 'OPEN') {
    throw new BadRequestError('Cannot cancel bid on a closed auction');
  }
  
  // Check if this is the highest bid
  const isHighestBid = await prisma.bid.findFirst({
    where: {
      auctionId: bid.auctionId,
      price: { gt: bid.price }
    }
  });
  
  // If this is the highest bid, we might need additional logic here
  // but that depends on your business requirements
  
  // Delete the bid
  await prisma.bid.delete({
    where: { id: bidId }
  });
  
  return { success: true };
};

export const getTouristAuctionBids = async (auctionId: number, touristId: number) => {
  // Check if auction exists and belongs to the tourist
  const auction = await prisma.auction.findFirst({
    where: { 
      id: auctionId,
      touristId
    }
  });
  
  if (!auction) {
    throw new NotFoundError('Auction not found or you are not authorized to view its bids');
  }
  
  // Get all bids for the auction
  const bids = await prisma.bid.findMany({
    where: { auctionId },
    include: {
      guide: {
        include: {
          baseUser: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      }
    },
    orderBy: [
      {
        price: 'desc'
      },
      {
        createdAt: 'asc'
      }
    ]
  });
  
  return bids;
};

export const getHighestBidsForTouristAuctions = async (touristId: number) => {
  // Get all active auctions for the tourist
  const auctions = await prisma.auction.findMany({
    where: { 
      touristId,
      status: 'OPEN'
    },
    select: {
      id: true,
      title: true,
      description: true,
      expiresAt: true
    }
  });
  
  const auctionIds = auctions.map(auction => auction.id);
  
  // Get the highest bid for each auction
  const highestBids = await Promise.all(
    auctionIds.map(async (auctionId) => {
      const auction = auctions.find(a => a.id === auctionId);
      
      const highestBid = await prisma.bid.findFirst({
        where: { auctionId },
        orderBy: {
          price: 'desc'
        },
        include: {
          guide: {
            include: {
              baseUser: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        }
      });
      
      return {
        auction,
        highestBid,
        hasBids: !!highestBid,
        bidCount: await prisma.bid.count({
          where: { auctionId }
        })
      };
    })
  );
  
  return highestBids;
}; 