import { Router } from 'express';
import * as counsellorController from '../controllers/counsellors';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { uploadPhoto } from '../middleware/upload';

const router = Router();

// User-accessible routes
router.get('/', requireAuth, counsellorController.listCounsellors);
router.get('/:id', requireAuth, counsellorController.getCounsellorById);

// Admin-only routes (uploadPhoto handles multipart, so no Zod validate — parsed in controller)
router.post('/', requireAuth, requireAdmin, uploadPhoto, counsellorController.createCounsellor);
router.put('/:id', requireAuth, requireAdmin, uploadPhoto, counsellorController.updateCounsellor);
router.delete('/:id', requireAuth, requireAdmin, counsellorController.deleteCounsellor);

export default router;
