import prisma from './prismaService';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors';

export const getProgramPoints = async (programId: number, dayId: number) => {
  // Check if program and day exist
  const day = await prisma.programDay.findFirst({
    where: { 
      id: dayId,
      programId
    },
    select: { id: true }
  });
  
  if (!day) {
    throw new NotFoundError('Program day not found');
  }
  
  // Get all points for the day
  const points = await prisma.programPoint.findMany({
    where: { programDayId: dayId },
    orderBy: { order: 'asc' }
  });
  
  return points;
};

export const createProgramPoint = async (programId: number, dayId: number, guideId: number, pointData: any) => {
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
    throw new ForbiddenError('You are not authorized to add points to this program');
  }
  
  // Check if day exists and belongs to the program
  const day = await prisma.programDay.findFirst({
    where: { 
      id: dayId,
      programId
    },
    select: { id: true }
  });
  
  if (!day) {
    throw new NotFoundError('Program day not found');
  }
  
  // Validate point data
  const { title, description, pointType, order, duration, location, imageUrl } = pointData;
  
  if (!title) {
    throw new BadRequestError('Point title is required');
  }
  
  // Get the highest current order value to set new point at the end
  let nextOrder = order;
  if (!nextOrder) {
    const highestOrderPoint = await prisma.programPoint.findFirst({
      where: { programDayId: dayId },
      orderBy: { order: 'desc' },
      select: { order: true }
    });
    
    nextOrder = highestOrderPoint ? highestOrderPoint.order + 1 : 1;
  }
  
  // Create the point
  const point = await prisma.programPoint.create({
    data: {
      programDayId: dayId,
      title,
      description,
      pointType: pointType || 'ACTIVITY',
      order: nextOrder,
      duration: duration ? parseInt(duration) : null,
      location,
      imageUrl
    }
  });
  
  return point;
};

export const updateProgramPoint = async (programId: number, dayId: number, pointId: number, guideId: number, updateData: any) => {
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
    throw new ForbiddenError('You are not authorized to update points in this program');
  }
  
  // Check if day exists and belongs to the program
  const day = await prisma.programDay.findFirst({
    where: { 
      id: dayId,
      programId
    },
    select: { id: true }
  });
  
  if (!day) {
    throw new NotFoundError('Program day not found');
  }
  
  // Check if point exists and belongs to the day
  const point = await prisma.programPoint.findFirst({
    where: { 
      id: pointId,
      programDayId: dayId
    }
  });
  
  if (!point) {
    throw new NotFoundError('Program point not found');
  }
  
  // Extract updatable fields
  const { title, description, pointType, order, duration, location, imageUrl } = updateData;
  
  // Build update object
  const updateObj: any = {};
  if (title !== undefined) updateObj.title = title;
  if (description !== undefined) updateObj.description = description;
  if (pointType !== undefined) updateObj.pointType = pointType;
  if (order !== undefined) updateObj.order = parseInt(order);
  if (duration !== undefined) updateObj.duration = duration ? parseInt(duration) : null;
  if (location !== undefined) updateObj.location = location;
  if (imageUrl !== undefined) updateObj.imageUrl = imageUrl;
  
  // Update the point
  const updatedPoint = await prisma.programPoint.update({
    where: { id: pointId },
    data: updateObj
  });
  
  return updatedPoint;
};

export const deleteProgramPoint = async (programId: number, dayId: number, pointId: number, guideId: number) => {
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
    throw new ForbiddenError('You are not authorized to delete points from this program');
  }
  
  // Check if day exists and belongs to the program
  const day = await prisma.programDay.findFirst({
    where: { 
      id: dayId,
      programId
    },
    select: { id: true }
  });
  
  if (!day) {
    throw new NotFoundError('Program day not found');
  }
  
  // Check if point exists and belongs to the day
  const point = await prisma.programPoint.findFirst({
    where: { 
      id: pointId,
      programDayId: dayId
    }
  });
  
  if (!point) {
    throw new NotFoundError('Program point not found');
  }
  
  // Delete the point
  await prisma.programPoint.delete({
    where: { id: pointId }
  });
  
  return { success: true };
}; 