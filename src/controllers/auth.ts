import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth';
import { verifyRefreshToken, generateTokens } from '../utils/jwt';
import { successResponse, errorResponse } from '../utils/response';

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, email, password, orgCode } = req.body;
    const result = await authService.registerUser(name, email, password, orgCode);
    successResponse(res, result, 201);
  } catch (error: any) {
    if (error.status) {
      return errorResponse(res, error.message, error.status, error.code);
    }
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser(email, password);
    successResponse(res, result);
  } catch (error: any) {
    if (error.status) {
      return errorResponse(res, error.message, error.status, error.code);
    }
    next(error);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return errorResponse(res, 'Refresh token required', 400, 'MISSING_TOKEN');
    }

    const payload = verifyRefreshToken(refreshToken);
    const tokens = generateTokens({ userId: payload.userId, role: payload.role });
    successResponse(res, tokens);
  } catch (error: any) {
    if (error.status) {
      return errorResponse(res, error.message, error.status, error.code);
    }
    return errorResponse(res, 'Invalid refresh token', 401, 'TOKEN_INVALID');
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = req.body;
    await authService.forgotPassword(email);
    // Always return success to prevent email enumeration
    successResponse(res, { message: 'If the email exists, a reset link has been sent' });
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { token, password } = req.body;
    await authService.resetPassword(token, password);
    successResponse(res, { message: 'Password reset successful' });
  } catch (error: any) {
    if (error.status) {
      return errorResponse(res, error.message, error.status, error.code);
    }
    next(error);
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await authService.getProfile(req.user!.userId);
    successResponse(res, user);
  } catch (error: any) {
    if (error.status) {
      return errorResponse(res, error.message, error.status, error.code);
    }
    next(error);
  }
}

export async function updateMe(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await authService.updateProfile(req.user!.userId, req.body);
    successResponse(res, user);
  } catch (error: any) {
    if (error.status) {
      return errorResponse(res, error.message, error.status, error.code);
    }
    next(error);
  }
}

export async function changePassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { currentPassword, newPassword } = req.body;
    await authService.changePassword(req.user!.userId, currentPassword, newPassword);
    successResponse(res, { message: 'Password changed successfully' });
  } catch (error: any) {
    if (error.status) {
      return errorResponse(res, error.message, error.status, error.code);
    }
    next(error);
  }
}

export async function savePushToken(req: Request, res: Response, next: NextFunction) {
  try {
    const { token, platform } = req.body;
    if (!token || typeof token !== 'string') {
      return errorResponse(res, 'Token required', 400, 'VALIDATION_ERROR');
    }
    const prisma = (await import('../utils/prisma')).default;
    await prisma.user.update({
      where: { id: req.user!.userId },
      data: { pushToken: token },
    });
    successResponse(res, { message: 'Push token saved' });
  } catch (error: any) {
    next(error);
  }
}
