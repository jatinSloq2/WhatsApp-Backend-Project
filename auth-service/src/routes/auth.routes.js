// ============================================
// FILE 11: backend/auth-service/src/routes/auth.routes.js
// ============================================

import express from 'express';
import * as authController from '../controllers/auth.controller.js';
import * as validation from '../middleware/validation.js';
import { authenticate } from '../../../shared/middleware/auth.middleware.js';

const router = express.Router();

// Public routes
router.post(
  '/register',
  validation.validate(validation.registerValidation),
  authController.register
);

router.post(
  '/login',
  validation.validate(validation.loginValidation),
  authController.login
);

router.post(
  '/refresh-token',
  validation.validate(validation.refreshTokenValidation),
  authController.refreshToken
);

router.post(
  '/forgot-password',
  validation.validate(validation.emailValidation),
  authController.forgotPassword
);

router.post(
  '/reset-password',
  validation.validate(validation.resetPasswordValidation),
  authController.resetPassword
);

router.get(
  '/verify-email/:token',
  validation.validate(validation.tokenParamValidation),
  authController.verifyEmail
);

// Protected routes
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getProfile);
router.put('/me', authenticate, authController.updateProfile);

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'auth-service',
    timestamp: new Date().toISOString()
  });
});

export default router;
