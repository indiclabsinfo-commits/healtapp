import { Router } from 'express';
import * as controller from '../controllers/theory';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createTheorySchema, updateTheorySchema, updateProgressSchema } from '../validators/theory';

const router = Router();

router.get('/', requireAuth, controller.listTheorySessions);
router.get('/:id', requireAuth, controller.getTheorySessionById);
router.post('/', requireAuth, requireAdmin, validate(createTheorySchema), controller.createTheorySession);
router.put('/:id', requireAuth, requireAdmin, validate(updateTheorySchema), controller.updateTheorySession);
router.delete('/:id', requireAuth, requireAdmin, controller.deleteTheorySession);
router.post('/:id/progress', requireAuth, validate(updateProgressSchema), controller.updateProgress);
router.get('/:id/progress', requireAuth, controller.getProgress);

export default router;
