import prisma from './prismaService';
import { NotFoundError, BadRequestError } from '../utils/errors';
import * as notificationService from './notificationService';
import { ChangeType } from '@prisma/client';

/**
 * Interface for guide update data
 */
interface GuideUpdateData {
  // Base guide fields
  bio?: string;
  specialties?: string[];
  phoneNumber?: string;
  email?: string;
  isActive?: boolean;
  
  // Images
  newImages?: string[]; // URLs of newly uploaded images
  existingImages?: string[]; // URLs of existing images to keep
  
  // Related entities
  programIds?: number[]; // For selected programs
  
  // User profile data (will be updated in BaseUser)
  firstName?: string;
  lastName?: string;
  username?: string;
}

/**
 * Get guide record by user ID
 */
export const getGuideByUserId = async (userId: number) => {
  const user = await prisma.baseUser.findUnique({
    where: { id: userId },
    include: {
      guide: true
    }
  });

  if (!user || !user.guide) {
    throw new NotFoundError('Guide not found');
  }

  return user.guide;
};

/**
 * Get complete guide profile with relations
 */
export const getGuideProfile = async (guideId: number) => {
  const guide = await prisma.guide.findUnique({
    where: { id: guideId },
    include: {
      baseUser: true,
      selectedPrograms: {
        select: {
          id: true,
          title: true,
          description: true,
          basePrice: true,
          durationDays: true,
          images: true,
        }
      },
      receivedReviews: {
        include: {
          tourist: {
            include: {
              baseUser: true
            }
          }
        }
      }
    }
  });

  if (!guide) {
    throw new NotFoundError('Guide not found');
  }

  return guide;
};

/**
 * Consolidated function to update all guide information
 */
export const updateGuide = async (guideId: number, userId: number, data: GuideUpdateData) => {
  // Validate guide exists and belongs to user
  const guide = await prisma.guide.findFirst({
    where: {
      id: guideId,
      baseUser: {
        id: userId
      }
    },
    include: {
      baseUser: true
    }
  });

  if (!guide) {
    throw new NotFoundError('Guide not found');
  }

  // Start a transaction to handle multiple operations
  return await prisma.$transaction(async (tx) => {
    let changeRequestCreated = false;
    const changeRequestData: any = {};
    
    // Collect ONLY fields that need admin approval
    if (data.bio !== undefined) {
      changeRequestData.bio = data.bio;
      changeRequestCreated = true;
    }
    
    // Handle image updates that need approval
    if (data.newImages && data.newImages.length > 0) {
      changeRequestData.images = data.newImages;
      changeRequestCreated = true;
    }
    
    // Create change request if necessary fields were changed
    if (changeRequestCreated) {
      await createGuideProfileChangeRequest(guideId, changeRequestData);
      
      // Notify the guide that changes are pending approval
      await notificationService.notifyUser(
        userId, 
        "Your profile changes to bio and new images have been submitted for approval. An admin will review them shortly."
      );
    }
    
    // Handle updates that don't require approval
    const directUpdateData: any = {};
    let directUpdatesMade = false;
    
    // Update baseUser if user profile data provided
    if (data.firstName || data.lastName || data.username) {
      await tx.baseUser.update({
        where: { id: userId },
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          username: data.username
        }
      });
      directUpdatesMade = true;
    }
    
    // Add other fields that DON'T need approval to direct updates
    
    if (data.phoneNumber !== undefined) {
      directUpdateData.phoneNumber = data.phoneNumber;
      directUpdatesMade = true;
    }
    
    if (data.email !== undefined) {
      directUpdateData.email = data.email;
      directUpdatesMade = true;
    }
    
    // Update isActive status (doesn't need approval)
    if (data.isActive !== undefined) {
      directUpdateData.isActive = data.isActive;
      directUpdatesMade = true;
    }
    
    // Update existing images arrangement (doesn't need approval)
    if (data.existingImages !== undefined) {
      directUpdateData.images = data.existingImages;
      directUpdatesMade = true;
    }
    
    // Apply direct updates if any
    let updatedGuide = guide;
    if (directUpdatesMade) {
      // Handle program selection update if provided
      if (data.programIds !== undefined) {
        // First check that all program IDs exist
        const programIdCount = await tx.program.count({
          where: {
            id: {
              in: data.programIds
            }
          }
        });

        if (programIdCount !== data.programIds.length) {
          throw new BadRequestError('One or more program IDs are invalid');
        }

        // Update guide with new program selections
        updatedGuide = await tx.guide.update({
          where: { id: guideId },
          data: {
            ...directUpdateData,
            selectedPrograms: {
              set: data.programIds.map(id => ({ id }))
            }
          },
          include: {
            baseUser: true,
            selectedPrograms: {
              select: {
                id: true,
                title: true,
                description: true,
                images: true
              }
            }
          }
        });
      } else {
        // Update guide without changing program selections
        updatedGuide = await tx.guide.update({
          where: { id: guideId },
          data: directUpdateData,
          include: {
            baseUser: true,
            selectedPrograms: {
              select: {
                id: true,
                title: true,
                description: true,
                images: true
              }
            }
          }
        });
      }

      // If status was updated to active, send notification
      if (data.isActive === true && !guide.isActive) {
        await notificationService.notifyUser(
          userId, 
          "Your guide status has been updated to active. You will now appear in search results."
        );
      } else if (data.isActive === false && guide.isActive) {
        await notificationService.notifyUser(
          userId,
          "Your guide status has been updated to inactive. You will not appear in search results."
        );
      }
    }

    // Add a message about pending approval if changes were submitted
    if (changeRequestCreated) {
      return {
        guide: updatedGuide,
        pendingChanges: true,
        pendingChangeMessage: "Your bio and image changes require admin approval and are pending review."
      };
    }

    return { 
      guide: updatedGuide,
      pendingChanges: false
    };
  });
};

/**
 * Get guide's selected programs
 */
export const getGuidePrograms = async (guideId: number) => {
  // Get guide's selected programs
  const guide = await prisma.guide.findUnique({
    where: { id: guideId },
    include: {
      selectedPrograms: {
        where: { isActive: true, isApproved: true },
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
      }
    }
  });

  if (!guide) {
    throw new NotFoundError('Guide not found');
  }

  return guide.selectedPrograms;
};

/**
 * Create a guide profile change request
 */
export const createGuideProfileChangeRequest = async (guideId: number, changes: any) => {
  // Validate guide exists
  const guide = await prisma.guide.findUnique({
    where: { id: guideId }
  });

  if (!guide) {
    throw new NotFoundError('Guide not found');
  }

  // Determine change type based on what's being changed
  let changeType = 'MULTIPLE_CHANGES';
  
  if (Object.keys(changes).length === 1) {
    if (changes.bio !== undefined) changeType = 'BIO_UPDATE';
    else if (changes.images !== undefined) changeType = 'IMAGES_UPDATE';
  } else if (changes.bio !== undefined && changes.images !== undefined) {
    changeType = 'BIO_AND_IMAGES_UPDATE';
  }

  // Create change request with empty arrays for required array fields
  const changeRequest = await prisma.guideProfileChangeRequest.create({
    data: {
      guide: { connect: { id: guideId } },
      changeType: changeType as ChangeType,
      bio: changes.bio,
      // Keep these fields for backwards compatibility
      phoneNumber: changes.phoneNumber,
      email: changes.email,
      images: changes.images || [],
      status: 'PENDING'
    }
  });

  return changeRequest;
};

/**
 * Get all pending guide profile change requests (for admin)
 */
export const getPendingGuideProfileChangeRequests = async () => {
  const requests = await prisma.guideProfileChangeRequest.findMany({
    where: { status: 'PENDING' },
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
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return requests;
};

/**
 * Process a guide profile change request (approve or reject)
 */
export const processGuideProfileChangeRequest = async (requestId: number, approve: boolean, adminComment?: string) => {
  // Find the change request
  const request = await prisma.guideProfileChangeRequest.findUnique({
    where: { id: requestId },
    include: { guide: true }
  });

  if (!request) {
    throw new NotFoundError('Change request not found');
  }

  // If rejecting, just update the status
  if (!approve) {
    const updatedRequest = await prisma.guideProfileChangeRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        adminComment
      }
    });

    // Notify the guide about the rejection
    await notificationService.notifyUser(
      request.guide.baseUserId,
      `❌ Your profile change request has been rejected. ${adminComment ? `Comment: ${adminComment}` : ''}`
    );

    return updatedRequest;
  }

  // If approving, update the guide profile with ONLY bio and images
  const updateData: any = {};

  // Only process bio changes
  if (request.bio !== null && request.bio !== undefined) {
    updateData.bio = request.bio;
  }

  // Only process image additions
  if (request.images && request.images.length > 0) {
    const currentImages = request.guide.images || [];
    updateData.images = [...currentImages, ...request.images];
  }

  // Update the guide profile and the request status
  const result = await prisma.$transaction(async (tx) => {
    // Update the guide profile
    const updatedGuide = await tx.guide.update({
      where: { id: request.guideId },
      data: updateData
    });

    // Update the request status
    const updatedRequest = await tx.guideProfileChangeRequest.update({
      where: { id: requestId },
      data: {
        status: 'APPROVED',
        adminComment
      }
    });

    return { guide: updatedGuide, request: updatedRequest };
  });

  // Notify the guide about the approval
  await notificationService.notifyUser(
    request.guide.baseUserId,
    `✅ Your bio and image changes have been approved. ${adminComment ? `Comment: ${adminComment}` : ''}`
  );

  return result;
};



/**
 * Approve or reject a guide
 */
export const updateGuideApprovalStatus = async (guideId: number, isApproved: boolean) => {
  // Get guide
  const guide = await prisma.guide.findUnique({
    where: { id: guideId },
    include: {
      baseUser: true
    }
  });

  if (!guide) {
    throw new NotFoundError('Guide not found');
  }

  // Use transaction to update both guide and baseUser
  const result = await prisma.$transaction(async (tx) => {
    // Update guide approval status
    const updatedGuide = await tx.guide.update({
      where: { id: guideId },
      data: { isApproved }
    });

    // Update user role based on approval status
    await tx.baseUser.update({
      where: { id: guide.baseUserId },
      data: { 
        role: isApproved ? 'GUIDE' : 'TOURIST'
      }
    });

    return updatedGuide;
  });

  // Send notification to the guide
  await notificationService.notifyGuideApproval(guide.baseUserId, isApproved);

  return result;
};

/**
 * Get all pending guide approval requests
 */
export const getPendingGuideApprovals = async () => {
  const pendingGuides = await prisma.guide.findMany({
    where: { 
      isApproved: false 
    },
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
  });

  return pendingGuides;
}; 