import { z } from 'zod';

export const submitAssessmentSchema = z.object({
  questionnaireId: z.number().int().positive(),
  answers: z.array(z.object({
    questionId: z.number().int().positive(),
    answer: z.any(),
  })).min(1, 'At least one answer required'),
});
