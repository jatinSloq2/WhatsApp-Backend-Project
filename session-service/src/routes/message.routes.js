// ============================================
// FILE 3: backend/session-service/src/routes/message.routes.js
// ============================================

import express from 'express';
import multer from 'multer';
import * as messageController from '../controllers/message.controller.js';
import { authenticate } from '../../../shared/middleware/auth.middleware.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Authenticated routes
router.use(authenticate);

// Send messages
router.post('/:sessionId/messages/send', messageController.sendMessage);
router.post('/:sessionId/messages/send-media', upload.single('media'), messageController.sendMediaMessage);

// Internal routes (no auth - called by other services)
router.post('/internal/messages/send', messageController.sendMessageInternal);
router.post('/internal/messages/send-media', messageController.sendMediaInternal);

export default router;