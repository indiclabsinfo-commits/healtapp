import { Request, Response, NextFunction } from 'express';
import * as assessmentService from '../services/assessments';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response';

export async function submitAssessment(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await assessmentService.submitAssessment(req.user!.userId, req.body);
    successResponse(res, result, 201);
  } catch (error: any) {
    if (error.status) return errorResponse(res, error.message, error.status, error.code);
    next(error);
  }
}

export async function getUserAssessments(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) return errorResponse(res, 'Invalid user ID', 400, 'INVALID_ID');
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string) || 50));
    const { data, pagination } = await assessmentService.getUserAssessments(userId, page, limit);
    paginatedResponse(res, data, pagination);
  } catch (error: any) {
    if (error.status) return errorResponse(res, error.message, error.status, error.code);
    next(error);
  }
}

export async function getMyAssessments(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string) || 20));
    const { data, pagination } = await assessmentService.getMyAssessments(req.user!.userId, page, limit);
    paginatedResponse(res, data, pagination);
  } catch (error: any) {
    if (error.status) return errorResponse(res, error.message, error.status, error.code);
    next(error);
  }
}

export async function getAssessmentById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return errorResponse(res, 'Invalid ID', 400, 'INVALID_ID');
    const assessment = await assessmentService.getAssessmentById(req.user!.userId, id);
    successResponse(res, assessment);
  } catch (error: any) {
    if (error.status) return errorResponse(res, error.message, error.status, error.code);
    next(error);
  }
}
