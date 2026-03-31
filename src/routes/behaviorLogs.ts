import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import * as controller from '../controllers/behaviorLogs';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createBehaviorLogSchema, updateCounselingStatusSchema } from '../validators/behaviorLogs';
import prisma from '../utils/prisma';

const router = Router();

/**
 * Middleware to attach org membership from query param ?orgId or from user's first membership.
 * Allows TEACHER, COUNSELLOR, ORG_ADMIN, and Super ADMIN.
 */
async function attachOrgFromQuery(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required', code: 'UNAUTHORIZED' });
    }

    // Super admin bypass - use orgId from query
    if (req.user?.role === 'ADMIN') {
      const orgId = parseInt(req.query.orgId as string);
      if (orgId && !isNaN(orgId)) {
        req.orgMembership = {
          id: 0,
          role: 'ORG_ADMIN',
          organizationId: orgId,
          class: null,
          department: null,
          creditBalance: 0,
        };
      } else {
        // Try to find any org membership for the admin
        const membership = await prisma.organizationMember.findFirst({ where: { userId } });
        if (membership) {
          req.orgMembership = {
            id: membership.id,
            role: membership.role,
            organizationId: membership.organizationId,
            class: membership.class,
            department: membership.department,
            creditBalance: membership.creditBalance,
          };
        }
      }
      return next();
    }

    // For regular users, find their membership
    const orgId = parseInt(req.query.orgId as string);
    let membership;

    if (orgId && !isNaN(orgId)) {
      membership = await prisma.organizationMember.findUnique({
        where: { userId_organizationId: { userId, organizationId: orgId } },
      });
    } else {
      membership = await prisma.organizationMember.findFirst({ where: { userId } });
    }

    if (!membership) {
      return res.status(403).json({ success: false, error: 'You are not a member of any organization', code: 'FORBIDDEN' });
    }

    req.orgMembership = {
      id: membership.id,
      role: membership.role,
      organizationId: membership.organizationId,
      class: membership.class,
      department: membership.department,
      creditBalance: membership.creditBalance,
    };

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware to require TEACHER, ORG_ADMIN, or Super ADMIN role.
 */
function requireTeacherOrAbove(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role === 'ADMIN') return next();

  if (!req.orgMembership) {
    return res.status(403).json({ success: false, error: 'Organization membership required', code: 'FORBIDDEN' });
  }

  const allowedRoles = ['TEACHER', 'ORG_ADMIN'];
  if (!allowedRoles.includes(req.orgMembership.role)) {
    return res.status(403).json({ success: false, error: 'Teacher or admin access required', code: 'FORBIDDEN' });
  }

  next();
}

/**
 * Middleware to require COUNSELLOR, ORG_ADMIN, or Super ADMIN role.
 */
function requireCounsellorOrAbove(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role === 'ADMIN') return next();

  if (!req.orgMembership) {
    return res.status(403).json({ success: false, error: 'Organization membership required', code: 'FORBIDDEN' });
  }

  const allowedRoles = ['COUNSELLOR', 'TEACHER', 'ORG_ADMIN'];
  if (!allowedRoles.includes(req.orgMembership.role)) {
    return res.status(403).json({ success: false, error: 'Counsellor or admin access required', code: 'FORBIDDEN' });
  }

  next();
}

// POST / — Teacher creates a behavior log
router.post('/', requireAuth, attachOrgFromQuery, requireTeacherOrAbove, validate(createBehaviorLogSchema), controller.createLog);

// GET / — Teacher/Counsellor lists logs with filters (?class=, ?studentId=)
router.get('/', requireAuth, attachOrgFromQuery, requireCounsellorOrAbove, controller.listLogs);

// GET /flagged — Counsellor gets flagged students
router.get('/flagged', requireAuth, attachOrgFromQuery, requireCounsellorOrAbove, controller.getFlaggedStudents);

// PUT /:id/counseling-status — Counsellor updates counseling status
router.put('/:id/counseling-status', requireAuth, attachOrgFromQuery, requireCounsellorOrAbove, validate(updateCounselingStatusSchema), controller.updateCounselingStatus);

export default router;
