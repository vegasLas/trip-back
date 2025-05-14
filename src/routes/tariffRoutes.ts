import { Router } from 'express';
import * as tariffController from '../controllers/tariffController';
import { validateTelegramAuth, requireGuide } from '../middlewares/auth';

const router = Router();

// Public routes - anyone can view tariffs for a program
router.get('/program/:programId', tariffController.getProgramTariffs);

// Protected routes - only guides can manage tariffs
router.use(validateTelegramAuth);
router.post('/program/:programId', requireGuide, tariffController.createProgramTariff);
router.put('/:id', requireGuide, tariffController.updateProgramTariff);
router.delete('/:id', requireGuide, tariffController.deleteProgramTariff);
router.patch('/:id/status', requireGuide, tariffController.toggleTariffStatus);

export default router; 