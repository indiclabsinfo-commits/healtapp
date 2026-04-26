import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import * as counsellorService from '../services/counsellors';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response';
import { uploadImageBuffer } from '../utils/cloudinary';

/** Resolve photo path: upload to Cloudinary in prod, save to disk in local dev */
async function resolvePhotoPath(file: Express.Multer.File): Promise<string> {
  if (process.env.CLOUDINARY_CLOUD_NAME) {
    return uploadImageBuffer(file.buffer);
  }
  // Local dev fallback: write buffer to disk
  const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const ext = path.extname(file.originalname);
  const filename = `photo-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, filename), file.buffer);
  return `/uploads/${filename}`;
}

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
    if (typeof data.hourlyRate === 'string') data.hourlyRate = parseFloat(data.hourlyRate);

    const email = data.email;
    delete data.email; // not a Counsellor field — handled via linkUserAccount

    const photoPath = req.file ? await resolvePhotoPath(req.file) : undefined;
    const counsellor = await counsellorService.createCounsellor(data, photoPath);

    // Auto-link user account if email provided
    if (email) {
      try { await counsellorService.linkUserAccount(counsellor.id, email); } catch { /* ignore */ }
    }

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
    if (typeof data.hourlyRate === 'string') data.hourlyRate = parseFloat(data.hourlyRate);
    delete data.email;

    const photoPath = req.file ? await resolvePhotoPath(req.file) : undefined;
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

export async function linkUser(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id);
    const { email } = req.body;
    if (!email) return errorResponse(res, 'email required', 400, 'VALIDATION_ERROR');
    const result = await counsellorService.linkUserAccount(id, email);
    successResponse(res, result);
  } catch (error: any) {
    if (error.status) return errorResponse(res, error.message, error.status, error.code);
    next(error);
  }
}
