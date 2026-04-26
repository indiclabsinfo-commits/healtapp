import { z } from 'zod';

export const createCounsellorSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  specialization: z.string().min(2, 'Specialization is required'),
  qualifications: z.string().min(10, 'Qualifications must be at least 10 characters'),
  experience: z.number().int().nonnegative('Experience must be a non-negative number'),
  bio: z.string().min(10, 'Bio must be at least 10 characters'),
  tags: z.array(z.string()).optional(),
  rating: z.number().min(0).max(5).optional(),
  hourlyRate: z.number().nonnegative().optional(),
  type: z.enum(['IN_HOUSE', 'EXTERNAL']).optional(),
  organizationId: z.number().int().positive().optional(),
  email: z.string().email('Invalid email').optional(),
});

export const updateCounsellorSchema = z.object({
  name: z.string().min(2).optional(),
  specialization: z.string().min(2).optional(),
  qualifications: z.string().min(10).optional(),
  experience: z.number().int().nonnegative().optional(),
  bio: z.string().min(10).optional(),
  tags: z.array(z.string()).optional(),
  rating: z.number().min(0).max(5).optional(),
  hourlyRate: z.number().nonnegative().optional(),
  type: z.enum(['IN_HOUSE', 'EXTERNAL']).optional(),
  organizationId: z.number().int().positive().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});
