import { Router } from 'express';
import * as bookingController from '../controllers/bookingController';
import { validateTelegramAuth, requireTourist } from '../middlewares/auth';

const router = Router();

// All booking routes require authentication
router.use(validateTelegramAuth);

// GET /api/bookings - List user bookings
router.get('/', bookingController.getUserBookings);

// GET /api/bookings/:id - Get booking details
router.get('/:id', bookingController.getBookingById);

// POST /api/bookings - Create new booking (tourist only)
router.post('/', requireTourist, bookingController.createBooking);

// PUT /api/bookings/:id - Update booking status
router.put('/:id', bookingController.updateBookingStatus);

// DELETE /api/bookings/:id - Cancel booking (tourist only)
router.delete('/:id', requireTourist, bookingController.cancelBooking);

export default router; 