import { Router } from 'express';
import * as authController from '../controllers/auth';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
  changePasswordSchema,
  refreshTokenSchema,
  pushTokenSchema,
} from '../validators/auth';

const router = Router();

// Public routes
router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshTokenSchema), authController.refresh);
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

// Protected routes
router.get('/me', requireAuth, authController.getMe);
router.put('/me', requireAuth, validate(updateProfileSchema), authController.updateMe);
router.put('/change-password', requireAuth, validate(changePasswordSchema), authController.changePassword);
router.post('/push-token', requireAuth, validate(pushTokenSchema), authController.savePushToken);

export default router;
