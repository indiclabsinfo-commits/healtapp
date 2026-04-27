import { Router } from 'express';
import * as categoryController from '../controllers/categories';
import { requireAuth, requireAdminOrOrgAdmin } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createCategorySchema, updateCategorySchema } from '../validators/categories';

const router = Router();

// User-accessible
router.get('/', requireAuth, categoryController.listCategories);
router.get('/:id/levels', requireAuth, categoryController.getLevelsByCategory);

// Super Admin OR Org Admin — both can manage assessment taxonomy
router.post('/', requireAuth, requireAdminOrOrgAdmin, validate(createCategorySchema), categoryController.createCategory);
router.put('/:id', requireAuth, requireAdminOrOrgAdmin, validate(updateCategorySchema), categoryController.updateCategory);
router.delete('/:id', requireAuth, requireAdminOrOrgAdmin, categoryController.deleteCategory);

export default router;
