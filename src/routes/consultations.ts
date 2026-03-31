import { Router } from 'express';
import * as controller from '../controllers/consultations';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { setSlotsSchema, bookConsultationSchema, updateStatusSchema, updateNotesSchema } from '../validators/consultations';

const router = Router();

// Slot management
router.get('/counsellors/:counsellorId/slots', requireAuth, controller.getSlots);
router.put('/counsellors/:counsellorId/slots', requireAuth, validate(setSlotsSchema), controller.setSlots);

// Availability check
router.get('/counsellors/:counsellorId/availability', requireAuth, controller.getAvailability);

// Booking
router.post('/book', requireAuth, validate(bookConsultationSchema), controller.bookConsultation);

// User's consultations
router.get('/my', requireAuth, controller.getMyConsultations);

// Counsellor's consultations
router.get('/counsellor', requireAuth, controller.getCounsellorConsultations);

// Single consultation detail
router.get('/:id', requireAuth, controller.getConsultationById);

// Update status
router.put('/:id/status', requireAuth, validate(updateStatusSchema), controller.updateStatus);

// Update notes
router.put('/:id/notes', requireAuth, validate(updateNotesSchema), controller.updateNotes);

export default router;
