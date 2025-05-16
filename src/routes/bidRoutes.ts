import { Router } from 'express';
import * as bidController from '../controllers/bidController';
import { validateTelegramAuth, requireTourist, requireGuide } from '../middlewares/auth';

const router = Router();

// Get bids for an auction - public route
router.get('/auction/:auctionId', bidController.getAuctionBids);

// Protected routes - authentication required
router.use(validateTelegramAuth);

// Tourist routes - manage auctions and view their bids
router.get('/tourist', requireTourist, bidController.getTouristBids);
router.get('/tourist/highest', requireTourist, bidController.getHighestBidsForGuideAuctions);

// Guide routes - manage bids 
router.post('/', requireGuide, bidController.createBid);
router.delete('/:id', requireGuide, bidController.cancelBid);
router.get('/guide/auction/:auctionId', requireGuide, bidController.getGuideAuctionBids);

export default router; 