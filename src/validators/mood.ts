import { z } from 'zod';

export const logMoodSchema = z.object({
  mood: z.number().int().min(1).max(5, 'Mood must be between 1 and 5'),
});
