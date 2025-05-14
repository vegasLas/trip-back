import { Booking, BookingStatus } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';
import { AuthUser, ControllerFunction, IdParams, ApiResponse } from './common';
import { ParsedQs } from 'qs';

// Request Types
export interface CreateBookingRequest extends Request {
  body: {
    programId: number;
    startDate: string | Date;
    numberOfPeople: number;
    guideId: number;  // Added for guide selection
  };
  user: AuthUser;
}

export interface UpdateBookingRequest extends Request {
  body: {
    startDate?: string | Date;
    numberOfPeople?: number;
    status?: BookingStatus;
    guideId?: number;  // Added for guide selection update
  };
  params: {
    id: string;
  };
  user: AuthUser;
}

// Query parameters for filtering bookings
export interface BookingQueryParams extends ParsedQs {
  status?: string;
  startDateFrom?: string;
  startDateTo?: string;
  programId?: string;
  touristId?: string;
  guideId?: string;
  page?: string;
  limit?: string;
  sort?: string;
}

export interface BookingFilterRequest extends Request {
  query: BookingQueryParams;
  user: AuthUser;
}

// Service Types
export interface BookingFilters {
  status?: BookingStatus;
  startDateFrom?: Date;
  startDateTo?: Date;
  programId?: number;
  touristId?: number;
  guideId?: number;
}

export interface BookingData {
  programId: number;
  touristId: number;
  guideId: number;  // Added for guide selection
  startDate: string | Date;
  numberOfPeople: number;
  status?: BookingStatus;
}

// Response Types
export interface BookingResponse extends ApiResponse<Booking | Booking[]> {}

// Controller Types
export type GetBookingsController = (req: BookingFilterRequest, res: Response, next: NextFunction) => Promise<void> | void;
export type GetBookingByIdController = (req: IdParams, res: Response, next: NextFunction) => Promise<void> | void;
export type CreateBookingController = (req: CreateBookingRequest, res: Response, next: NextFunction) => Promise<void> | void;
export type UpdateBookingController = (req: UpdateBookingRequest, res: Response, next: NextFunction) => Promise<void> | void;
export type DeleteBookingController = (req: IdParams, res: Response, next: NextFunction) => Promise<void> | void;
export type GetTouristBookingsController = ControllerFunction;
export type GetGuideBookingsController = ControllerFunction;
export type ConfirmBookingController = (req: IdParams, res: Response, next: NextFunction) => Promise<void> | void;
export type CancelBookingController = (req: IdParams, res: Response, next: NextFunction) => Promise<void> | void; 