import { Router } from 'express';
import * as controller from '../controllers/analytics';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/user', requireAuth, controller.getUserAnalytics);
router.get('/admin', requireAuth, requireAdmin, controller.getAdminAnalytics);
router.get('/admin/export', requireAuth, requireAdmin, controller.exportCSV);

export default router;
