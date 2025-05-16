import { Program, BookingType } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';
import { AuthUser, ControllerFunction, IdParams, ApiResponse, PaginationQuery } from './common';
import { ParsedQs } from 'qs';

// Request Types
export interface CreateProgramRequest extends Request {
  body: {
    title: string;
    description: string;
    basePrice: number;
    durationDays: number;
    maxGroupSize: number;
    startLocation: string;
    regions?: string[];
    tags?: string[];
    images?: string[];
    bookingType?: BookingType;
    isActive?: boolean;
  };
  user: AuthUser;
}

export interface UpdateProgramRequest extends Request {
  body: {
    title?: string;
    description?: string;
    basePrice?: number;
    durationDays?: number;
    maxGroupSize?: number;
    startLocation?: string;
    regions?: string[];
    tags?: string[];
    images?: string[];
    bookingType?: BookingType;
    isActive?: boolean;
    isApproved?: boolean;
  };
  params: {
    id: string;
  };
  user: AuthUser;
}

// Query parameters for filtering programs
export interface ProgramQueryParams extends ParsedQs {
  title?: string;
  guideId?: string;
  minPrice?: string;
  maxPrice?: string;
  durationDays?: string;
  regions?: string;
  tags?: string;
  isActive?: string;
  isApproved?: string;
  bookingType?: string;
  page?: string;
  limit?: string;
  sort?: string;
}

export interface ProgramFilterRequest extends Request {
  query: ProgramQueryParams;
  user?: AuthUser;
}

// Service Types
export interface ProgramData {
  title: string;
  description: string;
  guideId: number;
  basePrice: number;
  durationDays: number;
  maxGroupSize: number;
  startLocation: string;
  regions?: string[];
  tags?: string[];
  images?: string[];
  bookingType?: BookingType;
  isActive?: boolean;
  isApproved?: boolean;
}

export interface ProgramFilters {
  title?: string;
  guideId?: number;
  minPrice?: number;
  maxPrice?: number;
  durationDays?: number;
  regions?: string[];
  tags?: string[];
  isActive?: boolean;
  isApproved?: boolean;
  bookingType?: BookingType;
}

// Response Types
export interface ProgramResponse extends ApiResponse<Program | Program[]> {}

// Controller Types
export type GetProgramsController = (req: ProgramFilterRequest, res: Response, next: NextFunction) => Promise<void> | void;
export type GetProgramByIdController = (req: IdParams, res: Response, next: NextFunction) => Promise<void> | void;
export type CreateProgramController = (req: CreateProgramRequest, res: Response, next: NextFunction) => Promise<void> | void;
export type UpdateProgramController = (req: UpdateProgramRequest, res: Response, next: NextFunction) => Promise<void> | void;
export type DeleteProgramController = (req: IdParams, res: Response, next: NextFunction) => Promise<void> | void;
export type GetGuideProgramsController = ControllerFunction;
export type ApproveProgramController = (req: IdParams, res: Response, next: NextFunction) => Promise<void> | void;
export type SelectProgramController = (req: IdParams, res: Response, next: NextFunction) => Promise<void> | void; 