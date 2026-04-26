import { Router } from 'express';
import * as counsellorController from '../controllers/counsellors';
import { requireAuth, requireAdmin, requireAdminOrOrgAdmin } from '../middleware/auth';
import { validate, validateMultipart } from '../middleware/validate';
import { uploadPhoto } from '../middleware/upload';
import { createCounsellorSchema, updateCounsellorSchema, linkCounsellorUserSchema } from '../validators/counsellors';

const router = Router();

const COUNSELLOR_NUMERIC = ['rating', 'hourlyRate'];
const COUNSELLOR_INT = ['experience', 'organizationId'];
const COUNSELLOR_JSON = ['tags'];

// User-accessible routes
router.get('/', requireAuth, counsellorController.listCounsellors);
router.get('/:id', requireAuth, counsellorController.getCounsellorById);

// Org admins + super admins can manage counsellors
router.post(
  '/',
  requireAuth,
  requireAdminOrOrgAdmin,
  uploadPhoto,
  validateMultipart(createCounsellorSchema, {
    numericFields: COUNSELLOR_NUMERIC,
    intFields: COUNSELLOR_INT,
    jsonFields: COUNSELLOR_JSON,
  }),
  counsellorController.createCounsellor
);
router.put(
  '/:id',
  requireAuth,
  requireAdminOrOrgAdmin,
  uploadPhoto,
  validateMultipart(updateCounsellorSchema, {
    numericFields: COUNSELLOR_NUMERIC,
    intFields: COUNSELLOR_INT,
    jsonFields: COUNSELLOR_JSON,
  }),
  counsellorController.updateCounsellor
);
router.delete('/:id', requireAuth, requireAdminOrOrgAdmin, counsellorController.deleteCounsellor);
router.patch('/:id/link-user', requireAuth, requireAdminOrOrgAdmin, counsellorController.linkUser);

export default router;
