import { Router } from 'express';
import * as questionController from '../controllers/questions';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createQuestionSchema, updateQuestionSchema } from '../validators/questions';

const router = Router();

// Admin-only
router.post('/', requireAuth, requireAdmin, validate(createQuestionSchema), questionController.createQuestion);
router.put('/:id', requireAuth, requireAdmin, validate(updateQuestionSchema), questionController.updateQuestion);
router.delete('/:id', requireAuth, requireAdmin, questionController.deleteQuestion);

export default router;
