import { z } from 'zod';

export const createAssignmentSchema = z.object({
  type: z.enum(['ASSESSMENT', 'THEORY']),
  questionnaireId: z.number().int().positive().optional(),
  theorySessionId: z.number().int().positive().optional(),
  targetType: z.enum(['ALL', 'CLASS', 'DEPARTMENT', 'INDIVIDUAL']),
  targetValue: z.string().optional(),
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'Deadline must be a valid ISO date').optional(),
  mandatory: z.boolean().optional().default(false),
}).refine((data) => {
  if (data.type === 'ASSESSMENT' && !data.questionnaireId) {
    return false;
  }
  if (data.type === 'THEORY' && !data.theorySessionId) {
    return false;
  }
  return true;
}, {
  message: 'questionnaireId is required for ASSESSMENT type, theorySessionId is required for THEORY type',
}).refine((data) => {
  if (['CLASS', 'DEPARTMENT', 'INDIVIDUAL'].includes(data.targetType) && !data.targetValue) {
    return false;
  }
  return true;
}, {
  message: 'targetValue is required when targetType is CLASS, DEPARTMENT, or INDIVIDUAL',
});

export const updateAssignmentSchema = z.object({
  type: z.enum(['ASSESSMENT', 'THEORY']).optional(),
  questionnaireId: z.number().int().positive().optional().nullable(),
  theorySessionId: z.number().int().positive().optional().nullable(),
  targetType: z.enum(['ALL', 'CLASS', 'DEPARTMENT', 'INDIVIDUAL']).optional(),
  targetValue: z.string().optional().nullable(),
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'Deadline must be a valid ISO date').optional().nullable(),
  mandatory: z.boolean().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});
