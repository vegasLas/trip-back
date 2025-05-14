import prisma from './prismaService';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors';

export const getProgramDays = async (programId: number) => {
  // Check if program exists
  const program = await prisma.program.findUnique({
    where: { 
      id: programId,
      isActive: true
    },
    select: { id: true }
  });
  
  if (!program) {
    throw new NotFoundError('Program not found');
  }
  
  // Get all days for the program
  const days = await prisma.programDay.findMany({
    where: { programId },
    include: {
      _count: {
        select: { points: true }
      }
    },
    orderBy: { dayNumber: 'asc' }
  });
  
  return days;
};

export const getProgramDayById = async (programId: number, dayId: number) => {
  // Check if program exists
  const program = await prisma.program.findUnique({
    where: { 
      id: programId,
      isActive: true
    },
    select: { id: true }
  });
  
  if (!program) {
    throw new NotFoundError('Program not found');
  }
  
  // Get the specific day with its points
  const day = await prisma.programDay.findFirst({
    where: { 
      id: dayId,
      programId
    },
    include: {
      points: {
        orderBy: { order: 'asc' }
      }
    }
  });
  
  if (!day) {
    throw new NotFoundError('Day not found');
  }
  
  return day;
};

export const createProgramDay = async (programId: number, guideId: number, dayData: any) => {
  // Check if program exists and guide is the owner
  const program = await prisma.program.findUnique({
    where: { id: programId },
    select: { 
      id: true,
      guideId: true
    }
  });
  
  if (!program) {
    throw new NotFoundError('Program not found');
  }
  
  if (program.guideId !== guideId) {
    throw new ForbiddenError('You are not authorized to add days to this program');
  }
  
  // Validate day data
  const { title, description, dayNumber } = dayData;
  
  if (!dayNumber || isNaN(parseInt(dayNumber))) {
    throw new BadRequestError('Day number is required and must be a number');
  }
  
  // Check if a day with this number already exists
  const existingDay = await prisma.programDay.findFirst({
    where: {
      programId,
      dayNumber: parseInt(dayNumber)
    }
  });
  
  if (existingDay) {
    throw new BadRequestError(`Day number ${dayNumber} already exists for this program`);
  }
  
  // Create the day
  const day = await prisma.programDay.create({
    data: {
      programId,
      dayNumber: parseInt(dayNumber),
      title,
      description
    }
  });
  
  return day;
};

export const updateProgramDay = async (programId: number, dayId: number, guideId: number, updateData: any) => {
  // Check if program exists and guide is the owner
  const program = await prisma.program.findUnique({
    where: { id: programId },
    select: { 
      id: true,
      guideId: true
    }
  });
  
  if (!program) {
    throw new NotFoundError('Program not found');
  }
  
  if (program.guideId !== guideId) {
    throw new ForbiddenError('You are not authorized to update days for this program');
  }
  
  // Check if the day exists and belongs to the program
  const day = await prisma.programDay.findFirst({
    where: { 
      id: dayId,
      programId
    }
  });
  
  if (!day) {
    throw new NotFoundError('Day not found');
  }
  
  // Extract updatable fields
  const { title, description, dayNumber } = updateData;
  
  // Build update object
  const updateObj: any = {};
  if (title !== undefined) updateObj.title = title;
  if (description !== undefined) updateObj.description = description;
  
  if (dayNumber !== undefined) {
    // Check if a different day with this number already exists
    const existingDay = await prisma.programDay.findFirst({
      where: {
        programId,
        dayNumber: parseInt(dayNumber),
        id: { not: dayId }
      }
    });
    
    if (existingDay) {
      throw new BadRequestError(`Day number ${dayNumber} already exists for this program`);
    }
    
    updateObj.dayNumber = parseInt(dayNumber);
  }
  
  // Update the day
  const updatedDay = await prisma.programDay.update({
    where: { id: dayId },
    data: updateObj,
    include: {
      points: {
        orderBy: { order: 'asc' }
      }
    }
  });
  
  return updatedDay;
};

export const deleteProgramDay = async (programId: number, dayId: number, guideId: number) => {
  // Check if program exists and guide is the owner
  const program = await prisma.program.findUnique({
    where: { id: programId },
    select: { 
      id: true,
      guideId: true
    }
  });
  
  if (!program) {
    throw new NotFoundError('Program not found');
  }
  
  if (program.guideId !== guideId) {
    throw new ForbiddenError('You are not authorized to delete days from this program');
  }
  
  // Check if the day exists and belongs to the program
  const day = await prisma.programDay.findFirst({
    where: { 
      id: dayId,
      programId
    }
  });
  
  if (!day) {
    throw new NotFoundError('Day not found');
  }
  
  // Delete the day (this will cascade delete all points)
  await prisma.programDay.delete({
    where: { id: dayId }
  });
  
  return { success: true };
}; 