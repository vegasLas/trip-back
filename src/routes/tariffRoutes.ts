import { Router } from 'express';
import * as tariffController from '../controllers/tariffController';
import { validateTelegramAuth, requireAdmin } from '../middlewares/auth';

const router = Router();

// Public routes - anyone can view tariffs for a program
router.get('/program/:programId', tariffController.getProgramTariffs);

// Admin routes - only admins can manage tariffs
router.use(validateTelegramAuth, requireAdmin);
router.post('/program/:programId', tariffController.createProgramTariff);
router.put('/:id', tariffController.updateProgramTariff);
router.delete('/:id', tariffController.deleteProgramTariff);
router.patch('/:id/status', tariffController.toggleTariffStatus);

export default router; 