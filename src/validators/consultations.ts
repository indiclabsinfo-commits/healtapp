import { z } from 'zod';

export const createSlotSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format'),
  duration: z.number().int().min(15).max(120),
});

export const setSlotsSchema = z.array(createSlotSchema).min(1, 'At least one slot is required');

export const bookConsultationSchema = z.object({
  counsellorId: z.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format'),
  type: z.enum(['IN_PERSON', 'VIDEO']).optional().default('IN_PERSON'),
});

export const updateNotesSchema = z.object({
  notes: z.string().optional(),
  summary: z.string().optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(['BOOKED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']),
});
