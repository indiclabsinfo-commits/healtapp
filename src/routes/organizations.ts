import { Router } from 'express';
import * as orgController from '../controllers/organizations';
import * as inviteController from '../controllers/invites';
import * as consentController from '../controllers/consent';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { attachOrgMembership, requireOrgAdmin } from '../middleware/org';
import { validate } from '../middleware/validate';
import {
  validateOrgCodeSchema,
  createOrganizationSchema,
  updateOrganizationSchema,
  addMemberSchema,
  updateMemberRoleSchema,
  allocateCreditsSchema,
  allocateMemberCreditsSchema,
  registerOrganizationSchema,
  assignStudentSchema,
  unassignStudentSchema,
  bulkAssignClassSchema,
  saveConsentSchema,
  sendInviteSchema,
} from '../validators/organizations';
import { uploadCSV } from '../middleware/upload';

const router = Router();

// Public — self-service school/org registration (no auth required)
router.post('/register', validate(registerOrganizationSchema), orgController.registerOrganization);

// Public — validate an org code (used during registration)
router.post('/validate-code', validate(validateOrgCodeSchema), orgController.validateCode);

// User — get my credit balance across orgs
router.get('/credits/my', requireAuth, orgController.getMyCredits);

// Super Admin — list all organizations
router.get('/', requireAuth, requireAdmin, orgController.listOrganizations);

// Super Admin — create organization
router.post('/', requireAuth, requireAdmin, validate(createOrganizationSchema), orgController.createOrganization);

// Super Admin or Org Admin — get organization detail
router.get('/:id', requireAuth, attachOrgMembership, requireOrgAdmin, orgController.getOrganization);

// Super Admin or Org Admin — update organization
router.put('/:id', requireAuth, attachOrgMembership, requireOrgAdmin, validate(updateOrganizationSchema), orgController.updateOrganization);

// Super Admin — soft delete organization
router.delete('/:id', requireAuth, requireAdmin, orgController.deleteOrganization);

// Org Admin — list members
router.get('/:id/members', requireAuth, attachOrgMembership, requireOrgAdmin, orgController.getMembers);

// Org Admin — add member
router.post('/:id/members', requireAuth, attachOrgMembership, requireOrgAdmin, validate(addMemberSchema), orgController.addMember);

// Org Admin — update member role
router.put('/:id/members/:memberId/role', requireAuth, attachOrgMembership, requireOrgAdmin, validate(updateMemberRoleSchema), orgController.updateMemberRole);

// Org Admin — remove member
router.delete('/:id/members/:memberId', requireAuth, attachOrgMembership, requireOrgAdmin, orgController.removeMember);

// Org Admin — bulk upload members from CSV
router.post('/:id/members/bulk', requireAuth, attachOrgMembership, requireOrgAdmin, uploadCSV, orgController.bulkAddMembers);

// Org Admin — email invites
router.post('/:id/members/invite', requireAuth, attachOrgMembership, requireOrgAdmin, validate(sendInviteSchema), inviteController.sendInvite);
router.get('/:id/invites', requireAuth, attachOrgMembership, requireOrgAdmin, inviteController.listInvites);

// Org Admin — org analytics (principal dashboard)
router.get('/:id/analytics', requireAuth, attachOrgMembership, requireOrgAdmin, orgController.orgAnalytics);

// Org Admin — org consultations listing
router.get('/:id/consultations', requireAuth, attachOrgMembership, requireOrgAdmin, orgController.orgConsultations);

// Org Admin — bulk upload history
router.get('/:id/bulk/history', requireAuth, attachOrgMembership, requireOrgAdmin, orgController.orgBulkHistory);

// Counsellor — get own assigned students
router.get('/:id/assignments/mine', requireAuth, orgController.getMyCounsellorAssignments);

// Student — get counsellors assigned to me
router.get('/:id/my-counsellors', requireAuth, orgController.getMyAssignedCounsellors);

// Org Admin — counsellor-student assignments
router.get('/:id/assignments', requireAuth, attachOrgMembership, requireOrgAdmin, orgController.listAssignments);
router.post('/:id/assignments', requireAuth, attachOrgMembership, requireOrgAdmin, validate(assignStudentSchema), orgController.assignStudent);
router.delete('/:id/assignments', requireAuth, attachOrgMembership, requireOrgAdmin, validate(unassignStudentSchema), orgController.unassignStudent);

// Org Admin — bulk assign entire class to counsellor
router.post('/:id/assignments/bulk-class', requireAuth, attachOrgMembership, requireOrgAdmin, validate(bulkAssignClassSchema), orgController.bulkAssignClass);

// Org Admin — parent consent management
router.get('/:id/consents', requireAuth, attachOrgMembership, requireOrgAdmin, consentController.listConsents);
router.put('/:id/consents/:memberId', requireAuth, attachOrgMembership, requireOrgAdmin, validate(saveConsentSchema), consentController.saveConsent);

// Super Admin or Org Admin — allocate credits to organization
router.post('/:id/credits', requireAuth, attachOrgMembership, requireOrgAdmin, validate(allocateCreditsSchema), orgController.allocateCredits);

// Org Admin — allocate credits to individual member
router.patch('/:id/members/:memberId/credits', requireAuth, attachOrgMembership, requireOrgAdmin, validate(allocateMemberCreditsSchema), orgController.allocateMemberCredits);

export default router;
