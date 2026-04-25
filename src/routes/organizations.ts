import { Router } from 'express';
import * as orgController from '../controllers/organizations';
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
  registerOrganizationSchema,
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

// Super Admin — update organization
router.put('/:id', requireAuth, requireAdmin, validate(updateOrganizationSchema), orgController.updateOrganization);

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

// Org Admin — bulk upload history
router.get('/:id/bulk/history', requireAuth, attachOrgMembership, requireOrgAdmin, orgController.orgBulkHistory);

// Org Admin — counsellor-student assignments
router.get('/:id/assignments', requireAuth, attachOrgMembership, requireOrgAdmin, orgController.listAssignments);
router.post('/:id/assignments', requireAuth, attachOrgMembership, requireOrgAdmin, orgController.assignStudent);
router.delete('/:id/assignments', requireAuth, attachOrgMembership, requireOrgAdmin, orgController.unassignStudent);

// Super Admin — allocate credits to organization
router.post('/:id/credits', requireAuth, requireAdmin, validate(allocateCreditsSchema), orgController.allocateCredits);

// Org Admin — allocate credits to individual member
router.patch('/:id/members/:memberId/credits', requireAuth, attachOrgMembership, requireOrgAdmin, orgController.allocateMemberCredits);

export default router;
