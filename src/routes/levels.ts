import { Router } from 'express';
import * as levelController from '../controllers/levels';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createLevelSchema, updateLevelSchema } from '../validators/levels';

const router = Router();

// User-accessible
router.get('/:id/questions', requireAuth, levelController.getQuestionsByLevel);

// Admin-only
router.post('/', requireAuth, requireAdmin, validate(createLevelSchema), levelController.createLevel);
router.put('/:id', requireAuth, requireAdmin, validate(updateLevelSchema), levelController.updateLevel);
router.delete('/:id', requireAuth, requireAdmin, levelController.deleteLevel);

export default router;
