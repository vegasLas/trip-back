import prisma from './prismaService';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors';

export const getProgramReviews = async (programId: number) => {
  // Check if program exists
  const program = await prisma.program.findUnique({
    where: { id: programId },
    select: { id: true }
  });
  
  if (!program) {
    throw new NotFoundError('Program not found');
  }
  
  // Get all reviews for the program
  const reviews = await prisma.review.findMany({
    where: { 
      programId,
      active: true 
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
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
  
  return reviews;
};

export const getGuideReviews = async (guideId: number) => {
  // Check if guide exists
  const guide = await prisma.guide.findUnique({
    where: { id: guideId },
    select: { id: true }
  });
  
  if (!guide) {
    throw new NotFoundError('Guide not found');
  }
  
  // Get all reviews for programs by this guide
  const reviews = await prisma.review.findMany({
    where: { 
      program: {
        guideId
      },
      active: true
    },
    include: {
      program: {
        select: {
          id: true,
          title: true
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
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
  
  return reviews;
};

export const getReviewById = async (reviewId: number) => {
  // Get the review by ID
  const review = await prisma.review.findFirst({
    where: { 
      id: reviewId,
      active: true
    },
    include: {
      program: {
        select: {
          id: true,
          title: true,
          guideId: true,
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
  
  if (!review) {
    throw new NotFoundError('Review not found');
  }
  
  return review;
};

export const createReview = async (touristId: number, reviewData: any) => {
  // Validate required fields
  const { programId, rating, comment } = reviewData;
  
  if (!programId || !rating) {
    throw new BadRequestError('Program ID and rating are required');
  }
  
  // Check if program exists
  const program = await prisma.program.findUnique({
    where: { 
      id: parseInt(programId),
      isActive: true
    },
    select: { id: true, guideId: true }
  });
  
  if (!program) {
    throw new NotFoundError('Program not found');
  }
  
  // Check if tourist has completed a booking for this program
  const completedBooking = await prisma.booking.findFirst({
    where: {
      programId: parseInt(programId),
      touristId,
      status: 'COMPLETED'
    }
  });
  
  if (!completedBooking) {
    throw new BadRequestError('You can only review programs you have completed');
  }
  
  // Check if tourist has already reviewed this program
  const existingReview = await prisma.review.findFirst({
    where: {
      programId: parseInt(programId),
      touristId,
      active: true
    }
  });
  
  if (existingReview) {
    throw new BadRequestError('You have already reviewed this program');
  }
  
  // Create the review
  const review = await prisma.review.create({
    data: {
      programId: parseInt(programId),
      touristId,
      guideId: program.guideId,
      rating: parseInt(rating),
      comment: comment || '',
      active: true
    },
    include: {
      program: {
        select: {
          title: true
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
  
  // Update program average rating
  await updateProgramRating(parseInt(programId));
  
  return review;
};

export const updateReview = async (reviewId: number, touristId: number, updateData: any) => {
  // Check if review exists and belongs to the tourist
  const review = await prisma.review.findFirst({
    where: { 
      id: reviewId,
      touristId,
      active: true
    }
  });
  
  if (!review) {
    throw new NotFoundError('Review not found or you are not authorized to update it');
  }
  
  // Extract and validate updatable fields
  const { rating, comment } = updateData;
  
  if (!rating) {
    throw new BadRequestError('Rating is required');
  }
  
  // Update the review
  const updatedReview = await prisma.review.update({
    where: { id: reviewId },
    data: {
      rating: parseInt(rating),
      comment: comment || review.comment
    },
    include: {
      program: {
        select: {
          id: true,
          title: true
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
  
  // Update program average rating
  await updateProgramRating(review.programId);
  
  return updatedReview;
};

export const deleteReview = async (reviewId: number, touristId: number) => {
  // Check if review exists and belongs to the tourist
  const review = await prisma.review.findFirst({
    where: { 
      id: reviewId,
      touristId,
      active: true
    }
  });
  
  if (!review) {
    throw new NotFoundError('Review not found or you are not authorized to delete it');
  }
  
  // Soft delete the review by setting active to false
  await prisma.review.update({
    where: { id: reviewId },
    data: { active: false }
  });
  
  // Update program average rating
  await updateProgramRating(review.programId);
  
  return { success: true };
};

// Helper function to update program average rating
const updateProgramRating = async (programId: number) => {
  // Get all active reviews for the program
  const reviews = await prisma.review.findMany({
    where: {
      programId,
      active: true
    },
    select: {
      rating: true
    }
  });
  
  // Calculate average rating
  let avgRating = 0;
  if (reviews.length > 0) {
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    avgRating = Math.round((sum / reviews.length) * 10) / 10; // Round to 1 decimal place
  }
  
  // Update program with new average rating
  // We'll need to check if these fields exist in the Program model
  // For now, commenting out this update until we confirm the fields exist
  /*
  await prisma.program.update({
    where: { id: programId },
    data: {
      rating: avgRating,
      reviewCount: reviews.length
    }
  });
  */
}; 