import { Router } from 'express';
import * as levelController from '../controllers/levels';
import { requireAuth, requireAdminOrOrgAdmin } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createLevelSchema, updateLevelSchema } from '../validators/levels';

const router = Router();

// User-accessible
router.get('/:id/questions', requireAuth, levelController.getQuestionsByLevel);

// Super Admin OR Org Admin
router.post('/', requireAuth, requireAdminOrOrgAdmin, validate(createLevelSchema), levelController.createLevel);
router.put('/:id', requireAuth, requireAdminOrOrgAdmin, validate(updateLevelSchema), levelController.updateLevel);
router.delete('/:id', requireAuth, requireAdminOrOrgAdmin, levelController.deleteLevel);

export default router;
