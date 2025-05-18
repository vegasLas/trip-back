import { BaseUser, Guide, Tourist, Admin, AdminPermission } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';
import { AuthUser, ControllerFunction, IdParams, ApiResponse } from './common';

// Request Types
export interface CreateUserRequest extends Request {
  body: {
    telegramId: string;
    firstName: string;
    lastName?: string;
    username?: string;
    languageCode?: string;
    role: 'tourist' | 'guide' | 'both' | 'admin';
  };
}

export interface UpdateUserRequest extends Request {
  body: {
    firstName?: string;
    lastName?: string;
    username?: string;
    languageCode?: string;
  };
  params: {
    id: string;
  };
  user: AuthUser;
}

export interface UpdateGuideRequest extends Request {
  body: {
    bio?: string;
    phoneNumber?: string;
    email?: string;
    images?: string[];
    isActive?: boolean;
  };
  params: {
    id: string;
  };
  user: AuthUser;
}

export interface CreateAdminRequest extends Request {
  body: {
    telegramId: string;
    firstName: string;
    lastName?: string;
    username?: string;
    permissions: AdminPermission[];
  };
  user: AuthUser;
}

export interface UpdateAdminRequest extends Request {
  body: {
    permissions?: AdminPermission[];
  };
  params: {
    id: string;
  };
  user: AuthUser;
}

export interface UserQueryParams extends Request {
  query: {
    role?: string;
    isActive?: string;
    search?: string;
    page?: string;
    limit?: string;
    sort?: string;
  };
}

// Response Types
export interface UserResponse extends ApiResponse<BaseUser | (BaseUser & { tourist?: Tourist; guide?: Guide; admin?: Admin })> {}

// Service Types
export interface UserData {
  telegramId: string;
  firstName: string;
  lastName?: string;
  username?: string;
  languageCode?: string;
}

export interface GuideData {
  bio?: string;
  phoneNumber?: string;
  email?: string;
  isActive?: boolean;
}

export interface AdminData {
  permissions: AdminPermission[];
}

// Controller Types
export type GetUsersController = ControllerFunction;
export type GetUserByIdController = (req: IdParams, res: Response, next: NextFunction) => Promise<void> | void;
export type CreateUserController = (req: CreateUserRequest, res: Response, next: NextFunction) => Promise<void> | void;
export type UpdateUserController = (req: UpdateUserRequest, res: Response, next: NextFunction) => Promise<void> | void;
export type DeleteUserController = (req: IdParams, res: Response, next: NextFunction) => Promise<void> | void;
export type GetProfileController = ControllerFunction;
export type UpdateGuideProfileController = (req: UpdateGuideRequest, res: Response, next: NextFunction) => Promise<void> | void;
export type GetGuidesController = ControllerFunction;
export type GetTouristsController = ControllerFunction;
export type GetAdminsController = ControllerFunction;
export type CreateAdminController = (req: CreateAdminRequest, res: Response, next: NextFunction) => Promise<void> | void;
export type UpdateAdminController = (req: UpdateAdminRequest, res: Response, next: NextFunction) => Promise<void> | void;

export interface ManageGuideImagesRequest extends Request {
  body: {
    images?: string[];
  };
  params: {
    id?: string;
    imageIndex?: string; // For removing a specific image
  };
  user: AuthUser;
  file?: any; // Simplified file type
  files?: any[]; // Simplified files type
}

export type RemoveGuideImageController = (req: ManageGuideImagesRequest, res: Response, next: NextFunction) => Promise<void> | void; 