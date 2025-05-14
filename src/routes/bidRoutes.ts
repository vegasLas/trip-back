import { Router } from 'express';
import * as bidController from '../controllers/bidController';
import { validateTelegramAuth, requireTourist, requireGuide } from '../middlewares/auth';

const router = Router();

// Get bids for an auction - public route
router.get('/auction/:auctionId', bidController.getAuctionBids);

// Protected routes - authentication required
router.use(validateTelegramAuth);

// Tourist routes - manage own bids
router.get('/tourist', requireTourist, bidController.getTouristBids);
router.post('/', requireTourist, bidController.createBid);
router.delete('/:id', requireTourist, bidController.cancelBid);

// Guide routes - view bids on own auctions
router.get('/guide/auction/:auctionId', requireGuide, bidController.getGuideAuctionBids);
router.get('/guide/highest', requireGuide, bidController.getHighestBidsForGuideAuctions);

export default router; 