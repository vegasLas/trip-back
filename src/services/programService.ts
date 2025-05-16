import prisma from './prismaService';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors';

export const getAllPrograms = async (filters: any = {}) => {
  // Extract filter parameters
  const { search, guideId, regions, minPrice, maxPrice, minDuration, maxDuration, tags } = filters;
  
  // Build the where clause for filtering
  const where: any = {
    isActive: true,
    isApproved: true
  };
  
  // Filter by search term (title or description)
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } }
    ];
  }
  
  // Filter by guide
  if (guideId) {
    where.guideId = parseInt(guideId);
  }
  
  // Filter by regions
  if (regions && Array.isArray(regions) && regions.length > 0) {
    where.regions = { 
      hasSome: regions
    };
  }
  
  // Filter by price range
  if (minPrice !== undefined) {
    where.basePrice = { 
      ...where.basePrice,
      gte: parseFloat(minPrice)
    };
  }
  
  if (maxPrice !== undefined) {
    where.basePrice = { 
      ...where.basePrice,
      lte: parseFloat(maxPrice)
    };
  }
  
  // Filter by duration
  if (minDuration !== undefined) {
    where.durationDays = { 
      ...where.durationDays,
      gte: parseInt(minDuration)
    };
  }
  
  if (maxDuration !== undefined) {
    where.durationDays = { 
      ...where.durationDays,
      lte: parseInt(maxDuration)
    };
  }
  
  // Filter by tags
  if (tags && Array.isArray(tags) && tags.length > 0) {
    where.tags = { 
      hasSome: tags
    };
  }
  
  // Get programs with filters
  const programs = await prisma.program.findMany({
    where,
    include: {
      guide: {
        include: {
          baseUser: {
            select: {
              firstName: true,
              lastName: true,
              username: true
            }
          }
        }
      },
      pricingTiers: true,
      _count: {
        select: {
          reviews: true,
          bookings: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
  
  return programs;
};

export const getProgramById = async (programId: number) => {
  const program = await prisma.program.findUnique({
    where: { 
      id: programId,
      isActive: true
    },
    include: {
      guide: {
        include: {
          baseUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true
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
      },
      pricingTiers: {
        orderBy: {
          minPeople: 'asc'
        }
      },
      reviews: {
        include: {
          tourist: {
            include: {
              baseUser: {
                select: {
                  firstName: true,
                  lastName: true,
                  username: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 5
      },
      selectedGuides: {
        include: {
          baseUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true
            }
          }
        }
      }
    }
  });
  
  if (!program) {
    throw new NotFoundError('Program not found');
  }
  
  return program;
};

export const getProgramGuides = async (programId: number) => {
  const program = await prisma.program.findUnique({
    where: { 
      id: programId,
      isActive: true,
      isApproved: true
    },
    include: {
      selectedGuides: {
        where: {
          isActive: true
        },
        include: {
          baseUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true
            }
          },
          receivedReviews: true
        }
      }
    }
  });
  
  if (!program) {
    throw new NotFoundError('Program not found');
  }
  
  return program.selectedGuides;
};

export const createProgram = async (guideId: number, programData: any) => {
  // Validate required fields
  const { 
    title, 
    description, 
    basePrice, 
    durationDays, 
    maxGroupSize, 
    startLocation, 
    regions, 
    tags, 
    days 
  } = programData;
  
  if (!title || !description || !basePrice || !durationDays || !maxGroupSize || !startLocation) {
    throw new BadRequestError('Missing required program fields');
  }
  
  if (!regions || !Array.isArray(regions) || regions.length === 0) {
    throw new BadRequestError('At least one region must be specified');
  }
  
  if (!days || !Array.isArray(days) || days.length === 0) {
    throw new BadRequestError('Program must have at least one day');
  }
  
  // Create program with days and points
  const program = await prisma.$transaction(async (tx) => {
    // Create the program
    const newProgram = await tx.program.create({
      data: {
        title,
        description,
        basePrice: parseFloat(basePrice),
        durationDays: parseInt(durationDays),
        maxGroupSize: parseInt(maxGroupSize),
        startLocation,
        regions: regions || [],
        tags: tags || [],
        images: programData.images || [],
        isActive: true,
        isApproved: false, // Requires admin approval
        bookingType: programData.bookingType || 'BOTH',
        guideId,
        // Add the creating guide to selected guides
        selectedGuides: {
          connect: { id: guideId }
        }
      }
    });
    
    // Create pricing tiers if provided
    if (programData.pricingTiers && Array.isArray(programData.pricingTiers)) {
      for (const tier of programData.pricingTiers) {
        await tx.pricingTier.create({
          data: {
            programId: newProgram.id,
            title: tier.title || `${tier.minPeople}-${tier.maxPeople} people`,
            description: tier.description,
            minPeople: parseInt(tier.minPeople),
            maxPeople: parseInt(tier.maxPeople),
            pricePerPerson: parseFloat(tier.pricePerPerson),
            isActive: true
          }
        });
      }
    }
    
    // Create days and points
    for (let i = 0; i < days.length; i++) {
      const day = days[i];
      const newDay = await tx.programDay.create({
        data: {
          programId: newProgram.id,
          dayNumber: i + 1,
          title: day.title,
          description: day.description
        }
      });
      
      // Create points for this day
      if (day.points && Array.isArray(day.points)) {
        for (let j = 0; j < day.points.length; j++) {
          const point = day.points[j];
          await tx.programPoint.create({
            data: {
              programDayId: newDay.id,
              title: point.title,
              description: point.description,
              pointType: point.pointType || 'ACTIVITY',
              order: j + 1,
              duration: point.duration ? parseInt(point.duration) : null,
              location: point.location,
              imageUrl: point.imageUrl
            }
          });
        }
      }
    }
    
    // Return the created program with all relations
    return tx.program.findUnique({
      where: { id: newProgram.id },
      include: {
        days: {
          include: {
            points: true
          },
          orderBy: {
            dayNumber: 'asc'
          }
        },
        pricingTiers: true,
        selectedGuides: true
      }
    });
  });
  
  return program;
};

export const createProgramByAdmin = async (programData: any) => {
  // Validate required fields
  const { 
    title, 
    description, 
    basePrice, 
    durationDays, 
    maxGroupSize, 
    startLocation, 
    regions, 
    tags, 
    days 
  } = programData;
  
  if (!title || !description || !basePrice || !durationDays || !maxGroupSize || !startLocation) {
    throw new BadRequestError('Missing required program fields');
  }
  
  if (!regions || !Array.isArray(regions) || regions.length === 0) {
    throw new BadRequestError('At least one region must be specified');
  }
  
  if (!days || !Array.isArray(days) || days.length === 0) {
    throw new BadRequestError('Program must have at least one day');
  }
  
  // Create program with days and points
  const program = await prisma.$transaction(async (tx) => {
    // Create the program
    const newProgram = await tx.program.create({
      data: {
        title,
        description,
        basePrice: parseFloat(basePrice),
        durationDays: parseInt(durationDays),
        maxGroupSize: parseInt(maxGroupSize),
        startLocation,
        regions: regions || [],
        tags: tags || [],
        images: programData.images || [],
        isActive: true,
        isApproved: true, // Admin-created programs are automatically approved
        bookingType: programData.bookingType || 'BOTH',
        // No guideId needed as it's optional now
      }
    });
    
    // Create pricing tiers if provided
    if (programData.pricingTiers && Array.isArray(programData.pricingTiers)) {
      for (const tier of programData.pricingTiers) {
        await tx.pricingTier.create({
          data: {
            programId: newProgram.id,
            title: tier.title || `${tier.minPeople}-${tier.maxPeople} people`,
            description: tier.description,
            minPeople: parseInt(tier.minPeople),
            maxPeople: parseInt(tier.maxPeople),
            pricePerPerson: parseFloat(tier.pricePerPerson),
            isActive: true
          }
        });
      }
    }
    
    // Create days and points
    for (let i = 0; i < days.length; i++) {
      const day = days[i];
      const newDay = await tx.programDay.create({
        data: {
          programId: newProgram.id,
          dayNumber: i + 1,
          title: day.title,
          description: day.description
        }
      });
      
      // Create points for this day
      if (day.points && Array.isArray(day.points)) {
        for (let j = 0; j < day.points.length; j++) {
          const point = day.points[j];
          await tx.programPoint.create({
            data: {
              programDayId: newDay.id,
              title: point.title,
              description: point.description,
              pointType: point.pointType || 'ACTIVITY',
              order: j + 1,
              duration: point.duration ? parseInt(point.duration) : null,
              location: point.location,
              imageUrl: point.imageUrl
            }
          });
        }
      }
    }
    
    // Return the created program with all relations
    return tx.program.findUnique({
      where: { id: newProgram.id },
      include: {
        days: {
          include: {
            points: true
          },
          orderBy: {
            dayNumber: 'asc'
          }
        },
        pricingTiers: true
      }
    });
  });
  
  return program;
};

export const updateProgram = async (programId: number, guideId: number, updateData: any) => {
  // Check if program exists and guide is the owner
  const program = await prisma.program.findUnique({
    where: { id: programId },
    select: { guideId: true }
  });
  
  if (!program) {
    throw new NotFoundError('Program not found');
  }
  
  if (program.guideId !== null && program.guideId !== guideId) {
    throw new ForbiddenError('You are not authorized to update this program');
  }
  
  // Extract updatable fields
  const { 
    title, 
    description, 
    basePrice, 
    durationDays, 
    maxGroupSize, 
    startLocation, 
    regions, 
    tags, 
    images,
    isActive,
    bookingType
  } = updateData;
  
  // Build update object
  const updateObj: any = {};
  if (title !== undefined) updateObj.title = title;
  if (description !== undefined) updateObj.description = description;
  if (basePrice !== undefined) updateObj.basePrice = parseFloat(basePrice);
  if (durationDays !== undefined) updateObj.durationDays = parseInt(durationDays);
  if (maxGroupSize !== undefined) updateObj.maxGroupSize = parseInt(maxGroupSize);
  if (startLocation !== undefined) updateObj.startLocation = startLocation;
  if (regions !== undefined) updateObj.regions = regions;
  if (tags !== undefined) updateObj.tags = tags;
  if (images !== undefined) updateObj.images = images;
  if (isActive !== undefined) updateObj.isActive = isActive;
  if (bookingType !== undefined) updateObj.bookingType = bookingType;
  
  // Update program
  const updatedProgram = await prisma.program.update({
    where: { id: programId },
    data: updateObj,
    include: {
      days: {
        include: {
          points: true
        },
        orderBy: {
          dayNumber: 'asc'
        }
      },
      pricingTiers: true
    }
  });
  
  return updatedProgram;
};

export const deleteProgram = async (programId: number, guideId: number) => {
  // Check if program exists and guide is the owner
  const program = await prisma.program.findUnique({
    where: { id: programId },
    select: { guideId: true }
  });
  
  if (!program) {
    throw new NotFoundError('Program not found');
  }
  
  if (program.guideId !== null && program.guideId !== guideId) {
    throw new ForbiddenError('You are not authorized to delete this program');
  }
  
  // Delete program (in a real app, you might want to soft delete)
  await prisma.program.delete({
    where: { id: programId }
  });
  
  return { success: true };
};

export const createDirectRequest = async (programId: number, touristId: number, requestData: any) => {
  // Check if program exists
  const program = await prisma.program.findUnique({
    where: { 
      id: programId,
      isActive: true,
      isApproved: true
    },
    select: { 
      id: true,
      guideId: true,
      bookingType: true
    }
  });
  
  if (!program) {
    throw new NotFoundError('Program not found');
  }
  
  // Check if booking type allows direct requests
  if (program.bookingType === 'AUCTION_ONLY') {
    throw new BadRequestError('This program does not allow direct booking requests');
  }
  
  // Validate required fields
  const { startDate, numberOfPeople } = requestData;
  
  if (!startDate) {
    throw new BadRequestError('Start date is required');
  }
  
  if (!numberOfPeople || numberOfPeople < 1) {
    throw new BadRequestError('Number of people must be at least 1');
  }
  
  // Create direct request
  const directRequest = await prisma.directRequest.create({
    data: {
      programId,
      touristId,
      startDate: new Date(startDate),
      numberOfPeople: parseInt(numberOfPeople),
      status: 'PENDING'
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
      }
    }
  });
  
  return directRequest;
};

export const respondToDirectRequest = async (requestId: number, guideId: number, response: any) => {
  // Check if request exists and is pending
  const request = await prisma.directRequest.findUnique({
    where: { id: requestId },
    include: {
      program: true
    }
  });
  
  if (!request) {
    throw new NotFoundError('Request not found');
  }
  
  // Check if guide owns the program
  if (request.program.guideId !== guideId) {
    throw new ForbiddenError('You are not authorized to respond to this request');
  }
  
  // Check if request is still pending
  if (request.status !== 'PENDING') {
    throw new BadRequestError('This request has already been responded to');
  }
  
  // Extract response data
  const { status, message } = response;
  
  if (!status || !['ACCEPTED', 'REJECTED'].includes(status)) {
    throw new BadRequestError('Invalid response status');
  }
  
  // Update request
  const updatedRequest = await prisma.directRequest.update({
    where: { id: requestId },
    data: {
      status,
      guideResponse: message
    },
    include: {
      program: true,
      tourist: {
        include: {
          baseUser: true
        }
      }
    }
  });
  
  return updatedRequest;
};

export const recommendProgram = async (programId: number, guideId: number, recommendation: any) => {
  // Check if program exists
  const program = await prisma.program.findUnique({
    where: { id: programId },
    select: { id: true }
  });
  
  if (!program) {
    throw new NotFoundError('Program not found');
  }
  
  // Check if guide has already recommended this program
  const existingRec = await prisma.programRecommendation.findFirst({
    where: {
      programId,
      guideId
    }
  });
  
  if (existingRec) {
    throw new BadRequestError('You have already recommended this program');
  }
  
  // Create recommendation
  const { comment } = recommendation;
  
  const newRecommendation = await prisma.programRecommendation.create({
    data: {
      programId,
      guideId,
      comment,
      status: 'PENDING'
    },
    include: {
      program: {
        select: {
          title: true,
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
  
  return newRecommendation;
};

export const getAllProgramRecommendations = async () => {
  const recommendations = await prisma.programRecommendation.findMany({
    include: {
      program: {
        select: {
          id: true,
          title: true,
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
      createdAt: 'desc'
    }
  });
  
  return recommendations;
};

export const updateRecommendationStatus = async (recommendationId: number, status: 'APPROVED' | 'REJECTED', adminComment?: string) => {
  // Check if recommendation exists
  const recommendation = await prisma.programRecommendation.findUnique({
    where: { id: recommendationId },
    select: { id: true, status: true }
  });
  
  if (!recommendation) {
    throw new NotFoundError('Recommendation not found');
  }
  
  // Check if recommendation is still pending
  if (recommendation.status !== 'PENDING') {
    throw new BadRequestError('This recommendation has already been processed');
  }
  
  // Update recommendation
  const updatedRecommendation = await prisma.programRecommendation.update({
    where: { id: recommendationId },
    data: {
      status,
      adminComment
    },
    include: {
      program: {
        select: {
          title: true,
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
  
  return updatedRecommendation;
}; 