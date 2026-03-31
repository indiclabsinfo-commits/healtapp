import { Router } from 'express';
import * as controller from '../controllers/questionnaires';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createQuestionnaireSchema, updateQuestionnaireSchema } from '../validators/questionnaires';

const router = Router();

router.get('/', requireAuth, controller.listQuestionnaires);
router.get('/:id', requireAuth, controller.getQuestionnaireById);
router.post('/', requireAuth, requireAdmin, validate(createQuestionnaireSchema), controller.createQuestionnaire);
router.put('/:id', requireAuth, requireAdmin, validate(updateQuestionnaireSchema), controller.updateQuestionnaire);
router.delete('/:id', requireAuth, requireAdmin, controller.deleteQuestionnaire);

export default router;
