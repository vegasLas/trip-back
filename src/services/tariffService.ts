import prisma from './prismaService';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors';

export const getProgramTariffs = async (programId: number) => {
  // Check if program exists
  const program = await prisma.program.findUnique({
    where: { id: programId },
    select: { id: true }
  });
  
  if (!program) {
    throw new NotFoundError('Program not found');
  }
  
  // Get all pricing tiers for the program
  const pricingTiers = await prisma.pricingTier.findMany({
    where: { programId },
    orderBy: [
      { minPeople: 'asc' },
      { pricePerPerson: 'asc' }
    ]
  });
  
  return pricingTiers;
};

export const createProgramTariff = async (programId: number, guideId: number, tariffData: any) => {
  // Check if program exists and belongs to the guide
  const program = await prisma.program.findFirst({
    where: { 
      id: programId,
      guideId
    },
    select: { id: true }
  });
  
  if (!program) {
    throw new NotFoundError('Program not found or you are not authorized to add pricing tiers to it');
  }
  
  // Validate tariff data
  const { title, description, minPeople, maxPeople, pricePerPerson } = tariffData;
  
  if (!title || !minPeople || !maxPeople || !pricePerPerson) {
    throw new BadRequestError('Title, minimum people, maximum people, and price per person are required');
  }
  
  // Validate numerical values
  const min = parseInt(minPeople);
  const max = parseInt(maxPeople);
  const price = parseFloat(pricePerPerson);
  
  if (isNaN(min) || isNaN(max) || isNaN(price)) {
    throw new BadRequestError('People counts and price must be valid numbers');
  }
  
  if (min < 1) {
    throw new BadRequestError('Minimum people must be at least 1');
  }
  
  if (max < min) {
    throw new BadRequestError('Maximum people must be greater than or equal to minimum people');
  }
  
  if (price <= 0) {
    throw new BadRequestError('Price per person must be greater than 0');
  }
  
  // Check for overlapping tiers
  const existingTiers = await prisma.pricingTier.findMany({
    where: { programId }
  });
  
  for (const tier of existingTiers) {
    if ((min <= tier.maxPeople && max >= tier.minPeople)) {
      throw new BadRequestError(
        `This tier overlaps with existing tier "${tier.title}" (${tier.minPeople}-${tier.maxPeople} people)`
      );
    }
  }
  
  // Create the pricing tier
  const pricingTier = await prisma.pricingTier.create({
    data: {
      programId,
      title,
      description: description || '',
      minPeople: min,
      maxPeople: max,
      pricePerPerson: price,
      isActive: true
    }
  });
  
  return pricingTier;
};

export const updateProgramTariff = async (tariffId: number, guideId: number, updateData: any) => {
  // Check if pricing tier exists
  const pricingTier = await prisma.pricingTier.findUnique({
    where: { id: tariffId },
    include: {
      program: {
        select: {
          guideId: true
        }
      }
    }
  });
  
  if (!pricingTier) {
    throw new NotFoundError('Pricing tier not found');
  }
  
  // Check if guide owns the program
  if (pricingTier.program.guideId !== guideId) {
    throw new ForbiddenError('You are not authorized to update this pricing tier');
  }
  
  // Extract updatable fields
  const { title, description, minPeople, maxPeople, pricePerPerson } = updateData;
  
  // Prepare update object
  const updateObj: any = {};
  if (title !== undefined) updateObj.title = title;
  if (description !== undefined) updateObj.description = description;
  
  // Handle numerical values
  let min = pricingTier.minPeople;
  let max = pricingTier.maxPeople;
  let price = pricingTier.pricePerPerson;
  
  if (minPeople !== undefined) {
    min = parseInt(minPeople);
    if (isNaN(min) || min < 1) {
      throw new BadRequestError('Minimum people must be at least 1');
    }
    updateObj.minPeople = min;
  }
  
  if (maxPeople !== undefined) {
    max = parseInt(maxPeople);
    if (isNaN(max)) {
      throw new BadRequestError('Maximum people must be a valid number');
    }
    updateObj.maxPeople = max;
  }
  
  if (pricePerPerson !== undefined) {
    price = parseFloat(pricePerPerson);
    if (isNaN(price) || price <= 0) {
      throw new BadRequestError('Price per person must be greater than 0');
    }
    updateObj.pricePerPerson = price;
  }
  
  // Validate min/max relationship
  if (min > max) {
    throw new BadRequestError('Maximum people must be greater than or equal to minimum people');
  }
  
  // Check for overlapping tiers
  const existingTiers = await prisma.pricingTier.findMany({
    where: { 
      programId: pricingTier.programId,
      id: { not: tariffId }
    }
  });
  
  for (const tier of existingTiers) {
    if ((min <= tier.maxPeople && max >= tier.minPeople)) {
      throw new BadRequestError(
        `This tier would overlap with existing tier "${tier.title}" (${tier.minPeople}-${tier.maxPeople} people)`
      );
    }
  }
  
  // Update the pricing tier
  const updatedTier = await prisma.pricingTier.update({
    where: { id: tariffId },
    data: updateObj
  });
  
  return updatedTier;
};

export const deleteProgramTariff = async (tariffId: number, guideId: number) => {
  // Check if pricing tier exists
  const pricingTier = await prisma.pricingTier.findUnique({
    where: { id: tariffId },
    include: {
      program: {
        select: {
          guideId: true
        }
      },
      _count: {
        select: { bookings: true }
      }
    }
  });
  
  if (!pricingTier) {
    throw new NotFoundError('Pricing tier not found');
  }
  
  // Check if guide owns the program
  if (pricingTier.program.guideId !== guideId) {
    throw new ForbiddenError('You are not authorized to delete this pricing tier');
  }
  
  // Check if the tier has associated bookings
  if (pricingTier._count.bookings > 0) {
    throw new BadRequestError('Cannot delete a pricing tier that has associated bookings');
  }
  
  // Delete the pricing tier
  await prisma.pricingTier.delete({
    where: { id: tariffId }
  });
  
  return { success: true };
};

export const toggleTariffStatus = async (tariffId: number, guideId: number) => {
  // Check if pricing tier exists
  const pricingTier = await prisma.pricingTier.findUnique({
    where: { id: tariffId },
    include: {
      program: {
        select: {
          guideId: true
        }
      }
    }
  });
  
  if (!pricingTier) {
    throw new NotFoundError('Pricing tier not found');
  }
  
  // Check if guide owns the program
  if (pricingTier.program.guideId !== guideId) {
    throw new ForbiddenError('You are not authorized to update this pricing tier');
  }
  
  // Toggle the active status
  const updatedTier = await prisma.pricingTier.update({
    where: { id: tariffId },
    data: { isActive: !pricingTier.isActive }
  });
  
  return updatedTier;
}; 