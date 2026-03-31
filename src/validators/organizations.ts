import { z } from 'zod';

export const validateOrgCodeSchema = z.object({
  code: z.string().min(1, 'Organization code is required'),
});

export const createOrganizationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  type: z.enum(['SCHOOL', 'CORPORATE'], { required_error: 'Type must be SCHOOL or CORPORATE' }),
  code: z.string().min(3, 'Code must be at least 3 characters').max(20, 'Code must be at most 20 characters'),
  contactEmail: z.string().email('Invalid email address').optional(),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
});

export const updateOrganizationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  type: z.enum(['SCHOOL', 'CORPORATE']).optional(),
  code: z.string().min(3).max(20).optional(),
  contactEmail: z.string().email('Invalid email address').optional(),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
});

export const addMemberSchema = z.object({
  userId: z.number().int().positive('User ID is required'),
  role: z.enum(['STUDENT', 'EMPLOYEE', 'TEACHER', 'HR', 'ORG_ADMIN'], {
    required_error: 'Role is required',
  }),
  class: z.string().optional(),
  department: z.string().optional(),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(['STUDENT', 'EMPLOYEE', 'TEACHER', 'HR', 'ORG_ADMIN'], {
    required_error: 'Role is required',
  }),
});

export const allocateCreditsSchema = z.object({
  amount: z.number().int().positive('Amount must be a positive integer'),
});
