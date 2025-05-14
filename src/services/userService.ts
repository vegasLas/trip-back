import prisma from './prismaService';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors';

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
              imageUrls: true,
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
          avatarUrl: true,
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
              imageUrls: true,
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
          guide: true
        }
      });
    } else {
      updatedBaseUser = await tx.baseUser.findUnique({
        where: { id: userId },
        include: {
          tourist: true,
          guide: true
        }
      });
    }

    if (!updatedBaseUser) {
      throw new NotFoundError('User not found');
    }

    // Update guide-specific data if user is a guide
    if (updatedBaseUser.guide && roleSpecificData.guide) {
      const { bio, languages, specialties, phoneNumber, email, avatarUrl } = roleSpecificData.guide;
      
      const guideUpdate: any = {};
      if (bio !== undefined) guideUpdate.bio = bio;
      if (languages !== undefined) guideUpdate.languages = languages;
      if (specialties !== undefined) guideUpdate.specialties = specialties;
      if (phoneNumber !== undefined) guideUpdate.phoneNumber = phoneNumber;
      if (email !== undefined) guideUpdate.email = email;
      if (avatarUrl !== undefined) guideUpdate.avatarUrl = avatarUrl;
      
      if (Object.keys(guideUpdate).length > 0) {
        await tx.guide.update({
          where: { id: updatedBaseUser.guide.id },
          data: guideUpdate
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
        }
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

  // Create guide profile
  const { bio, languages, specialties, phoneNumber, email, avatarUrl } = guideData;
  
  const guide = await prisma.guide.create({
    data: {
      baseUser: { connect: { id: userId } },
      bio: bio || null,
      languages: languages || [],
      specialties: specialties || [],
      phoneNumber: phoneNumber || null,
      email: email || null,
      avatarUrl: avatarUrl || null,
      isActive: true
    }
  });

  return guide;
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