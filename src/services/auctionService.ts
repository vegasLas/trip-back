import prisma from './prismaService';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors';

export const getActiveAuctions = async () => {
  // Get all active auctions that haven't ended yet
  const now = new Date();
  
  const auctions = await prisma.auction.findMany({
    where: {
      status: 'OPEN',
      expiresAt: {
        gt: now
      }
    },
    include: {
      tourist: {
        include: {
          baseUser: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      },
      program: {
        select: {
          id: true,
          title: true,
          images: true,
          basePrice: true
        }
      },
      bids: true,
      _count: {
        select: { bids: true }
      }
    },
    orderBy: {
      expiresAt: 'asc'
    }
  });
  
  return auctions;
};

export const getAuctionById = async (auctionId: number) => {
  // Get the auction with its bids
  const auction = await prisma.auction.findUnique({
    where: { id: auctionId },
    include: {
      tourist: {
        include: {
          baseUser: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      },
      program: {
        select: {
          id: true,
          title: true,
          description: true,
          images: true,
          basePrice: true,
          durationDays: true,
          regions: true,
          tags: true
        }
      },
      bids: {
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
      }
    }
  });
  
  if (!auction) {
    throw new NotFoundError('Auction not found');
  }
  
  return auction;
};

export const createAuction = async (touristId: number, auctionData: any) => {
  // Validate required fields
  const { title, description, location, startDate, numberOfPeople, budget, expiresAt, programId } = auctionData;
  
  if (!title || !description || !location || !startDate || !numberOfPeople || !expiresAt) {
    throw new BadRequestError('Missing required fields for auction creation');
  }
  
  // Validate dates
  const now = new Date();
  const parsedExpiresAt = new Date(expiresAt);
  
  if (parsedExpiresAt <= now) {
    throw new BadRequestError('Expiration date must be in the future');
  }
  
  // Check if program exists if programId is provided
  if (programId) {
    const program = await prisma.program.findUnique({
      where: { id: parseInt(programId) },
      select: { 
        id: true,
        bookingType: true
      }
    });
    
    if (!program) {
      throw new NotFoundError('Program not found');
    }
    
    if (program.bookingType === 'DIRECT_ONLY') {
      throw new BadRequestError('This program only allows direct booking, not auctions');
    }
  }
  
  // Create the auction
  const auction = await prisma.auction.create({
    data: {
      touristId,
      title,
      description,
      location,
      startDate: startDate,
      numberOfPeople: parseInt(numberOfPeople),
      budget: budget ? parseFloat(budget) : null,
      programId: programId ? parseInt(programId) : null,
      status: 'OPEN',
      expiresAt: parsedExpiresAt
    },
    include: {
      program: {
        select: {
          id: true,
          title: true,
          images: true
        }
      }
    }
  });
  
  return auction;
};

export const updateAuction = async (auctionId: number, touristId: number, updateData: any) => {
  // Check if auction exists and belongs to the tourist
  const auction = await prisma.auction.findFirst({
    where: { 
      id: auctionId,
      touristId
    },
    include: {
      bids: {
        select: { id: true }
      }
    }
  });
  
  if (!auction) {
    throw new NotFoundError('Auction not found or you are not authorized to update it');
  }
  
  // Check if auction can be updated (only if no bids yet and status is OPEN)
  if (auction.bids.length > 0) {
    throw new BadRequestError('Cannot update auction once bids have been placed');
  }
  
  if (auction.status !== 'OPEN') {
    throw new BadRequestError(`Cannot update auction with status ${auction.status}`);
  }
  
  // Extract updatable fields
  const { title, description, location, startDate, numberOfPeople, budget, expiresAt, programId } = updateData;
  
  // Build update object
  const updateObj: any = {};
  if (title !== undefined) updateObj.title = title;
  if (description !== undefined) updateObj.description = description;
  if (location !== undefined) updateObj.location = location;
  if (startDate !== undefined) updateObj.startDate = startDate;
  if (numberOfPeople !== undefined) updateObj.numberOfPeople = parseInt(numberOfPeople);
  if (budget !== undefined) updateObj.budget = budget ? parseFloat(budget) : null;
  
  // Check if program exists if programId is provided
  if (programId !== undefined) {
    if (programId) {
      const program = await prisma.program.findUnique({
        where: { id: parseInt(programId) },
        select: { 
          id: true,
          bookingType: true
        }
      });
      
      if (!program) {
        throw new NotFoundError('Program not found');
      }
      
      if (program.bookingType === 'DIRECT_ONLY') {
        throw new BadRequestError('This program only allows direct booking, not auctions');
      }
      
      updateObj.programId = parseInt(programId);
    } else {
      updateObj.programId = null;
    }
  }
  
  if (expiresAt !== undefined) {
    const parsedExpiresAt = new Date(expiresAt);
    const now = new Date();
    
    if (parsedExpiresAt <= now) {
      throw new BadRequestError('Expiration date must be in the future');
    }
    
    updateObj.expiresAt = parsedExpiresAt;
  }
  
  // Update the auction
  const updatedAuction = await prisma.auction.update({
    where: { id: auctionId },
    data: updateObj,
    include: {
      program: {
        select: {
          id: true,
          title: true,
          images: true
        }
      }
    }
  });
  
  return updatedAuction;
};

export const deleteAuction = async (auctionId: number, touristId: number) => {
  // Check if auction exists and belongs to the tourist
  const auction = await prisma.auction.findFirst({
    where: { 
      id: auctionId,
      touristId
    },
    include: {
      bids: {
        select: { id: true }
      }
    }
  });
  
  if (!auction) {
    throw new NotFoundError('Auction not found or you are not authorized to delete it');
  }
  
  // Check if auction can be deleted (only if no bids yet and status is OPEN)
  if (auction.bids.length > 0) {
    throw new BadRequestError('Cannot delete auction once bids have been placed');
  }
  
  if (auction.status !== 'OPEN') {
    throw new BadRequestError(`Cannot delete auction with status ${auction.status}`);
  }
  
  // Delete the auction
  await prisma.auction.delete({
    where: { id: auctionId }
  });
  
  return { success: true };
};

export const closeAuction = async (auctionId: number, touristId: number, winningBidId?: number) => {
  // Check if auction exists and belongs to the tourist
  const auction = await prisma.auction.findFirst({
    where: { 
      id: auctionId,
      touristId,
      status: 'OPEN'
    },
    include: {
      bids: {
        orderBy: {
          price: 'desc'
        },
        take: 1
      }
    }
  });
  
  if (!auction) {
    throw new NotFoundError('Active auction not found or you are not authorized to close it');
  }
  
  let acceptedBidId = null;
  
  // If a winning bid ID is provided, verify it belongs to this auction
  if (winningBidId) {
    const bid = await prisma.bid.findFirst({
      where: {
        id: winningBidId,
        auctionId
      }
    });
    
    if (!bid) {
      throw new BadRequestError('Invalid winning bid selected');
    }
    
    acceptedBidId = winningBidId;
    
    // Update the winning bid as accepted
    await prisma.bid.update({
      where: { id: winningBidId },
      data: { isAccepted: true }
    });
  }
  
  // Update the auction status to CLOSED
  const updatedAuction = await prisma.auction.update({
    where: { id: auctionId },
    data: {
      status: 'CLOSED'
    },
    include: {
      program: {
        select: {
          id: true,
          title: true
        }
      },
      bids: {
        where: {
          isAccepted: true
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
      }
    }
  });
  
  return updatedAuction;
};

export const placeBid = async (auctionId: number, guideId: number, bidData: any) => {
  // Validate bid data
  const { price, description } = bidData;
  
  if (!price || !description) {
    throw new BadRequestError('Price and description are required');
  }
  
  // Check if auction exists and is active
  const auction = await prisma.auction.findFirst({
    where: { 
      id: auctionId,
      status: 'OPEN',
      expiresAt: {
        gt: new Date()
      }
    },
    include: {
      program: true
    }
  });
  
  if (!auction) {
    throw new NotFoundError('Active auction not found');
  }
  
  // Create the bid
  const bid = await prisma.bid.create({
    data: {
      auctionId,
      guideId,
      price: parseFloat(price),
      description
    },
    include: {
      auction: {
        include: {
          program: {
            select: {
              id: true,
              title: true
            }
          }
        }
      },
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

// Get auctions created by a tourist
export const getTouristAuctions = async (touristId: number) => {
  // Get all auctions created by the tourist
  const auctions = await prisma.auction.findMany({
    where: {
      touristId
    },
    include: {
      program: {
        select: {
          id: true,
          title: true,
          images: true
        }
      },
      bids: {
        orderBy: {
          price: 'desc'
        }
      },
      _count: {
        select: { bids: true }
      }
    },
    orderBy: {
      expiresAt: 'asc'
    }
  });
  
  return auctions;
};

// Get auctions a guide has bid on
export const getGuideBiddedAuctions = async (guideId: number) => {
  // Get all auctions that have bids from this guide
  const bids = await prisma.bid.findMany({
    where: {
      guideId
    },
    select: {
      auctionId: true
    },
    distinct: ['auctionId']
  });
  
  const auctionIds = bids.map(bid => bid.auctionId);
  
  const auctions = await prisma.auction.findMany({
    where: {
      id: {
        in: auctionIds
      }
    },
    include: {
      tourist: {
        include: {
          baseUser: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      },
      program: {
        select: {
          id: true,
          title: true,
          images: true
        }
      },
      bids: {
        where: {
          guideId
        },
        orderBy: {
          price: 'desc'
        }
      }
    },
    orderBy: [
      {
        status: 'asc'
      },
      {
        expiresAt: 'asc'
      }
    ]
  });
  
  return auctions;
};

// Get all auctions for a specific program
export const getProgramAuctions = async (programId: number) => {
  // Get all auctions for this program
  const auctions = await prisma.auction.findMany({
    where: {
      programId,
      status: 'OPEN',
      expiresAt: {
        gt: new Date()
      }
    },
    include: {
      tourist: {
        include: {
          baseUser: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      },
      bids: {
        orderBy: {
          price: 'desc'
        },
        take: 1
      },
      _count: {
        select: { bids: true }
      }
    },
    orderBy: {
      expiresAt: 'asc'
    }
  });
  
  return auctions;
}; 