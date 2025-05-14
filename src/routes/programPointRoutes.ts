import { Router } from 'express';
import * as programPointController from '../controllers/programPointController';
import { validateTelegramAuth, requireGuide } from '../middlewares/auth';

const router = Router({ mergeParams: true });

// Public routes
router.get('/', programPointController.getProgramPoints);

// Protected routes
router.post('/', validateTelegramAuth, requireGuide, programPointController.createProgramPoint);
router.put('/:pointId', validateTelegramAuth, requireGuide, programPointController.updateProgramPoint);
router.delete('/:pointId', validateTelegramAuth, requireGuide, programPointController.deleteProgramPoint);

export default router; 