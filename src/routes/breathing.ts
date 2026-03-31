import { Router } from 'express';
import * as controller from '../controllers/breathing';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createBreathingSchema, updateBreathingSchema, logBreathingSchema } from '../validators/breathing';

const router = Router();

// User routes
router.get('/', requireAuth, controller.listExercises);
router.get('/favourites', requireAuth, controller.getFavourites);
router.get('/history', requireAuth, controller.getHistory);
router.get('/:id', requireAuth, controller.getExerciseById);
router.post('/:id/favourite', requireAuth, controller.toggleFavourite);
router.post('/complete', requireAuth, validate(logBreathingSchema), controller.logCompletion);

// Admin routes
router.post('/', requireAuth, requireAdmin, validate(createBreathingSchema), controller.createExercise);
router.put('/:id', requireAuth, requireAdmin, validate(updateBreathingSchema), controller.updateExercise);
router.delete('/:id', requireAuth, requireAdmin, controller.deleteExercise);

export default router;
