import { Router } from 'express';
import * as controller from '../controllers/mood';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { logMoodSchema } from '../validators/mood';

const router = Router();

router.post('/', requireAuth, validate(logMoodSchema), controller.logMood);
router.get('/history', requireAuth, controller.getMoodHistory);

export default router;
