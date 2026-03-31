import { Request, Response, NextFunction } from 'express';
import * as questionnaireService from '../services/questionnaires';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response';

export async function listQuestionnaires(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string) || 20));
    const published = req.query.published === 'true' ? true : req.query.published === 'false' ? false : undefined;

    const { data, pagination } = await questionnaireService.listQuestionnaires(page, limit, published);
    paginatedResponse(res, data, pagination);
  } catch (error: any) {
    if (error.status) return errorResponse(res, error.message, error.status, error.code);
    next(error);
  }
}

export async function getQuestionnaireById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return errorResponse(res, 'Invalid ID', 400, 'INVALID_ID');
    const questionnaire = await questionnaireService.getQuestionnaireById(id);
    successResponse(res, questionnaire);
  } catch (error: any) {
    if (error.status) return errorResponse(res, error.message, error.status, error.code);
    next(error);
  }
}

export async function createQuestionnaire(req: Request, res: Response, next: NextFunction) {
  try {
    const questionnaire = await questionnaireService.createQuestionnaire(req.body);
    successResponse(res, questionnaire, 201);
  } catch (error: any) {
    if (error.status) return errorResponse(res, error.message, error.status, error.code);
    next(error);
  }
}

export async function updateQuestionnaire(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return errorResponse(res, 'Invalid ID', 400, 'INVALID_ID');
    const questionnaire = await questionnaireService.updateQuestionnaire(id, req.body);
    successResponse(res, questionnaire);
  } catch (error: any) {
    if (error.status) return errorResponse(res, error.message, error.status, error.code);
    next(error);
  }
}

export async function deleteQuestionnaire(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return errorResponse(res, 'Invalid ID', 400, 'INVALID_ID');
    await questionnaireService.deleteQuestionnaire(id);
    successResponse(res, { message: 'Questionnaire deleted' });
  } catch (error: any) {
    if (error.status) return errorResponse(res, error.message, error.status, error.code);
    next(error);
  }
}
