import { Request, Response, NextFunction } from 'express';
import * as questionService from '../services/questions';
import { successResponse, errorResponse } from '../utils/response';

export async function createQuestion(req: Request, res: Response, next: NextFunction) {
  try {
    const question = await questionService.createQuestion(req.body);
    successResponse(res, question, 201);
  } catch (error: any) {
    if (error.status) {
      return errorResponse(res, error.message, error.status, error.code);
    }
    next(error);
  }
}

export async function updateQuestion(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return errorResponse(res, 'Invalid question ID', 400, 'INVALID_ID');
    }

    const question = await questionService.updateQuestion(id, req.body);
    successResponse(res, question);
  } catch (error: any) {
    if (error.status) {
      return errorResponse(res, error.message, error.status, error.code);
    }
    next(error);
  }
}

export async function deleteQuestion(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return errorResponse(res, 'Invalid question ID', 400, 'INVALID_ID');
    }

    await questionService.deleteQuestion(id);
    successResponse(res, { message: 'Question deleted' });
  } catch (error: any) {
    if (error.status) {
      return errorResponse(res, error.message, error.status, error.code);
    }
    next(error);
  }
}
