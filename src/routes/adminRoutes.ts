import express from 'express';
import * as adminController from '../controllers/adminController';
import * as userController from '../controllers/userController';
import { validateTelegramAuth, requireAdmin } from '../middlewares/auth';

const router = express.Router();

// Apply Telegram authentication to all admin routes
router.use(validateTelegramAuth);
router.use(requireAdmin);

// Admin management routes
router.get('/', adminController.getAllAdmins);
router.get('/:id', adminController.getAdminById);
router.post('/', adminController.createAdmin);
router.patch('/:id', adminController.updateAdmin);
router.delete('/:id', adminController.deleteAdmin);

// Program management routes
router.post('/programs', adminController.createProgram);
router.get('/recommendations', adminController.getAllRecommendations);
router.patch('/recommendations/:recommendationId', adminController.updateRecommendationStatus);

// Guide approval routes
router.get('/guides/pending', userController.getPendingGuideApprovals);
router.patch('/guides/:id/approval', userController.updateGuideApprovalStatus);

// Guide profile change request routes
router.get('/guides/change-requests', userController.getPendingGuideProfileChangeRequests);
router.patch('/guides/change-requests/:id', userController.processGuideProfileChangeRequest);

export default router; 