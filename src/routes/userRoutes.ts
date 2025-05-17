import { Router } from 'express';
import * as userController from '../controllers/userController';
import { validateTelegramAuth, requireGuide } from '../middlewares/auth';
import { uploadGuideImage } from '../middlewares/uploadMiddleware';

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

// PUT /api/guides/me/status - Update guide's active status (guide only)
router.put('/guides/me/status', requireGuide, userController.updateGuideStatus);

// PUT /api/guides/me/programs - Update guide's selected programs (guide only)
router.put('/guides/me/programs', requireGuide, userController.updateGuidePrograms);

// GET /api/guides/me/programs - Get guide's selected programs (guide only)
router.get('/guides/me/programs', requireGuide, userController.getGuidePrograms);

// POST /api/guides/me/images - Add image to guide profile (guide only)
router.post('/guides/me/images', requireGuide, uploadGuideImage, userController.addGuideImage);

// PUT /api/guides/me/images/order - Update guide images order (guide only)
router.put('/guides/me/images/order', requireGuide, userController.updateGuideImagesOrder);

// DELETE /api/guides/me/images/:imageIndex - Remove image from guide profile (guide only)
router.delete('/guides/me/images/:imageIndex', requireGuide, userController.removeGuideImage);

export default router; 