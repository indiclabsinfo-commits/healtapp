import { Request, Response, NextFunction } from 'express';
import * as levelService from '../services/levels';
import { successResponse, errorResponse } from '../utils/response';

export async function createLevel(req: Request, res: Response, next: NextFunction) {
  try {
    const level = await levelService.createLevel(req.body);
    successResponse(res, level, 201);
  } catch (error: any) {
    if (error.status) {
      return errorResponse(res, error.message, error.status, error.code);
    }
    next(error);
  }
}

export async function updateLevel(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return errorResponse(res, 'Invalid level ID', 400, 'INVALID_ID');
    }

    const level = await levelService.updateLevel(id, req.body);
    successResponse(res, level);
  } catch (error: any) {
    if (error.status) {
      return errorResponse(res, error.message, error.status, error.code);
    }
    next(error);
  }
}

export async function deleteLevel(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return errorResponse(res, 'Invalid level ID', 400, 'INVALID_ID');
    }

    await levelService.deleteLevel(id);
    successResponse(res, { message: 'Level deleted' });
  } catch (error: any) {
    if (error.status) {
      return errorResponse(res, error.message, error.status, error.code);
    }
    next(error);
  }
}

export async function getQuestionsByLevel(req: Request, res: Response, next: NextFunction) {
  try {
    const levelId = parseInt(req.params.id);
    if (isNaN(levelId)) {
      return errorResponse(res, 'Invalid level ID', 400, 'INVALID_ID');
    }

    const questions = await levelService.getQuestionsByLevel(levelId);
    successResponse(res, questions);
  } catch (error: any) {
    if (error.status) {
      return errorResponse(res, error.message, error.status, error.code);
    }
    next(error);
  }
}
