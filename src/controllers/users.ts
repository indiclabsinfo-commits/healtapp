import { Request, Response, NextFunction } from 'express';
import * as userService from '../services/users';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response';

export async function listUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string) || 20));
    const search = req.query.search as string | undefined;
    const status = req.query.status as string | undefined;

    const orgId = req.adminOrgId; // null = super admin sees all, number = org-scoped
    const { data, pagination } = await userService.listUsers(page, limit, search, status, orgId ?? undefined);
    paginatedResponse(res, data, pagination);
  } catch (error: any) {
    if (error.status) {
      return errorResponse(res, error.message, error.status, error.code);
    }
    next(error);
  }
}

export async function getUserById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return errorResponse(res, 'Invalid user ID', 400, 'INVALID_ID');
    }

    const user = await userService.getUserById(id);
    successResponse(res, user);
  } catch (error: any) {
    if (error.status) {
      return errorResponse(res, error.message, error.status, error.code);
    }
    next(error);
  }
}

export async function updateUser(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return errorResponse(res, 'Invalid user ID', 400, 'INVALID_ID');
    }

    const data = { ...req.body };
    // SECURITY: only super admins can change platform role (USER ↔ ADMIN).
    // Non-super-admins are allowed to set ORG roles (Student/Teacher/etc) — service routes those
    // to OrganizationMember, not User.role — but must NOT be able to set role=ADMIN to escalate.
    const isSuperAdmin = req.user?.role === 'ADMIN' && req.adminOrgId == null;
    const PLATFORM_ROLES = ['USER', 'ADMIN'];
    if (!isSuperAdmin && data.role && PLATFORM_ROLES.includes(data.role)) {
      delete data.role;
    }

    const user = await userService.updateUser(id, data, req.adminOrgId ?? undefined);
    successResponse(res, user);
  } catch (error: any) {
    if (error.status) {
      return errorResponse(res, error.message, error.status, error.code);
    }
    next(error);
  }
}

export async function toggleStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return errorResponse(res, 'Invalid user ID', 400, 'INVALID_ID');
    }

    const user = await userService.toggleUserStatus(id, req.body.status);
    successResponse(res, user);
  } catch (error: any) {
    if (error.status) {
      return errorResponse(res, error.message, error.status, error.code);
    }
    next(error);
  }
}

export async function bulkRegister(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      return errorResponse(res, 'CSV file is required', 400, 'MISSING_FILE');
    }

    const result = await userService.bulkRegisterFromCSV(req.file.path, req.user!.userId);
    successResponse(res, result, 201);
  } catch (error: any) {
    if (error.status) {
      return errorResponse(res, error.message, error.status, error.code);
    }
    next(error);
  }
}

export async function bulkHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string) || 20));

    const { data, pagination } = await userService.getBulkHistory(page, limit);
    paginatedResponse(res, data, pagination);
  } catch (error: any) {
    if (error.status) {
      return errorResponse(res, error.message, error.status, error.code);
    }
    next(error);
  }
}

export async function getUserMoodLogs(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return errorResponse(res, 'Invalid user ID', 400, 'INVALID_ID');
    const days = parseInt(req.query.days as string) || 30;
    const logs = await userService.getUserMoodLogs(id, days);
    successResponse(res, logs);
  } catch (error: any) {
    if (error.status) return errorResponse(res, error.message, error.status, error.code);
    next(error);
  }
}

export async function downloadTemplate(_req: Request, res: Response, next: NextFunction) {
  try {
    const buffer = userService.getCSVTemplate();
    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename=bulk-register-template.csv',
    });
    res.send(buffer);
  } catch (error: any) {
    next(error);
  }
}
