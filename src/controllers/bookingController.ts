import { Request, Response } from 'express';
import * as bookingService from '../services/bookingService';
import { catchAsync } from '../utils/catchAsync';
import { BadRequestError, ForbiddenError } from '../utils/errors';

// List user bookings
export const getUserBookings = catchAsync(async (req: Request, res: Response) => {
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
export const getBookingById = catchAsync(async (req: Request, res: Response) => {
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
export const createBooking = catchAsync(async (req: Request, res: Response) => {
  if (!req.user || !req.user.isTourist) {
    throw new ForbiddenError('Only tourists can create bookings');
  }
  
  // TODO: Get tourist ID from user ID
  const touristId = 1; // This is a placeholder
  
  const booking = await bookingService.createBooking(touristId, req.body);
  
  res.status(201).json({
    status: 'success',
    data: booking
  });
});

// Update booking status
export const updateBookingStatus = catchAsync(async (req: Request, res: Response) => {
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
export const cancelBooking = catchAsync(async (req: Request, res: Response) => {
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