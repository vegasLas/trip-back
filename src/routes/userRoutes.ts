import { Router } from 'express';
import * as userController from '../controllers/userController';
import { validateTelegramAuth, requireGuide } from '../middlewares/auth';
import { uploadGuideImages } from '../middlewares/uploadMiddleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(validateTelegramAuth);

// GET /api/users/me - Get current user profile (tourist or guide)
router.get('/me', userController.getCurrentUser);

// PUT /api/users/me - Update user profile
router.put('/me', userController.updateUser);

// GET /api/users/:id - Get public user profile
router.get('/:id', userController.getUser);

// POST /api/users/register-guide - Register as a guide
router.post('/register-guide', userController.registerAsGuide);

// CONSOLIDATED GUIDE UPDATE ENDPOINT
// PUT /api/guides/me - Update all guide information
router.put('/guides/me', requireGuide, uploadGuideImages, userController.updateGuideProfile);

// READ-ONLY OPERATIONS
// GET /api/guides/me/programs - Get guide's selected programs (guide only)
router.get('/guides/me/programs', requireGuide, userController.getGuidePrograms);

export default router; 