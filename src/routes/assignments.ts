import { Router } from 'express';
import * as controller from '../controllers/assignments';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createAssignmentSchema, updateAssignmentSchema } from '../validators/assignments';

const router = Router();

// Create assignment (teacher/HR/org-admin)
router.post('/', requireAuth, validate(createAssignmentSchema), controller.createAssignment);

// List all assignments for an org
router.get('/', requireAuth, controller.listAssignments);

// Get user's assigned tasks
router.get('/my', requireAuth, controller.getMyAssignments);

// Update assignment
router.put('/:id', requireAuth, validate(updateAssignmentSchema), controller.updateAssignment);

// Soft delete assignment
router.delete('/:id', requireAuth, controller.deleteAssignment);

export default router;
