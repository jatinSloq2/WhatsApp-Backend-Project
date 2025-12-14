// ============================================
// FILE 6: backend/session-service/src/routes/session.routes.js
// ============================================

import express from 'express';
import * as sessionController from '../controllers/session.controller.js';
import * as validation from '../middleware/validation.js';
import { authenticate } from '../../../shared/middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Session management
router.post(
  '/',
  validation.validate(validation.createSessionValidation),
  sessionController.createSession
);

router.get('/', sessionController.getSessions);

router.get(
  '/:sessionId',
  validation.validate(validation.sessionIdValidation),
  sessionController.getSession
);

router.get(
  '/:sessionId/qr',
  validation.validate(validation.sessionIdValidation),
  sessionController.getQRCode
);

router.get(
  '/:sessionId/status',
  validation.validate(validation.sessionIdValidation),
  sessionController.getSessionStatus
);

router.put(
  '/:sessionId',
  validation.validate(validation.updateSessionValidation),
  sessionController.updateSession
);

router.post(
  '/:sessionId/logout',
  validation.validate(validation.sessionIdValidation),
  sessionController.logoutSession
);

router.delete(
  '/:sessionId',
  validation.validate(validation.sessionIdValidation),
  sessionController.deleteSession
);

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'session-service',
    timestamp: new Date().toISOString()
  });
});

export default router;