import { Request, Response, NextFunction } from 'express';
import * as breathingService from '../services/breathing';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response';

export async function listExercises(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string) || 20));
    const category = req.query.category as string | undefined;
    const { data, pagination } = await breathingService.listExercises(page, limit, category);
    paginatedResponse(res, data, pagination);
  } catch (error: any) {
    if (error.status) return errorResponse(res, error.message, error.status, error.code);
    next(error);
  }
}

export async function getExerciseById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return errorResponse(res, 'Invalid ID', 400, 'INVALID_ID');
    const exercise = await breathingService.getExerciseById(id);
    successResponse(res, exercise);
  } catch (error: any) {
    if (error.status) return errorResponse(res, error.message, error.status, error.code);
    next(error);
  }
}

export async function createExercise(req: Request, res: Response, next: NextFunction) {
  try {
    const exercise = await breathingService.createExercise(req.body);
    successResponse(res, exercise, 201);
  } catch (error: any) {
    if (error.status) return errorResponse(res, error.message, error.status, error.code);
    next(error);
  }
}

export async function updateExercise(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return errorResponse(res, 'Invalid ID', 400, 'INVALID_ID');
    const exercise = await breathingService.updateExercise(id, req.body);
    successResponse(res, exercise);
  } catch (error: any) {
    if (error.status) return errorResponse(res, error.message, error.status, error.code);
    next(error);
  }
}

export async function deleteExercise(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return errorResponse(res, 'Invalid ID', 400, 'INVALID_ID');
    await breathingService.deleteExercise(id);
    successResponse(res, { message: 'Breathing exercise deactivated' });
  } catch (error: any) {
    if (error.status) return errorResponse(res, error.message, error.status, error.code);
    next(error);
  }
}

export async function toggleFavourite(req: Request, res: Response, next: NextFunction) {
  try {
    const exerciseId = parseInt(req.params.id);
    if (isNaN(exerciseId)) return errorResponse(res, 'Invalid ID', 400, 'INVALID_ID');
    const result = await breathingService.toggleFavourite(req.user!.userId, exerciseId);
    successResponse(res, result);
  } catch (error: any) {
    if (error.status) return errorResponse(res, error.message, error.status, error.code);
    next(error);
  }
}

export async function getFavourites(req: Request, res: Response, next: NextFunction) {
  try {
    const favourites = await breathingService.getFavourites(req.user!.userId);
    successResponse(res, favourites);
  } catch (error: any) {
    if (error.status) return errorResponse(res, error.message, error.status, error.code);
    next(error);
  }
}

export async function logCompletion(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await breathingService.logCompletion(req.user!.userId, req.body);
    successResponse(res, result, 201);
  } catch (error: any) {
    if (error.status) return errorResponse(res, error.message, error.status, error.code);
    next(error);
  }
}

export async function getHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string) || 20));
    const { data, pagination } = await breathingService.getHistory(req.user!.userId, page, limit);
    paginatedResponse(res, data, pagination);
  } catch (error: any) {
    if (error.status) return errorResponse(res, error.message, error.status, error.code);
    next(error);
  }
}
