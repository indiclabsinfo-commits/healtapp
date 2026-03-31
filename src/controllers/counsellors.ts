import { Request, Response, NextFunction } from 'express';
import * as counsellorService from '../services/counsellors';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response';

export async function listCounsellors(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string) || 20));
    const search = req.query.search as string | undefined;
    const tag = req.query.tag as string | undefined;

    const { data, pagination } = await counsellorService.listCounsellors(page, limit, search, tag);
    paginatedResponse(res, data, pagination);
  } catch (error: any) {
    if (error.status) {
      return errorResponse(res, error.message, error.status, error.code);
    }
    next(error);
  }
}

export async function getCounsellorById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return errorResponse(res, 'Invalid counsellor ID', 400, 'INVALID_ID');
    }

    const counsellor = await counsellorService.getCounsellorById(id);
    successResponse(res, counsellor);
  } catch (error: any) {
    if (error.status) {
      return errorResponse(res, error.message, error.status, error.code);
    }
    next(error);
  }
}

export async function createCounsellor(req: Request, res: Response, next: NextFunction) {
  try {
    const data = { ...req.body };

    // Parse tags from JSON string (multipart/form-data sends strings)
    if (typeof data.tags === 'string') {
      try { data.tags = JSON.parse(data.tags); } catch { data.tags = []; }
    }

    // Parse numeric fields from string
    if (typeof data.experience === 'string') data.experience = parseInt(data.experience);
    if (typeof data.rating === 'string') data.rating = parseFloat(data.rating);

    const photoPath = req.file ? `/uploads/${req.file.filename}` : undefined;
    const counsellor = await counsellorService.createCounsellor(data, photoPath);
    successResponse(res, counsellor, 201);
  } catch (error: any) {
    if (error.status) {
      return errorResponse(res, error.message, error.status, error.code);
    }
    next(error);
  }
}

export async function updateCounsellor(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return errorResponse(res, 'Invalid counsellor ID', 400, 'INVALID_ID');
    }

    const data = { ...req.body };

    // Parse tags from JSON string
    if (typeof data.tags === 'string') {
      try { data.tags = JSON.parse(data.tags); } catch { data.tags = []; }
    }

    // Parse numeric fields
    if (typeof data.experience === 'string') data.experience = parseInt(data.experience);
    if (typeof data.rating === 'string') data.rating = parseFloat(data.rating);

    const photoPath = req.file ? `/uploads/${req.file.filename}` : undefined;
    const counsellor = await counsellorService.updateCounsellor(id, data, photoPath);
    successResponse(res, counsellor);
  } catch (error: any) {
    if (error.status) {
      return errorResponse(res, error.message, error.status, error.code);
    }
    next(error);
  }
}

export async function deleteCounsellor(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return errorResponse(res, 'Invalid counsellor ID', 400, 'INVALID_ID');
    }

    await counsellorService.deleteCounsellor(id);
    successResponse(res, { message: 'Counsellor deactivated' });
  } catch (error: any) {
    if (error.status) {
      return errorResponse(res, error.message, error.status, error.code);
    }
    next(error);
  }
}
