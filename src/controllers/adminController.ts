import { Request, Response } from 'express';
import * as userService from '../services/userService';
import { catchAsync } from '../utils/catchAsync';
import { BadRequestError, ForbiddenError } from '../utils/errors';
import {
  CreateAdminRequest,
  UpdateAdminRequest,
  IdParams
} from '../types';
import * as programService from '../services/programService';

// Get all admin users
export const getAllAdmins = catchAsync(async (req: Request, res: Response) => {
  if (!req.user || !req.user.isAdmin) {
    throw new ForbiddenError('Only admins can access admin user list');
  }
  
  const admins = await userService.getAllAdmins();
  
  res.status(200).json({
    status: 'success',
    results: admins.length,
    data: admins
  });
});

// Get admin by ID
export const getAdminById = catchAsync(async (req: IdParams, res: Response) => {
  if (!req.user || !req.user.isAdmin) {
    throw new ForbiddenError('Only admins can access admin details');
  }
  
  const adminId = parseInt(req.params.id);
  
  if (isNaN(adminId)) {
    throw new BadRequestError('Invalid admin ID');
  }
  
  const admin = await userService.getAdminById(adminId);
  
  res.status(200).json({
    status: 'success',
    data: admin
  });
});

// Create new admin user
export const createAdmin = catchAsync(async (req: CreateAdminRequest, res: Response) => {
  if (!req.user || !req.user.isSuperAdmin) {
    throw new ForbiddenError('Only existing admins can create new admin users');
  }
  
  const { telegramId, firstName, lastName, username, permissions } = req.body;
  
  // Create the admin user
  const newAdmin = await userService.createAdmin({
    telegramId,
    firstName,
    lastName,
    username,
    permissions
  });
  
  res.status(201).json({
    status: 'success',
    data: newAdmin
  });
});

// Update admin permissions
export const updateAdmin = catchAsync(async (req: UpdateAdminRequest, res: Response) => {
  if (!req.user || !req.user.isSuperAdmin) {
    throw new ForbiddenError('Only super admins can update admin users');
  }
  
  const adminId = parseInt(req.params.id);
  
  if (isNaN(adminId)) {
    throw new BadRequestError('Invalid admin ID');
  }
  
  const { permissions } = req.body;
  if (!permissions) {
    throw new BadRequestError('Permissions are required');
  }
  const updatedAdmin = await userService.updateAdminPermissions(adminId, permissions);
  
  res.status(200).json({
    status: 'success',
    data: updatedAdmin
  });
});

// Delete admin user
export const deleteAdmin = catchAsync(async (req: IdParams, res: Response) => {
  if (!req.user || !req.user.isSuperAdmin) {
    throw new ForbiddenError('Only super admins can delete admin users');
  }
  
  
  const adminId = parseInt(req.params.id);
  
  if (isNaN(adminId)) {
    throw new BadRequestError('Invalid admin ID');
  }
  
  await userService.deleteAdmin(adminId);
  
  res.status(204).send();
});

/**
 * Create a new program as an admin
 */
export const createProgram = async (req: Request, res: Response) => {
  try {
    // Ensure user is an admin (this should be handled by middleware)
    if (!req.user || !['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
      throw new BadRequestError('Unauthorized: Only admins can create programs directly');
    }

    const program = await programService.createProgramByAdmin(req.body);
    
    res.status(201).json({
      success: true,
      data: program
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Error creating program'
    });
  }
};

/**
 * Handles approval of program recommendations
 */
export const updateRecommendationStatus = async (req: Request, res: Response) => {
  try {
    const { recommendationId } = req.params;
    const { status, adminComment } = req.body;
    
    // Ensure valid status
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      throw new BadRequestError('Invalid status. Must be APPROVED or REJECTED');
    }
    
    const recommendation = await programService.updateRecommendationStatus(
      Number(recommendationId),
      status as 'APPROVED' | 'REJECTED',
      adminComment
    );
    
    res.status(200).json({
      success: true,
      data: recommendation
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Error updating recommendation status'
    });
  }
};

/**
 * Get all program recommendations
 */
export const getAllRecommendations = async (_: Request, res: Response) => {
  try {
    const recommendations = await programService.getAllProgramRecommendations();
    
    res.status(200).json({
      success: true,
      data: recommendations
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Error fetching recommendations'
    });
  }
}; 