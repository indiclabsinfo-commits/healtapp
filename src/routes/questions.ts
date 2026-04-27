import { Router } from 'express';
import * as questionController from '../controllers/questions';
import { requireAuth, requireAdminOrOrgAdmin } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createQuestionSchema, updateQuestionSchema } from '../validators/questions';

const router = Router();

// Super Admin OR Org Admin
router.post('/', requireAuth, requireAdminOrOrgAdmin, validate(createQuestionSchema), questionController.createQuestion);
router.put('/:id', requireAuth, requireAdminOrOrgAdmin, validate(updateQuestionSchema), questionController.updateQuestion);
router.delete('/:id', requireAuth, requireAdminOrOrgAdmin, questionController.deleteQuestion);

export default router;
