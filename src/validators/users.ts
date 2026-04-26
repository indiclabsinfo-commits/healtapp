import { z } from 'zod';

export const updateUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().optional(),
  gender: z.string().optional(),
  age: z.number().int().positive().optional(),
  avatar: z.string().optional(),
  pushToken: z.string().optional(),
  role: z.enum(['USER', 'ADMIN']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export const toggleStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE'], { required_error: 'Status must be ACTIVE or INACTIVE' }),
});
