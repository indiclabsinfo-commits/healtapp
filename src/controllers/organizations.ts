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
    const limit = parseInt(req.query.limit as string) || 200;
    const filters = {
      role: req.query.role as string | undefined,
      class: req.query.class as string | undefined,
      flagged: req.query.flagged === 'true' ? true : undefined,
      counsellorMemberId: req.query.counsellorMemberId ? parseInt(req.query.counsellorMemberId as string) : undefined,
      search: req.query.search as string | undefined,
    };
    const { members, total } = await orgService.getOrgMembers(orgId, page, limit, filters);
    paginatedResponse(res, members, { page, limit, total });
  } catch (error: any) {
    if (error.status) {
      return errorResponse(res, error.message, error.status, error.code);
    }
    next(error);
  }
}

export async function assignStudent(req: Request, res: Response, next: NextFunction) {
  try {
    const orgId = parseInt(req.params.id);
    const { studentMemberId, counsellorMemberId } = req.body;
    if (!studentMemberId || !counsellorMemberId) {
      return errorResponse(res, 'studentMemberId and counsellorMemberId are required', 400, 'MISSING_FIELDS');
    }
    const result = await orgService.assignStudentToCounsellor(orgId, parseInt(studentMemberId), parseInt(counsellorMemberId), req.user!.userId);
    successResponse(res, result, 201);
  } catch (error: any) {
    if (error.status) return errorResponse(res, error.message, error.status, error.code);
    next(error);
  }
}

export async function unassignStudent(req: Request, res: Response, next: NextFunction) {
  try {
    const orgId = parseInt(req.params.id);
    const { studentMemberId, counsellorMemberId } = req.body;
    await orgService.removeStudentAssignment(orgId, parseInt(studentMemberId), parseInt(counsellorMemberId));
    successResponse(res, { message: 'Assignment removed' });
  } catch (error: any) {
    if (error.status) return errorResponse(res, error.message, error.status, error.code);
    next(error);
  }
}

export async function listAssignments(req: Request, res: Response, next: NextFunction) {
  try {
    const orgId = parseInt(req.params.id);
    const data = await orgService.getOrgCounsellorAssignments(orgId);
    successResponse(res, data);
  } catch (error: any) {
    if (error.status) return errorResponse(res, error.message, error.status, error.code);
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

export async function allocateMemberCredits(req: Request, res: Response, next: NextFunction) {
  try {
    const orgId = parseInt(req.params.id);
    const memberId = parseInt(req.params.memberId);
    const { amount } = req.body;
    if (!amount || amount <= 0) return errorResponse(res, 'Amount must be positive', 400, 'INVALID_AMOUNT');
    const result = await orgService.allocateMemberCredits(orgId, memberId, amount);
    successResponse(res, result);
  } catch (error: any) {
    if (error.status) return errorResponse(res, error.message, error.status, error.code);
    next(error);
  }
}

export async function registerOrganization(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await orgService.registerOrganization(req.body);
    successResponse(res, result, 201);
  } catch (error: any) {
    if (error.status) return errorResponse(res, error.message, error.status, error.code);
    next(error);
  }
}

export async function bulkAddMembers(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) return errorResponse(res, 'CSV file is required', 400, 'MISSING_FILE');
    const orgId = parseInt(req.params.id);
    const result = await orgService.bulkAddMembers(orgId, req.file.path, req.user!.userId);
    successResponse(res, result, 201);
  } catch (error: any) {
    if (error.status) return errorResponse(res, error.message, error.status, error.code);
    next(error);
  }
}

export async function orgBulkHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const orgId = parseInt(req.params.id);
    const limit = parseInt(req.query.limit as string) || 20;
    const data = await orgService.getOrgBulkHistory(orgId, limit);
    successResponse(res, data);
  } catch (error: any) {
    if (error.status) return errorResponse(res, error.message, error.status, error.code);
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
