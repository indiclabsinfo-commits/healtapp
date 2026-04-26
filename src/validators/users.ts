import { z } from 'zod';

export const updateUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().optional(),
  gender: z.string().optional(),
  age: z.number().int().positive().optional(),
  avatar: z.string().optional(),
  pushToken: z.string().optional(),
  // Accepts platform roles (USER, ADMIN) and org roles (STUDENT, etc.). Controller strips
  // platform-role escalation from non-super-admins; service routes org roles to OrganizationMember.
  role: z.enum(['USER', 'ADMIN', 'STUDENT', 'EMPLOYEE', 'TEACHER', 'HR', 'ORG_ADMIN', 'COUNSELLOR']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export const toggleStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE'], { required_error: 'Status must be ACTIVE or INACTIVE' }),
});
