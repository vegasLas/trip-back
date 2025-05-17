import prisma from './prismaService';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors';
import { AdminData, UserData } from '../types';
import { AdminPermission } from '@prisma/client';
import * as notificationService from './notificationService';

export const getUserProfile = async (userId: number) => {
  const baseUser = await prisma.baseUser.findUnique({
    where: { id: userId },
    include: {
      tourist: true,
      guide: {
        include: {
          receivedReviews: true,
          selectedPrograms: {
            select: {
              id: true,
              title: true,
              description: true,
              basePrice: true,
              durationDays: true,
              images: true,
            }
          }
        }
      },
      admin: true
    }
  });

  if (!baseUser) {
    throw new NotFoundError('User not found');
  }

  return baseUser;
};

export const getPublicUserProfile = async (userId: number) => {
  const baseUser = await prisma.baseUser.findUnique({
    where: { id: userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      username: true,
      guide: {
        select: {
          id: true,
          bio: true,
          languages: true,
          specialties: true,
          rating: true,
          isActive: true,
          programs: {
            where: { isActive: true, isApproved: true },
            select: {
              id: true,
              title: true,
              description: true,
              basePrice: true,
              durationDays: true,
              images: true,
            }
          }
        }
      }
    }
  });

  if (!baseUser) {
    throw new NotFoundError('User not found');
  }

  return baseUser;
};

// Admin-related functions

export const getAllAdmins = async () => {
  const admins = await prisma.baseUser.findMany({
    where: {
      admin: {
        isNot: null
      }
    },
    include: {
      admin: true
    }
  });

  return admins;
};

export const getAdminById = async (adminId: number) => {
  const admin = await prisma.baseUser.findFirst({
    where: {
      id: adminId,
      admin: {
        isNot: null
      }
    },
    include: {
      admin: true
    }
  });

  if (!admin) {
    throw new NotFoundError('Admin not found');
  }

  return admin;
};

export const createAdmin = async (data: UserData & AdminData) => {
  const { telegramId, firstName, lastName, username, permissions } = data;

  // Check if user with telegramId already exists
  const existingUser = await prisma.baseUser.findUnique({
    where: { telegramId },
    include: {
      admin: true
    }
  });

  if (existingUser) {
    if (existingUser.admin) {
      throw new BadRequestError('User is already an admin');
    }

    // User exists but is not an admin, add admin role
    const admin = await prisma.admin.create({
      data: {
        baseUser: { connect: { id: existingUser.id } },
        permissions: permissions
      },
      include: {
        baseUser: true
      }
    });

    return admin;
  }

  // Create new user with admin role
  const newAdmin = await prisma.baseUser.create({
    data: {
      telegramId,
      firstName,
      lastName: lastName || null,
      username: username || null,
      admin: {
        create: {
          permissions: permissions
        }
      }
    },
    include: {
      admin: true
    }
  });

  return newAdmin;
};

export const updateAdminPermissions = async (adminId: number, permissions: AdminPermission[]) => {
  // Check if admin exists
  const admin = await prisma.admin.findFirst({
    where: {
      baseUser: {
        id: adminId
      }
    }
  });

  if (!admin) {
    throw new NotFoundError('Admin not found');
  }

  // Update admin permissions
  const updatedAdmin = await prisma.admin.update({
    where: {
      id: admin.id
    },
    data: {
      permissions: permissions
    },
    include: {
      baseUser: true
    }
  });

  return updatedAdmin;
};

export const deleteAdmin = async (adminId: number) => {
  // Find the admin
  const admin = await prisma.admin.findFirst({
    where: {
      baseUser: {
        id: adminId
      }
    }
  });

  if (!admin) {
    throw new NotFoundError('Admin not found');
  }

  // Delete admin record (but keep the base user)
  await prisma.admin.delete({
    where: {
      id: admin.id
    }
  });

  return true;
};

export const updateUserProfile = async (userId: number, data: any) => {
  // Validate incoming data
  if (!data || Object.keys(data).length === 0) {
    throw new BadRequestError('No data provided for update');
  }

  // Extract base user fields and role-specific fields
  const { firstName, lastName, username, ...roleSpecificData } = data;
  
  // Update the base user
  const baseUserUpdate: any = {};
  if (firstName !== undefined) baseUserUpdate.firstName = firstName;
  if (lastName !== undefined) baseUserUpdate.lastName = lastName;
  if (username !== undefined) baseUserUpdate.username = username;
  
  // Begin transaction to update user and role data
  const result = await prisma.$transaction(async (tx) => {
    // Update base user if there are fields to update
    let updatedBaseUser;
    if (Object.keys(baseUserUpdate).length > 0) {
      updatedBaseUser = await tx.baseUser.update({
        where: { id: userId },
        data: baseUserUpdate,
        include: {
          tourist: true,
          guide: true,
          admin: true
        }
      });
    } else {
      updatedBaseUser = await tx.baseUser.findUnique({
        where: { id: userId },
        include: {
          tourist: true,
          guide: true,
          admin: true
        }
      });
    }

    if (!updatedBaseUser) {
      throw new NotFoundError('User not found');
    }

    // Update guide-specific data if user is a guide
    if (updatedBaseUser.guide && roleSpecificData.guide) {
      const { bio, languages, specialties, phoneNumber, email } = roleSpecificData.guide;
      
      const guideUpdate: any = {};
      if (bio !== undefined) guideUpdate.bio = bio;
      if (languages !== undefined) guideUpdate.languages = languages;
      if (specialties !== undefined) guideUpdate.specialties = specialties;
      if (phoneNumber !== undefined) guideUpdate.phoneNumber = phoneNumber;
      if (email !== undefined) guideUpdate.email = email;
      
      if (Object.keys(guideUpdate).length > 0) {
        await tx.guide.update({
          where: { id: updatedBaseUser.guide.id },
          data: guideUpdate
        });
      }
    }

    // Update admin-specific data if user is an admin
    if (updatedBaseUser.admin && roleSpecificData.admin) {
      const { permissions } = roleSpecificData.admin;
      
      if (permissions !== undefined) {
        await tx.admin.update({
          where: { id: updatedBaseUser.admin.id },
          data: { permissions }
        });
      }
    }

    // Return the updated user
    return tx.baseUser.findUnique({
      where: { id: userId },
      include: {
        tourist: true,
        guide: {
          include: {
            receivedReviews: true,
            selectedPrograms: true
          }
        },
        admin: true
      }
    });
  });

  return result;
};

export const registerAsGuide = async (userId: number, guideData: any) => {
  // Check if the user exists
  const baseUser = await prisma.baseUser.findUnique({
    where: { id: userId },
    include: {
      guide: true
    }
  });

  if (!baseUser) {
    throw new NotFoundError('User not found');
  }

  // Check if user is already a guide
  if (baseUser.guide) {
    throw new BadRequestError('User is already registered as a guide');
  }

  // Begin transaction to create guide profile
  const result = await prisma.$transaction(async (tx) => {
    // Create guide profile (role will remain as TOURIST until approved)
    const { bio, languages, specialties, phoneNumber, email } = guideData;
    
    const guide = await tx.guide.create({
      data: {
        baseUser: { connect: { id: userId } },
        bio: bio || null,
        languages: languages || [],
        specialties: specialties || [],
        phoneNumber: phoneNumber || null,
        email: email || null,
        isActive: true,
        isApproved: false
      }
    });

    return guide;
  });

  return result;
};

export const updateGuideStatus = async (guideId: number, isActive: boolean) => {
  // Update guide status
  const guide = await prisma.guide.update({
    where: { id: guideId },
    data: { isActive }
  });

  return guide;
};

export const updateGuidePrograms = async (guideId: number, programIds: number[]) => {
  // Validate program IDs
  if (!Array.isArray(programIds)) {
    throw new BadRequestError('Program IDs must be an array');
  }

  // Get the guide
  const guide = await prisma.guide.findUnique({
    where: { id: guideId }
  });

  if (!guide) {
    throw new NotFoundError('Guide not found');
  }

  // Update guide's selected programs
  const result = await prisma.guide.update({
    where: { id: guideId },
    data: {
      selectedPrograms: {
        set: programIds.map(id => ({ id }))
      }
    },
    include: {
      selectedPrograms: true
    }
  });

  return result;
};

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

// Add image to guide profile
export const addGuideImage = async (guideId: number, imageUrl: string) => {
  // Validate inputs
  if (!imageUrl) {
    throw new BadRequestError('Image URL is required');
  }

  // Get guide
  const guide = await prisma.guide.findUnique({
    where: { id: guideId },
    select: { images: true }
  });

  if (!guide) {
    throw new NotFoundError('Guide not found');
  }

  // Add new image to the images array
  const updatedGuide = await prisma.guide.update({
    where: { id: guideId },
    data: {
      images: {
        push: imageUrl
      }
    }
  });

  return updatedGuide;
};

// Remove image from guide profile
export const removeGuideImage = async (guideId: number, imageIndex: number) => {
  // Get guide with images
  const guide = await prisma.guide.findUnique({
    where: { id: guideId },
    select: { images: true }
  });

  if (!guide) {
    throw new NotFoundError('Guide not found');
  }

  // Validate image index
  if (imageIndex < 0 || imageIndex >= guide.images.length) {
    throw new BadRequestError('Invalid image index');
  }

  // Remove the image at the specified index
  const updatedImages = [...guide.images];
  updatedImages.splice(imageIndex, 1);

  // Update guide profile
  const updatedGuide = await prisma.guide.update({
    where: { id: guideId },
    data: {
      images: updatedImages
    }
  });

  return updatedGuide;
};

// Update order of guide images
export const updateGuideImagesOrder = async (guideId: number, newOrder: string[]) => {
  // Get guide with images
  const guide = await prisma.guide.findUnique({
    where: { id: guideId },
    select: { images: true }
  });

  if (!guide) {
    throw new NotFoundError('Guide not found');
  }

  // Validate new order contains all existing images
  if (newOrder.length !== guide.images.length) {
    throw new BadRequestError('New order must contain all existing images');
  }

  // Validate that all images in newOrder are present in the original array
  const originalImagesSet = new Set(guide.images);
  for (const image of newOrder) {
    if (!originalImagesSet.has(image)) {
      throw new BadRequestError('New order contains images that do not exist in the guide profile');
    }
  }

  // Update guide profile with new image order
  const updatedGuide = await prisma.guide.update({
    where: { id: guideId },
    data: {
      images: newOrder
    }
  });

  return updatedGuide;
};

// Approve or reject a guide
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

// Get all pending guide approval requests
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