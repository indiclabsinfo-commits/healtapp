import { Request, Response, NextFunction } from 'express';
import * as orgService from '../services/organizations';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response';

export async function validateCode(req: Request, res: Response, next: NextFunction) {
  try {
    const { code } = req.body;
    const org = await orgService.validateCode(code);
    successResponse(res, org);
  } catch (error: any) {
    if (error.status) {
      return errorResponse(res, error.message, error.status, error.code);
    }
    next(error);
  }
}

export async function listOrganizations(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const { organizations, total } = await orgService.listOrganizations(page, limit);
    paginatedResponse(res, organizations, { page, limit, total });
  } catch (error: any) {
    if (error.status) {
      return errorResponse(res, error.message, error.status, error.code);
    }
    next(error);
  }
}

export async function getOrganization(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id);
    const org = await orgService.getOrganizationById(id);
    successResponse(res, org);
  } catch (error: any) {
    if (error.status) {
      return errorResponse(res, error.message, error.status, error.code);
    }
    next(error);
  }
}

export async function createOrganization(req: Request, res: Response, next: NextFunction) {
  try {
    const org = await orgService.createOrganization(req.body);
    successResponse(res, org, 201);
  } catch (error: any) {
    if (error.status) {
      return errorResponse(res, error.message, error.status, error.code);
    }
    next(error);
  }
}

export async function updateOrganization(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id);
    const org = await orgService.updateOrganization(id, req.body);
    successResponse(res, org);
  } catch (error: any) {
    if (error.status) {
      return errorResponse(res, error.message, error.status, error.code);
    }
    next(error);
  }
}

export async function deleteOrganization(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id);
    const org = await orgService.deleteOrganization(id);
    successResponse(res, org);
  } catch (error: any) {
    if (error.status) {
      return errorResponse(res, error.message, error.status, error.code);
    }
    next(error);
  }
}

export async function getMembers(req: Request, res: Response, next: NextFunction) {
  try {
    const orgId = parseInt(req.params.id);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const { members, total } = await orgService.getOrgMembers(orgId, page, limit);
    paginatedResponse(res, members, { page, limit, total });
  } catch (error: any) {
    if (error.status) {
      return errorResponse(res, error.message, error.status, error.code);
    }
    next(error);
  }
}

export async function addMember(req: Request, res: Response, next: NextFunction) {
  try {
    const orgId = parseInt(req.params.id);
    const { userId, role, class: memberClass, department } = req.body;
    const member = await orgService.addMember(orgId, userId, role, memberClass, department);
    successResponse(res, member, 201);
  } catch (error: any) {
    if (error.status) {
      return errorResponse(res, error.message, error.status, error.code);
    }
    next(error);
  }
}

export async function updateMemberRole(req: Request, res: Response, next: NextFunction) {
  try {
    const memberId = parseInt(req.params.memberId);
    const { role } = req.body;
    const member = await orgService.updateMemberRole(memberId, role);
    successResponse(res, member);
  } catch (error: any) {
    if (error.status) {
      return errorResponse(res, error.message, error.status, error.code);
    }
    next(error);
  }
}

export async function removeMember(req: Request, res: Response, next: NextFunction) {
  try {
    const memberId = parseInt(req.params.memberId);
    await orgService.removeMember(memberId);
    successResponse(res, { message: 'Member removed successfully' });
  } catch (error: any) {
    if (error.status) {
      return errorResponse(res, error.message, error.status, error.code);
    }
    next(error);
  }
}

export async function allocateCredits(req: Request, res: Response, next: NextFunction) {
  try {
    const orgId = parseInt(req.params.id);
    const { amount } = req.body;
    const result = await orgService.allocateCredits(orgId, amount);
    successResponse(res, result);
  } catch (error: any) {
    if (error.status) {
      return errorResponse(res, error.message, error.status, error.code);
    }
    next(error);
  }
}

export async function getMyCredits(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const orgId = req.query.orgId ? parseInt(req.query.orgId as string) : undefined;
    const result = await orgService.getUserCredits(userId, orgId);
    successResponse(res, result);
  } catch (error: any) {
    if (error.status) {
      return errorResponse(res, error.message, error.status, error.code);
    }
    next(error);
  }
}
