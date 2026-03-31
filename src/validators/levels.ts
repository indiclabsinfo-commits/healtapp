import { z } from 'zod';

export const createLevelSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  order: z.number().int().min(0, 'Order must be non-negative'),
  categoryId: z.number().int().positive('Category ID is required'),
});

export const updateLevelSchema = z.object({
  name: z.string().min(1).optional(),
  order: z.number().int().min(0).optional(),
});
