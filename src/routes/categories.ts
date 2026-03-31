import { Router } from 'express';
import * as categoryController from '../controllers/categories';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createCategorySchema, updateCategorySchema } from '../validators/categories';

const router = Router();

// User-accessible
router.get('/', requireAuth, categoryController.listCategories);
router.get('/:id/levels', requireAuth, categoryController.getLevelsByCategory);

// Admin-only
router.post('/', requireAuth, requireAdmin, validate(createCategorySchema), categoryController.createCategory);
router.put('/:id', requireAuth, requireAdmin, validate(updateCategorySchema), categoryController.updateCategory);
router.delete('/:id', requireAuth, requireAdmin, categoryController.deleteCategory);

export default router;
