import { Request, Response, NextFunction } from 'express';
import * as assignmentService from '../services/assignments';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response';

export async function createAssignment(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const orgId = parseInt(req.query.orgId as string || req.body.orgId);
    if (isNaN(orgId)) {
      return errorResponse(res, 'Organization ID required (pass as ?orgId=X)', 400, 'VALIDATION_ERROR');
    }
    const assignment = await assignmentService.createAssignment(userId, orgId, req.body);
    successResponse(res, assignment, 201);
  } catch (error: any) {
    if (error.status) return errorResponse(res, error.message, error.status, error.code);
    next(error);
  }
}

export async function listAssignments(req: Request, res: Response, next: NextFunction) {
  try {
    const orgId = parseInt(req.query.orgId as string);
    if (isNaN(orgId)) {
      return errorResponse(res, 'Organization ID required (pass as ?orgId=X)', 400, 'VALIDATION_ERROR');
    }
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string) || 20));
    const { data, pagination } = await assignmentService.listAssignments(orgId, page, limit);
    paginatedResponse(res, data, pagination);
  } catch (error: any) {
    if (error.status) return errorResponse(res, error.message, error.status, error.code);
    next(error);
  }
}

export async function getMyAssignments(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const orgId = parseInt(req.query.orgId as string);
    if (isNaN(orgId)) {
      return errorResponse(res, 'Organization ID required (pass as ?orgId=X)', 400, 'VALIDATION_ERROR');
    }
    const assignments = await assignmentService.getMyAssignments(userId, orgId);
    successResponse(res, assignments);
  } catch (error: any) {
    if (error.status) return errorResponse(res, error.message, error.status, error.code);
    next(error);
  }
}

export async function updateAssignment(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return errorResponse(res, 'Invalid ID', 400, 'INVALID_ID');
    const assignment = await assignmentService.updateAssignment(id, req.body);
    successResponse(res, assignment);
  } catch (error: any) {
    if (error.status) return errorResponse(res, error.message, error.status, error.code);
    next(error);
  }
}

export async function deleteAssignment(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return errorResponse(res, 'Invalid ID', 400, 'INVALID_ID');
    const assignment = await assignmentService.deleteAssignment(id);
    successResponse(res, assignment);
  } catch (error: any) {
    if (error.status) return errorResponse(res, error.message, error.status, error.code);
    next(error);
  }
}
