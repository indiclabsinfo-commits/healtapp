import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';

// Extend Express Request to include org membership
declare global {
  namespace Express {
    interface Request {
      orgMembership?: {
        id: number;
        role: string;
        organizationId: number;
        class?: string | null;
        department?: string | null;
        creditBalance: number;
      };
    }
  }
}

/**
 * Attaches the user's org membership to req.orgMembership for the org in req.params.id.
 * Must be used after requireAuth.
 */
export function attachOrgMembership(req: Request, res: Response, next: NextFunction) {
  const orgId = parseInt(req.params.id);
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      code: 'UNAUTHORIZED',
    });
  }

  if (isNaN(orgId)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid organization ID',
      code: 'INVALID_ID',
    });
  }

  prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId, organizationId: orgId } },
  }).then((membership) => {
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
    next();
  }).catch(next);
}

/**
 * Checks if the user is ORG_ADMIN of the org in req.params.id, OR a Super Admin (role ADMIN).
 * Must be used after requireAuth and attachOrgMembership.
 */
export function requireOrgAdmin(req: Request, res: Response, next: NextFunction) {
  // Super Admin (platform ADMIN) always has access
  if (req.user?.role === 'ADMIN') {
    return next();
  }

  if (!req.orgMembership || req.orgMembership.role !== 'ORG_ADMIN') {
    return res.status(403).json({
      success: false,
      error: 'Organization admin access required',
      code: 'FORBIDDEN',
    });
  }

  next();
}

/**
 * Checks if the user is a member of the org in req.params.id, OR a Super Admin.
 * Must be used after requireAuth and attachOrgMembership.
 */
export function requireOrgMember(req: Request, res: Response, next: NextFunction) {
  // Super Admin always has access
  if (req.user?.role === 'ADMIN') {
    return next();
  }

  if (!req.orgMembership) {
    return res.status(403).json({
      success: false,
      error: 'You are not a member of this organization',
      code: 'FORBIDDEN',
    });
  }

  next();
}

/**
 * Checks if the user's member role is TEACHER in the org, OR a Super Admin/ORG_ADMIN.
 * Must be used after requireAuth and attachOrgMembership.
 */
export function requireTeacher(req: Request, res: Response, next: NextFunction) {
  // Super Admin always has access
  if (req.user?.role === 'ADMIN') {
    return next();
  }

  if (!req.orgMembership) {
    return res.status(403).json({
      success: false,
      error: 'You are not a member of this organization',
      code: 'FORBIDDEN',
    });
  }

  const allowedRoles = ['TEACHER', 'ORG_ADMIN'];
  if (!allowedRoles.includes(req.orgMembership.role)) {
    return res.status(403).json({
      success: false,
      error: 'Teacher or admin access required',
      code: 'FORBIDDEN',
    });
  }

  next();
}
