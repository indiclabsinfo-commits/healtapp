import { Request, Response, NextFunction } from 'express';
import * as analyticsService from '../services/analytics';
import { successResponse, errorResponse } from '../utils/response';

export async function getUserAnalytics(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await analyticsService.getUserAnalytics(req.user!.userId);
    successResponse(res, data);
  } catch (error: any) {
    if (error.status) return errorResponse(res, error.message, error.status, error.code);
    next(error);
  }
}

export async function getAdminAnalytics(_req: Request, res: Response, next: NextFunction) {
  try {
    const data = await analyticsService.getAdminAnalytics();
    successResponse(res, data);
  } catch (error: any) {
    if (error.status) return errorResponse(res, error.message, error.status, error.code);
    next(error);
  }
}

export async function exportCSV(_req: Request, res: Response, next: NextFunction) {
  try {
    const buffer = await analyticsService.exportAnalyticsCSV();
    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename=mindcare-analytics.csv',
    });
    res.send(buffer);
  } catch (error: any) {
    next(error);
  }
}
