import { z } from 'zod';

export const createTheorySchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  modules: z.array(z.object({
    title: z.string(),
    content: z.string(),
  })).min(1, 'At least one module required'),
  duration: z.number().int().positive('Duration must be positive'),
  status: z.string().optional(),
});

export const updateTheorySchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().min(10).optional(),
  modules: z.array(z.object({
    title: z.string(),
    content: z.string(),
  })).optional(),
  duration: z.number().int().positive().optional(),
  status: z.string().optional(),
});

export const updateProgressSchema = z.object({
  completedModules: z.array(z.number().int().min(0)),
  completed: z.boolean().optional(),
});
