import { Request, Response, NextFunction } from 'express';
import * as behaviorLogService from '../services/behaviorLogs';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response';

export async function createLog(req: Request, res: Response, next: NextFunction) {
  try {
    const teacherId = req.user!.userId;
    const orgId = req.orgMembership!.organizationId;
    const log = await behaviorLogService.createLog(teacherId, orgId, req.body);
    successResponse(res, log, 201);
  } catch (error: any) {
    if (error.status) return errorResponse(res, error.message, error.status, error.code);
    next(error);
  }
}

export async function listLogs(req: Request, res: Response, next: NextFunction) {
  try {
    const orgId = req.orgMembership!.organizationId;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string) || 20));
    const className = req.query.class as string | undefined;
    const studentId = req.query.studentId ? parseInt(req.query.studentId as string) : undefined;

    const { data, pagination } = await behaviorLogService.getLogsByClass(orgId, className, page, limit, studentId);
    paginatedResponse(res, data, pagination);
  } catch (error: any) {
    if (error.status) return errorResponse(res, error.message, error.status, error.code);
    next(error);
  }
}

export async function getFlaggedStudents(req: Request, res: Response, next: NextFunction) {
  try {
    const orgId = req.orgMembership!.organizationId;
    const flagged = await behaviorLogService.getFlaggedStudents(orgId);
    successResponse(res, flagged);
  } catch (error: any) {
    if (error.status) return errorResponse(res, error.message, error.status, error.code);
    next(error);
  }
}

export async function updateCounselingStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const logId = parseInt(req.params.id);
    if (isNaN(logId)) return errorResponse(res, 'Invalid ID', 400, 'INVALID_ID');
    const { counselingStatus } = req.body;
    const log = await behaviorLogService.updateCounselingStatus(logId, counselingStatus);
    successResponse(res, log);
  } catch (error: any) {
    if (error.status) return errorResponse(res, error.message, error.status, error.code);
    next(error);
  }
}
