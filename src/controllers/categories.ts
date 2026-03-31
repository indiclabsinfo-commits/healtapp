import { Request, Response, NextFunction } from 'express';
import * as categoryService from '../services/categories';
import { successResponse, errorResponse } from '../utils/response';

export async function listCategories(_req: Request, res: Response, next: NextFunction) {
  try {
    const categories = await categoryService.listCategories();
    successResponse(res, categories);
  } catch (error: any) {
    if (error.status) {
      return errorResponse(res, error.message, error.status, error.code);
    }
    next(error);
  }
}

export async function createCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const category = await categoryService.createCategory(req.body);
    successResponse(res, category, 201);
  } catch (error: any) {
    if (error.status) {
      return errorResponse(res, error.message, error.status, error.code);
    }
    next(error);
  }
}

export async function updateCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return errorResponse(res, 'Invalid category ID', 400, 'INVALID_ID');
    }

    const category = await categoryService.updateCategory(id, req.body);
    successResponse(res, category);
  } catch (error: any) {
    if (error.status) {
      return errorResponse(res, error.message, error.status, error.code);
    }
    next(error);
  }
}

export async function deleteCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return errorResponse(res, 'Invalid category ID', 400, 'INVALID_ID');
    }

    await categoryService.deleteCategory(id);
    successResponse(res, { message: 'Category deleted' });
  } catch (error: any) {
    if (error.status) {
      return errorResponse(res, error.message, error.status, error.code);
    }
    next(error);
  }
}

export async function getLevelsByCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const categoryId = parseInt(req.params.id);
    if (isNaN(categoryId)) {
      return errorResponse(res, 'Invalid category ID', 400, 'INVALID_ID');
    }

    const levels = await categoryService.getLevelsByCategory(categoryId);
    successResponse(res, levels);
  } catch (error: any) {
    if (error.status) {
      return errorResponse(res, error.message, error.status, error.code);
    }
    next(error);
  }
}
