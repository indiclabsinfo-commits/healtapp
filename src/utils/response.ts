import { Response } from 'express';

export function successResponse(res: Response, data: any, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
  });
}

export function errorResponse(res: Response, message: string, statusCode = 400, code?: string) {
  return res.status(statusCode).json({
    success: false,
    error: message,
    ...(code && { code }),
  });
}

export function paginatedResponse(
  res: Response,
  data: any[],
  pagination: { page: number; limit: number; total: number }
) {
  return res.status(200).json({
    success: true,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: Math.ceil(pagination.total / pagination.limit),
    },
  });
}
