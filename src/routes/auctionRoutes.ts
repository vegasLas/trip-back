import { Router } from 'express';
import * as auctionController from '../controllers/auctionController';
import { validateTelegramAuth, requireGuide, requireTourist } from '../middlewares/auth';

const router = Router();

// Public routes - anyone can view public auctions
router.get('/active', auctionController.getActiveAuctions);
router.get('/:id', auctionController.getAuctionById);

// Protected routes - authentication required
router.use(validateTelegramAuth);

// Tourist routes - tourists create and manage auctions
router.post('/', requireTourist, auctionController.createAuction);
router.put('/:id', requireTourist, auctionController.updateAuction);
router.delete('/:id', requireTourist, auctionController.deleteAuction);
router.post('/:id/end', requireTourist, auctionController.endAuction);
router.get('/tourist/auctions', requireTourist, auctionController.getGuideAuctions);

// Guide routes - guides place bids on auctions
router.post('/:id/bids', requireGuide, auctionController.placeBid);
router.get('/guide/bidded', requireGuide, auctionController.getTouristBiddedAuctions);

export default router; 