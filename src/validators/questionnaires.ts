import { z } from 'zod';

export const createQuestionnaireSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  categoryId: z.number().int().positive(),
  levelId: z.number().int().positive(),
  questionIds: z.array(z.number().int().positive()).min(1, 'At least one question required'),
  published: z.boolean().optional(),
});

export const updateQuestionnaireSchema = z.object({
  title: z.string().min(2).optional(),
  questionIds: z.array(z.number().int().positive()).optional(),
  published: z.boolean().optional(),
});
