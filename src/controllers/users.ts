import { Request, Response, NextFunction } from 'express';
import * as userService from '../services/users';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response';

export async function listUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string) || 20));
    const search = req.query.search as string | undefined;
    const status = req.query.status as string | undefined;

    const { data, pagination } = await userService.listUsers(page, limit, search, status);
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

    const user = await userService.updateUser(id, req.body);
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
