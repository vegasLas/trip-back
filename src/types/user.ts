import { BaseUser, Guide, Tourist } from '@prisma/client';
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
    role: 'tourist' | 'guide' | 'both';
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
    languages?: string[];
    specialties?: string[];
    phoneNumber?: string;
    email?: string;
    avatarUrl?: string;
    isActive?: boolean;
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
export interface UserResponse extends ApiResponse<BaseUser | (BaseUser & { tourist?: Tourist; guide?: Guide })> {}

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
  languages?: string[];
  specialties?: string[];
  phoneNumber?: string;
  email?: string;
  avatarUrl?: string;
  isActive?: boolean;
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