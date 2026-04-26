import { Router } from 'express';
import * as counsellorController from '../controllers/counsellors';
import { requireAuth, requireAdmin, requireAdminOrOrgAdmin } from '../middleware/auth';
import { uploadPhoto } from '../middleware/upload';

const router = Router();

// User-accessible routes
router.get('/', requireAuth, counsellorController.listCounsellors);
router.get('/:id', requireAuth, counsellorController.getCounsellorById);

// Org admins + super admins can manage counsellors
router.post('/', requireAuth, requireAdminOrOrgAdmin, uploadPhoto, counsellorController.createCounsellor);
router.put('/:id', requireAuth, requireAdminOrOrgAdmin, uploadPhoto, counsellorController.updateCounsellor);
router.delete('/:id', requireAuth, requireAdminOrOrgAdmin, counsellorController.deleteCounsellor);
router.patch('/:id/link-user', requireAuth, requireAdminOrOrgAdmin, counsellorController.linkUser);

export default router;
