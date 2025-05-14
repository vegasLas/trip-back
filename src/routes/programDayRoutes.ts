import { Router } from 'express';
import * as programDayController from '../controllers/programDayController';
import programPointRoutes from './programPointRoutes';
import { validateTelegramAuth, requireGuide } from '../middlewares/auth';

const router = Router({ mergeParams: true });

// Mount program point routes as sub-routes
router.use('/:dayId/points', programPointRoutes);

// Public routes
router.get('/', programDayController.getProgramDays);
router.get('/:dayId', programDayController.getProgramDayById);

// Protected routes
router.post('/', validateTelegramAuth, requireGuide, programDayController.createProgramDay);
router.put('/:dayId', validateTelegramAuth, requireGuide, programDayController.updateProgramDay);
router.delete('/:dayId', validateTelegramAuth, requireGuide, programDayController.deleteProgramDay);

export default router; 