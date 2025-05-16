import { Router } from 'express';
import userRoutes from './userRoutes';
import programRoutes from './programRoutes';
import bookingRoutes from './bookingRoutes';
import reviewRoutes from './reviewRoutes';
import auctionRoutes from './auctionRoutes';
import bidRoutes from './bidRoutes';
import paymentRoutes from './paymentRoutes';
import tariffRoutes from './tariffRoutes';
import adminRoutes from './adminRoutes';

const router = Router();

// Mount all routes
router.use('/users', userRoutes);
router.use('/programs', programRoutes);
router.use('/bookings', bookingRoutes);
router.use('/reviews', reviewRoutes);
router.use('/auctions', auctionRoutes);
router.use('/bids', bidRoutes);
router.use('/payments', paymentRoutes);
router.use('/tariffs', tariffRoutes);
router.use('/admins', adminRoutes);

export default router; 