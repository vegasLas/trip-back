import { Router } from 'express';
import * as programPointController from '../controllers/programPointController';
import { validateTelegramAuth, requireAdmin } from '../middlewares/auth';

const router = Router({ mergeParams: true });

// Public routes
router.get('/', programPointController.getProgramPoints);

// Admin routes
router.use(validateTelegramAuth);
router.use(requireAdmin);
router.post('/', programPointController.createProgramPoint);
router.put('/:pointId', programPointController.updateProgramPoint);
router.delete('/:pointId', programPointController.deleteProgramPoint);

export default router; 