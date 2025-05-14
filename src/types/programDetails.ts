import { ProgramDay, ProgramPoint, PointType } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';
import { AuthUser, ControllerFunction, IdParams, ApiResponse } from './common';

// Program Day Types
export interface CreateProgramDayRequest extends Request {
  body: {
    programId: number;
    dayNumber: number;
    title?: string;
    description?: string;
  };
  user: AuthUser;
}

export interface UpdateProgramDayRequest extends Request {
  body: {
    dayNumber?: number;
    title?: string;
    description?: string;
  };
  params: {
    id: string;
  };
  user: AuthUser;
}

export interface ProgramDayData {
  programId: number;
  dayNumber: number;
  title?: string;
  description?: string;
}

export interface ProgramDayResponse extends ApiResponse<ProgramDay | ProgramDay[]> {}

// Program Point Types
export interface CreateProgramPointRequest extends Request {
  body: {
    programDayId: number;
    title: string;
    description?: string;
    pointType?: PointType;
    order: number;
    duration?: number;
    location?: string;
    imageUrl?: string;
  };
  user: AuthUser;
}

export interface UpdateProgramPointRequest extends Request {
  body: {
    title?: string;
    description?: string;
    pointType?: PointType;
    order?: number;
    duration?: number;
    location?: string;
    imageUrl?: string;
  };
  params: {
    id: string;
  };
  user: AuthUser;
}

export interface ProgramPointData {
  programDayId: number;
  title: string;
  description?: string;
  pointType?: PointType;
  order: number;
  duration?: number;
  location?: string;
  imageUrl?: string;
}

export interface ProgramPointResponse extends ApiResponse<ProgramPoint | ProgramPoint[]> {}

// Controller Types - Program Day
export type GetProgramDaysController = ControllerFunction;
export type GetProgramDayByIdController = (req: IdParams, res: Response, next: NextFunction) => Promise<void> | void;
export type CreateProgramDayController = (req: CreateProgramDayRequest, res: Response, next: NextFunction) => Promise<void> | void;
export type UpdateProgramDayController = (req: UpdateProgramDayRequest, res: Response, next: NextFunction) => Promise<void> | void;
export type DeleteProgramDayController = (req: IdParams, res: Response, next: NextFunction) => Promise<void> | void;

// Controller Types - Program Point
export type GetProgramPointsController = ControllerFunction;
export type GetProgramPointByIdController = (req: IdParams, res: Response, next: NextFunction) => Promise<void> | void;
export type CreateProgramPointController = (req: CreateProgramPointRequest, res: Response, next: NextFunction) => Promise<void> | void;
export type UpdateProgramPointController = (req: UpdateProgramPointRequest, res: Response, next: NextFunction) => Promise<void> | void;
export type DeleteProgramPointController = (req: IdParams, res: Response, next: NextFunction) => Promise<void> | void;
export type ReorderProgramPointsController = (
  req: Request & { body: { points: { id: number; order: number }[] } }, 
  res: Response, 
  next: NextFunction
) => Promise<void> | void; 