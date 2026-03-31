import { Router } from 'express';
import * as userController from '../controllers/users';
import { requireAuth } from '../middleware/auth';
import { requireAdmin } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { uploadCSV } from '../middleware/upload';
import { updateUserSchema, toggleStatusSchema } from '../validators/users';

const router = Router();

// All routes require admin
// Bulk routes MUST come before /:id to prevent "bulk" matching as an ID
router.get('/bulk/history', requireAuth, requireAdmin, userController.bulkHistory);
router.get('/bulk/template', requireAuth, requireAdmin, userController.downloadTemplate);
router.post('/bulk', requireAuth, requireAdmin, uploadCSV, userController.bulkRegister);

// Standard CRUD
router.get('/', requireAuth, requireAdmin, userController.listUsers);
router.get('/:id', requireAuth, requireAdmin, userController.getUserById);
router.put('/:id', requireAuth, requireAdmin, validate(updateUserSchema), userController.updateUser);
router.patch('/:id/status', requireAuth, requireAdmin, validate(toggleStatusSchema), userController.toggleStatus);

export default router;
