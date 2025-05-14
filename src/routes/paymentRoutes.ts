import { Router } from 'express';
import * as paymentController from '../controllers/paymentController';
import { validateTelegramAuth, requireGuide } from '../middlewares/auth';

const router = Router();

// All payment routes require authentication
router.use(validateTelegramAuth);

// Guide token purchase and management routes
router.post('/tokens/purchase', requireGuide, paymentController.initiatePayment);
router.post('/tokens/use', requireGuide, paymentController.useTokens);
router.get('/tokens/balance', requireGuide, paymentController.getTokenBalance);
router.get('/tokens/transactions', requireGuide, paymentController.getTokenTransactions);

// Payment history and details
router.get('/history', requireGuide, paymentController.getGuidePaymentsReceived);
router.get('/:id', requireGuide, paymentController.getPaymentDetails);

// Payment provider callback
router.post('/:id/callback', paymentController.handlePaymentCallback);

export default router; 