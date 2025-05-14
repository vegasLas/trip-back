import prisma from './prismaService';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors';

export const getUserBookings = async (userId: number, isTourist: boolean) => {
  // Get bookings based on user role
  if (isTourist) {
    // Get tourist ID
    const tourist = await prisma.tourist.findFirst({
      where: { baseUserId: userId }
    });
    
    if (!tourist) {
      throw new NotFoundError('Tourist profile not found');
    }
    
    // Get bookings for tourist
    const bookings = await prisma.booking.findMany({
      where: { touristId: tourist.id },
      include: {
        program: {
          select: {
            id: true,
            title: true,
            description: true,
            basePrice: true,
            durationDays: true,
            imageUrls: true,
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
        },
        pricingTier: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return bookings;
  } else {
    // Get guide ID
    const guide = await prisma.guide.findFirst({
      where: { baseUserId: userId }
    });
    
    if (!guide) {
      throw new NotFoundError('Guide profile not found');
    }
    
    // Get bookings for programs where user is the guide
    const bookings = await prisma.booking.findMany({
      where: {
        program: {
          guideId: guide.id
        }
      },
      include: {
        program: {
          select: {
            id: true,
            title: true,
            description: true,
            durationDays: true
          }
        },
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
        pricingTier: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return bookings;
  }
};

export const getBookingById = async (bookingId: number, userId: number, isTourist: boolean, isGuide: boolean) => {
  // Get the booking with details
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      program: {
        include: {
          guide: {
            include: {
              baseUser: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true
                }
              }
            }
          },
          days: {
            include: {
              points: true
            },
            orderBy: {
              dayNumber: 'asc'
            }
          }
        }
      },
      tourist: {
        include: {
          baseUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        }
      },
      pricingTier: true
    }
  });
  
  if (!booking) {
    throw new NotFoundError('Booking not found');
  }
  
  // Check authorization
  if (isTourist) {
    const tourist = await prisma.tourist.findFirst({
      where: { baseUserId: userId }
    });
    
    if (!tourist || tourist.id !== booking.touristId) {
      throw new ForbiddenError('You are not authorized to view this booking');
    }
  } else if (isGuide) {
    const guide = await prisma.guide.findFirst({
      where: { baseUserId: userId }
    });
    
    if (!guide || guide.id !== booking.program.guideId) {
      throw new ForbiddenError('You are not authorized to view this booking');
    }
  } else {
    throw new ForbiddenError('Unauthorized access');
  }
  
  return booking;
};

export const createBooking = async (touristId: number, bookingData: any) => {
  // Validate required fields
  const { programId, startDate, numberOfPeople, pricingTierId } = bookingData;
  
  if (!programId || !startDate || !numberOfPeople) {
    throw new BadRequestError('Program ID, start date, and number of people are required');
  }
  
  // Check if program exists and is active/approved
  const program = await prisma.program.findFirst({
    where: { 
      id: parseInt(programId),
      isActive: true,
      isApproved: true
    },
    include: {
      pricingTiers: true
    }
  });
  
  if (!program) {
    throw new NotFoundError('Program not found or not available for booking');
  }
  
  // Determine pricing
  let pricePerPerson = program.basePrice;
  let selectedTier = null;
  
  if (pricingTierId) {
    // Use specified pricing tier
    selectedTier = program.pricingTiers.find(tier => tier.id === parseInt(pricingTierId));
    
    if (!selectedTier) {
      throw new BadRequestError('Specified pricing tier not found');
    }
    
    if (numberOfPeople < selectedTier.minPeople || numberOfPeople > selectedTier.maxPeople) {
      throw new BadRequestError(`Number of people (${numberOfPeople}) doesn't match the selected pricing tier (${selectedTier.minPeople}-${selectedTier.maxPeople})`);
    }
    
    pricePerPerson = selectedTier.pricePerPerson;
  } else {
    // Find appropriate pricing tier based on number of people
    const matchingTier = program.pricingTiers
      .filter(tier => tier.isActive)
      .find(tier => 
        numberOfPeople >= tier.minPeople && 
        numberOfPeople <= tier.maxPeople
      );
    
    if (matchingTier) {
      selectedTier = matchingTier;
      pricePerPerson = matchingTier.pricePerPerson;
    }
  }
  
  // Calculate total price
  const totalPrice = pricePerPerson * numberOfPeople;
  
  // Create booking
  const booking = await prisma.booking.create({
    data: {
      programId: parseInt(programId),
      touristId,
      startDate: new Date(startDate),
      numberOfPeople: parseInt(numberOfPeople),
      status: 'PENDING',
      pricingTierId: selectedTier?.id || null,
      pricePerPerson,
      totalPrice
    },
    include: {
      program: {
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
      },
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
      pricingTier: true
    }
  });
  
  return booking;
};

export const updateBookingStatus = async (bookingId: number, userId: number, isGuide: boolean, isTourist: boolean, statusData: any) => {
  // Validate status
  const { status } = statusData;
  
  if (!status || !['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'].includes(status)) {
    throw new BadRequestError('Invalid booking status');
  }
  
  // Check if booking exists
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      program: true,
      tourist: {
        include: {
          baseUser: true
        }
      }
    }
  });
  
  if (!booking) {
    throw new NotFoundError('Booking not found');
  }
  
  // Check authorization
  if (isTourist) {
    const tourist = await prisma.tourist.findFirst({
      where: { baseUserId: userId }
    });
    
    if (!tourist || tourist.id !== booking.touristId) {
      throw new ForbiddenError('You are not authorized to update this booking');
    }
    
    // Tourists can only cancel their own bookings
    if (status !== 'CANCELLED') {
      throw new ForbiddenError('Tourists can only cancel bookings');
    }
  } else if (isGuide) {
    const guide = await prisma.guide.findFirst({
      where: { baseUserId: userId }
    });
    
    if (!guide || guide.id !== booking.program.guideId) {
      throw new ForbiddenError('You are not authorized to update this booking');
    }
    
    // Guides can confirm, cancel, or mark as completed
    if (status === 'PENDING') {
      throw new BadRequestError('Cannot set booking back to pending status');
    }
  } else {
    throw new ForbiddenError('Unauthorized access');
  }
  
  // Update booking status
  const updatedBooking = await prisma.booking.update({
    where: { id: bookingId },
    data: { status },
    include: {
      program: {
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
      },
      tourist: {
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
  
  return updatedBooking;
};

export const cancelBooking = async (bookingId: number, userId: number, isTourist: boolean) => {
  // Check if booking exists
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      program: true
    }
  });
  
  if (!booking) {
    throw new NotFoundError('Booking not found');
  }
  
  // Check authorization (only tourists can cancel their own bookings)
  if (isTourist) {
    const tourist = await prisma.tourist.findFirst({
      where: { baseUserId: userId }
    });
    
    if (!tourist || tourist.id !== booking.touristId) {
      throw new ForbiddenError('You are not authorized to cancel this booking');
    }
  } else {
    throw new ForbiddenError('Only tourists can cancel bookings');
  }
  
  // Check if booking can be cancelled (only pending or confirmed bookings)
  if (!['PENDING', 'CONFIRMED'].includes(booking.status)) {
    throw new BadRequestError(`Cannot cancel a booking with status ${booking.status}`);
  }
  
  // Update booking status to cancelled
  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: 'CANCELLED' }
  });
  
  return { success: true };
}; 