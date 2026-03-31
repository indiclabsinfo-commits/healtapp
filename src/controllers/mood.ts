import { Request, Response, NextFunction } from 'express';
import * as moodService from '../services/mood';
import { successResponse, errorResponse } from '../utils/response';

export async function logMood(req: Request, res: Response, next: NextFunction) {
  try {
    const log = await moodService.logMood(req.user!.userId, req.body.mood);
    successResponse(res, log, 201);
  } catch (error: any) {
    if (error.status) return errorResponse(res, error.message, error.status, error.code);
    next(error);
  }
}

export async function getMoodHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const history = await moodService.getMoodHistory(req.user!.userId, days);
    successResponse(res, history);
  } catch (error: any) {
    if (error.status) return errorResponse(res, error.message, error.status, error.code);
    next(error);
  }
}
