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
} from '../validators/organizations';

const router = Router();

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

// Super Admin — allocate credits to organization
router.post('/:id/credits', requireAuth, requireAdmin, validate(allocateCreditsSchema), orgController.allocateCredits);

export default router;
