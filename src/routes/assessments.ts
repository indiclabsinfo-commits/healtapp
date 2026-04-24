import { Router } from 'express';
import * as controller from '../controllers/assessments';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { submitAssessmentSchema } from '../validators/assessments';

const router = Router();

router.post('/', requireAuth, validate(submitAssessmentSchema), controller.submitAssessment);
router.get('/my', requireAuth, controller.getMyAssessments);
router.get('/my/:id', requireAuth, controller.getAssessmentById);
router.get('/user/:userId', requireAuth, controller.getUserAssessments);

export default router;
