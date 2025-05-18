import { Router } from 'express';
import * as programDayController from '../controllers/programDayController';
import programPointRoutes from './programPointRoutes';
import { validateTelegramAuth, requireAdmin } from '../middlewares/auth';

const router = Router({ mergeParams: true });

// Mount program point routes as sub-routes
router.use('/:dayId/points', programPointRoutes);

// Public routes
router.get('/', programDayController.getProgramDays);
router.get('/:dayId', programDayController.getProgramDayById);

// Admin routes
router.post('/', validateTelegramAuth, requireAdmin, programDayController.createProgramDay);
router.put('/:dayId', validateTelegramAuth, requireAdmin, programDayController.updateProgramDay);
router.delete('/:dayId', validateTelegramAuth, requireAdmin, programDayController.deleteProgramDay);

export default router; 