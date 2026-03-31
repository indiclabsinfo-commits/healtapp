import { z } from 'zod';

export const createQuestionSchema = z.object({
  text: z.string().min(5, 'Question text must be at least 5 characters'),
  type: z.enum(['MCQ', 'SCALE', 'YESNO'], { required_error: 'Type must be MCQ, SCALE, or YESNO' }),
  options: z.any(),
  levelId: z.number().int().positive('Level ID is required'),
});

export const updateQuestionSchema = z.object({
  text: z.string().min(5).optional(),
  type: z.enum(['MCQ', 'SCALE', 'YESNO']).optional(),
  options: z.any().optional(),
});
