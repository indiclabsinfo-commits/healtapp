import { z } from 'zod';

const MEMBER_ROLES = ['STUDENT', 'EMPLOYEE', 'TEACHER', 'HR', 'ORG_ADMIN', 'COUNSELLOR'] as const;

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
  logo: z.string().optional(),
});

export const updateOrganizationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  type: z.enum(['SCHOOL', 'CORPORATE']).optional(),
  code: z.string().min(3).max(20).optional(),
  contactEmail: z.string().email('Invalid email address').optional(),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  logo: z.string().optional(),
  creditBalance: z.number().int().nonnegative().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export const addMemberSchema = z.object({
  userId: z.number().int().positive('User ID is required'),
  role: z.enum(MEMBER_ROLES, { required_error: 'Role is required' }),
  class: z.string().optional(),
  department: z.string().optional(),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(MEMBER_ROLES, { required_error: 'Role is required' }),
});

export const allocateCreditsSchema = z.object({
  amount: z.number().int().positive('Amount must be a positive integer'),
});

export const allocateMemberCreditsSchema = z.object({
  amount: z.number().int().positive('Amount must be a positive integer'),
});

export const assignStudentSchema = z.object({
  studentMemberId: z.number().int().positive('studentMemberId is required'),
  counsellorMemberId: z.number().int().positive('counsellorMemberId is required'),
});

export const unassignStudentSchema = z.object({
  studentMemberId: z.number().int().positive('studentMemberId is required'),
  counsellorMemberId: z.number().int().positive('counsellorMemberId is required'),
});

export const bulkAssignClassSchema = z.object({
  className: z.string().min(1, 'Class name is required'),
  counsellorMemberId: z.number().int().positive('counsellorMemberId is required'),
});

export const saveConsentSchema = z.object({
  status: z.enum(['PENDING', 'GRANTED', 'DENIED', 'WITHDRAWN'], { required_error: 'Status required' }),
  parentName: z.string().optional(),
  parentEmail: z.string().email().optional().or(z.literal('')),
  parentPhone: z.string().optional(),
  notes: z.string().optional(),
});

export const sendInviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(MEMBER_ROLES, { required_error: 'Role is required' }),
  class: z.string().optional(),
  department: z.string().optional(),
});

export const registerOrganizationSchema = z.object({
  name: z.string().min(2, 'School/org name must be at least 2 characters'),
  type: z.enum(['SCHOOL', 'CORPORATE'], { required_error: 'Type is required' }),
  contactEmail: z.string().email('Invalid contact email'),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  principalName: z.string().min(2, 'Your name is required'),
  principalEmail: z.string().email('Invalid email address'),
  principalPassword: z.string().min(8, 'Password must be at least 8 characters'),
});
