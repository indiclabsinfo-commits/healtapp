import { Router } from 'express';
import * as controller from '../controllers/invites';
import { validate } from '../middleware/validate';
import { acceptInviteSchema } from '../validators/invites';

const router = Router();

// Public — validate invite token (for accept page)
router.get('/validate', controller.validateInvite);

// Public — accept invite (register + join org)
router.post('/accept', validate(acceptInviteSchema), controller.acceptInvite);

export default router;
