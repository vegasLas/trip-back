import { Router } from 'express';
import * as auctionController from '../controllers/auctionController';
import { validateTelegramAuth, requireGuide, requireTourist } from '../middlewares/auth';

const router = Router();

// Public routes - anyone can view public auctions
router.get('/active', auctionController.getActiveAuctions);
router.get('/:id', auctionController.getAuctionById);

// Protected routes - authentication required
router.use(validateTelegramAuth);

// Guide routes - only guides can create and manage auctions
router.post('/', requireGuide, auctionController.createAuction);
router.put('/:id', requireGuide, auctionController.updateAuction);
router.delete('/:id', requireGuide, auctionController.deleteAuction);
router.post('/:id/end', requireGuide, auctionController.endAuction);

// Tourist routes - only tourists can bid on auctions
router.post('/:id/bids', requireTourist, auctionController.placeBid);
router.get('/tourist/bidded', requireTourist, auctionController.getTouristBiddedAuctions);

// Guide-specific routes - view own auctions
router.get('/guide/own', requireGuide, auctionController.getGuideAuctions);

export default router; 