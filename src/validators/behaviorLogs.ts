import { z } from 'zod';

export const createBehaviorLogSchema = z.object({
  studentId: z.number().int().positive('Student ID is required'),
  category: z.enum(['ACADEMIC', 'SOCIAL', 'EMOTIONAL', 'BEHAVIORAL'], {
    errorMap: () => ({ message: 'Category must be one of: ACADEMIC, SOCIAL, EMOTIONAL, BEHAVIORAL' }),
  }),
  severity: z.enum(['LOW', 'MODERATE', 'HIGH', 'CRITICAL'], {
    errorMap: () => ({ message: 'Severity must be one of: LOW, MODERATE, HIGH, CRITICAL' }),
  }),
  notes: z.string().min(1, 'Notes are required'),
  flagForCounseling: z.boolean().default(false),
  date: z.string().optional(),
});

export const updateCounselingStatusSchema = z.object({
  counselingStatus: z.enum(['NONE', 'PENDING', 'SCHEDULED', 'COMPLETED'], {
    errorMap: () => ({ message: 'Status must be one of: NONE, PENDING, SCHEDULED, COMPLETED' }),
  }),
});
