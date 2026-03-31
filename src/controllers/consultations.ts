import { Request, Response, NextFunction } from 'express';
import * as consultationService from '../services/consultations';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response';

export async function getSlots(req: Request, res: Response, next: NextFunction) {
  try {
    const counsellorId = parseInt(req.params.counsellorId);
    if (isNaN(counsellorId)) return errorResponse(res, 'Invalid counsellor ID', 400, 'INVALID_ID');
    const slots = await consultationService.getSlots(counsellorId);
    successResponse(res, slots);
  } catch (error: any) {
    if (error.status) return errorResponse(res, error.message, error.status, error.code);
    next(error);
  }
}

export async function setSlots(req: Request, res: Response, next: NextFunction) {
  try {
    const counsellorId = parseInt(req.params.counsellorId);
    if (isNaN(counsellorId)) return errorResponse(res, 'Invalid counsellor ID', 400, 'INVALID_ID');
    const slots = await consultationService.setSlots(counsellorId, req.body);
    successResponse(res, slots);
  } catch (error: any) {
    if (error.status) return errorResponse(res, error.message, error.status, error.code);
    next(error);
  }
}

export async function getAvailability(req: Request, res: Response, next: NextFunction) {
  try {
    const counsellorId = parseInt(req.params.counsellorId);
    if (isNaN(counsellorId)) return errorResponse(res, 'Invalid counsellor ID', 400, 'INVALID_ID');
    const date = req.query.date as string;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return errorResponse(res, 'Date parameter required in YYYY-MM-DD format', 400, 'VALIDATION_ERROR');
    }
    const availability = await consultationService.getAvailability(counsellorId, date);
    successResponse(res, availability);
  } catch (error: any) {
    if (error.status) return errorResponse(res, error.message, error.status, error.code);
    next(error);
  }
}

export async function bookConsultation(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    // orgId can come from query param or body
    const orgId = parseInt(req.query.orgId as string || req.body.orgId);
    if (isNaN(orgId)) {
      return errorResponse(res, 'Organization ID required (pass as ?orgId=X)', 400, 'VALIDATION_ERROR');
    }
    const consultation = await consultationService.bookConsultation(userId, orgId, req.body);
    successResponse(res, consultation, 201);
  } catch (error: any) {
    if (error.status) return errorResponse(res, error.message, error.status, error.code);
    next(error);
  }
}

export async function getMyConsultations(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string) || 20));
    const { data, pagination } = await consultationService.getMyConsultations(req.user!.userId, page, limit);
    paginatedResponse(res, data, pagination);
  } catch (error: any) {
    if (error.status) return errorResponse(res, error.message, error.status, error.code);
    next(error);
  }
}

export async function getCounsellorConsultations(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string) || 20));
    const counsellorId = parseInt(req.query.counsellorId as string);
    if (isNaN(counsellorId)) {
      return errorResponse(res, 'counsellorId query parameter required', 400, 'VALIDATION_ERROR');
    }
    const { data, pagination } = await consultationService.getCounsellorConsultations(counsellorId, page, limit);
    paginatedResponse(res, data, pagination);
  } catch (error: any) {
    if (error.status) return errorResponse(res, error.message, error.status, error.code);
    next(error);
  }
}

export async function updateStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return errorResponse(res, 'Invalid ID', 400, 'INVALID_ID');
    const consultation = await consultationService.updateStatus(id, req.body.status);
    successResponse(res, consultation);
  } catch (error: any) {
    if (error.status) return errorResponse(res, error.message, error.status, error.code);
    next(error);
  }
}

export async function updateNotes(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return errorResponse(res, 'Invalid ID', 400, 'INVALID_ID');
    const consultation = await consultationService.updateNotes(id, req.body.notes, req.body.summary);
    successResponse(res, consultation);
  } catch (error: any) {
    if (error.status) return errorResponse(res, error.message, error.status, error.code);
    next(error);
  }
}

export async function getConsultationById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return errorResponse(res, 'Invalid ID', 400, 'INVALID_ID');
    const consultation = await consultationService.getConsultationById(id);
    successResponse(res, consultation);
  } catch (error: any) {
    if (error.status) return errorResponse(res, error.message, error.status, error.code);
    next(error);
  }
}
