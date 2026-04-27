import { Router } from 'express';
import * as controller from '../controllers/questionnaires';
import { requireAuth, requireAdminOrOrgAdmin } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createQuestionnaireSchema, updateQuestionnaireSchema } from '../validators/questionnaires';

const router = Router();

router.get('/', requireAuth, controller.listQuestionnaires);
router.get('/:id', requireAuth, controller.getQuestionnaireById);
// Super Admin OR Org Admin — both can build questionnaires for their scope
router.post('/', requireAuth, requireAdminOrOrgAdmin, validate(createQuestionnaireSchema), controller.createQuestionnaire);
router.put('/:id', requireAuth, requireAdminOrOrgAdmin, validate(updateQuestionnaireSchema), controller.updateQuestionnaire);
router.delete('/:id', requireAuth, requireAdminOrOrgAdmin, controller.deleteQuestionnaire);

export default router;
