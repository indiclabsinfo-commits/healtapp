import { z } from 'zod';

const MEMBER_ROLES = ['STUDENT', 'EMPLOYEE', 'TEACHER', 'HR', 'ORG_ADMIN', 'COUNSELLOR'] as const;

export const sendInviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(MEMBER_ROLES, { required_error: 'Role is required' }),
  class: z.string().optional(),
  department: z.string().optional(),
});

export const acceptInviteSchema = z.object({
  token: z.string().min(10, 'Invite token is required'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
