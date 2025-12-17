// ============================================
// FILE: backend/message-service/src/routes/message.routes.js
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
router.post('/send', messageController.sendMessage);
router.post('/send-media', upload.single('media'), messageController.sendMediaMessage);

// Get chats and messages
router.get('/sessions/:sessionId/chats', messageController.getChats);
router.get('/sessions/:sessionId/chats/:chatId/messages', messageController.getChatMessages);

// Message actions
router.post('/sessions/:sessionId/chats/:chatId/read', messageController.markAsRead);
router.delete('/messages/:messageId', messageController.deleteMessage);
router.post('/messages/:messageId/star', messageController.toggleStar);

// Search
router.get('/sessions/:sessionId/search', messageController.searchMessages);

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'message-service',
    timestamp: new Date().toISOString()
  });
});

export default router;

// ============================================
// FILE: backend/message-service/src/routes/webhook.routes.js
// ============================================

export const webhookRouter = express.Router();

// Internal webhook (no auth - called by session service)
webhookRouter.post('/webhook/messages', messageController.saveIncomingMessage);