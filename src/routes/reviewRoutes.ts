import { Router } from 'express';
import * as reviewController from '../controllers/reviewController';
import { validateTelegramAuth, requireTourist } from '../middlewares/auth';

const router = Router();

// Public routes - anyone can view reviews
router.get('/program/:programId', reviewController.getProgramReviews);
router.get('/guide/:guideId', reviewController.getGuideReviews);
router.get('/:id', reviewController.getReviewById);

// Protected routes - only authenticated tourists can create/manage their own reviews
router.use(validateTelegramAuth);
router.post('/', requireTourist, reviewController.createReview);
router.put('/:id', requireTourist, reviewController.updateReview);
router.delete('/:id', requireTourist, reviewController.deleteReview);

export default router; 