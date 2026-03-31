import { Request, Response, NextFunction } from 'express';
import * as theoryService from '../services/theory';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response';

export async function listTheorySessions(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string) || 20));
    const status = req.query.status as string | undefined;
    const { data, pagination } = await theoryService.listTheorySessions(page, limit, status);
    paginatedResponse(res, data, pagination);
  } catch (error: any) {
    if (error.status) return errorResponse(res, error.message, error.status, error.code);
    next(error);
  }
}

export async function getTheorySessionById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return errorResponse(res, 'Invalid ID', 400, 'INVALID_ID');
    const session = await theoryService.getTheorySessionById(id);
    successResponse(res, session);
  } catch (error: any) {
    if (error.status) return errorResponse(res, error.message, error.status, error.code);
    next(error);
  }
}

export async function createTheorySession(req: Request, res: Response, next: NextFunction) {
  try {
    const session = await theoryService.createTheorySession(req.body);
    successResponse(res, session, 201);
  } catch (error: any) {
    if (error.status) return errorResponse(res, error.message, error.status, error.code);
    next(error);
  }
}

export async function updateTheorySession(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return errorResponse(res, 'Invalid ID', 400, 'INVALID_ID');
    const session = await theoryService.updateTheorySession(id, req.body);
    successResponse(res, session);
  } catch (error: any) {
    if (error.status) return errorResponse(res, error.message, error.status, error.code);
    next(error);
  }
}

export async function deleteTheorySession(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return errorResponse(res, 'Invalid ID', 400, 'INVALID_ID');
    await theoryService.deleteTheorySession(id);
    successResponse(res, { message: 'Theory session deleted' });
  } catch (error: any) {
    if (error.status) return errorResponse(res, error.message, error.status, error.code);
    next(error);
  }
}

export async function updateProgress(req: Request, res: Response, next: NextFunction) {
  try {
    const sessionId = parseInt(req.params.id);
    if (isNaN(sessionId)) return errorResponse(res, 'Invalid ID', 400, 'INVALID_ID');
    const progress = await theoryService.updateProgress(req.user!.userId, sessionId, req.body);
    successResponse(res, progress);
  } catch (error: any) {
    if (error.status) return errorResponse(res, error.message, error.status, error.code);
    next(error);
  }
}

export async function getProgress(req: Request, res: Response, next: NextFunction) {
  try {
    const sessionId = parseInt(req.params.id);
    if (isNaN(sessionId)) return errorResponse(res, 'Invalid ID', 400, 'INVALID_ID');
    const progress = await theoryService.getProgress(req.user!.userId, sessionId);
    successResponse(res, progress || { completedModules: [], completed: false });
  } catch (error: any) {
    if (error.status) return errorResponse(res, error.message, error.status, error.code);
    next(error);
  }
}
