import { Request, Response } from 'express';
import * as bookingService from '../services/bookingService';
import * as userService from '../services/userService';
import { catchAsync } from '../utils/catchAsync';
import { BadRequestError, ForbiddenError } from '../utils/errors';
import {
  GetTouristBookingsController,
  GetBookingByIdController,
  CreateBookingController,
  UpdateBookingController,
  CancelBookingController,
  IdParams,
  CreateBookingRequest,
  UpdateBookingRequest
} from '../types';

// Helper function to get tourist ID from user ID
const getTouristIdFromUser = async (userId: number): Promise<number> => {
  const user = await userService.getUserProfile(userId);
  if (!user.tourist) {
    throw new BadRequestError('User is not a tourist');
  }
  return user.tourist.id;
};

// List user bookings
export const getUserBookings: GetTouristBookingsController = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }
  
  const bookings = await bookingService.getUserBookings(
    req.user.id,
    req.user.isTourist || false
  );
  
  res.status(200).json({
    status: 'success',
    results: bookings.length,
    data: bookings
  });
});

// Get booking details
export const getBookingById: GetBookingByIdController = catchAsync(async (req: IdParams, res: Response) => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }
  
  const bookingId = parseInt(req.params.id);
  
  if (isNaN(bookingId)) {
    throw new BadRequestError('Invalid booking ID');
  }
  
  const booking = await bookingService.getBookingById(
    bookingId,
    req.user.id,
    req.user.isTourist || false,
    req.user.isGuide || false
  );
  
  res.status(200).json({
    status: 'success',
    data: booking
  });
});

// Create new booking
export const createBooking: CreateBookingController = catchAsync(async (req: CreateBookingRequest, res: Response) => {
  if (!req.user || !req.user.isTourist) {
    throw new ForbiddenError('Only tourists can create bookings');
  }
  
  // Get tourist ID from user ID
  const touristId = await getTouristIdFromUser(req.user.id);
  
  const booking = await bookingService.createBooking(touristId, req.body);
  
  res.status(201).json({
    status: 'success',
    data: booking
  });
});

// Update booking status
export const updateBookingStatus: UpdateBookingController = catchAsync(async (req: UpdateBookingRequest, res: Response) => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }
  
  const bookingId = parseInt(req.params.id);
  
  if (isNaN(bookingId)) {
    throw new BadRequestError('Invalid booking ID');
  }
  
  const booking = await bookingService.updateBookingStatus(
    bookingId,
    req.user.id,
    req.user.isGuide || false,
    req.user.isTourist || false,
    req.body
  );
  
  res.status(200).json({
    status: 'success',
    data: booking
  });
});

// Cancel booking
export const cancelBooking: CancelBookingController = catchAsync(async (req: IdParams, res: Response) => {
  if (!req.user || !req.user.isTourist) {
    throw new ForbiddenError('Only tourists can cancel bookings');
  }
  
  const bookingId = parseInt(req.params.id);
  
  if (isNaN(bookingId)) {
    throw new BadRequestError('Invalid booking ID');
  }
  
  await bookingService.cancelBooking(
    bookingId,
    req.user.id,
    req.user.isTourist
  );
  
  res.status(200).json({
    status: 'success',
    message: 'Booking cancelled successfully'
  });
}); 