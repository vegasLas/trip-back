import { Router } from 'express';
import * as programController from '../controllers/programController';
import programDayRoutes from './programDayRoutes';
import { validateTelegramAuth, requireGuide, requireAdmin, requireTourist } from '../middlewares/auth';

const router = Router();

// Apply authentication middleware to most routes
router.use(validateTelegramAuth);

// Mount program day routes as sub-routes
router.use('/:programId/days', programDayRoutes);

// Public routes (no auth required)
router.get('/', programController.getAllPrograms);
router.get('/:id', programController.getProgramById);
router.get('/:id/guides', programController.getProgramGuides);

// Protected routes
router.post('/', requireGuide, programController.createProgram);
router.put('/:id', requireGuide, programController.updateProgram);
router.delete('/:id', requireGuide, programController.deleteProgram);
router.post('/:id/request', requireTourist, programController.requestDirectBooking);
router.put('/:id/request/:requestId/respond', requireGuide, programController.respondToDirectRequest);
router.post('/:id/recommend', requireGuide, programController.recommendProgram);

// Admin routes
router.get('/recommendations', requireAdmin, programController.getAllProgramRecommendations);
router.put('/recommendations/:id/approve', requireAdmin, programController.approveRecommendation);
router.put('/recommendations/:id/reject', requireAdmin, programController.rejectRecommendation);

export default router; 