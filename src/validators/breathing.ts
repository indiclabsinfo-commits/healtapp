import { z } from 'zod';

export const createBreathingSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  inhaleSeconds: z.number().int().min(1).max(30),
  holdSeconds: z.number().int().min(0).max(30),
  exhaleSeconds: z.number().int().min(1).max(30),
  holdAfterExhale: z.number().int().min(0).max(30).optional(),
  defaultCycles: z.number().int().min(1).max(100).optional(),
  category: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export const updateBreathingSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().min(10).optional(),
  inhaleSeconds: z.number().int().min(1).max(30).optional(),
  holdSeconds: z.number().int().min(0).max(30).optional(),
  exhaleSeconds: z.number().int().min(1).max(30).optional(),
  holdAfterExhale: z.number().int().min(0).max(30).optional(),
  defaultCycles: z.number().int().min(1).max(100).optional(),
  category: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export const logBreathingSchema = z.object({
  exerciseId: z.number().int().positive(),
  cycles: z.number().int().positive(),
  durationSec: z.number().int().positive(),
});
