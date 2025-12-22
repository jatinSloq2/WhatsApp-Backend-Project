import express from 'express';
import { authenticate } from '../../../shared/middleware/auth.middleware.js';
import * as messageController from '../controllers/message.controller.js';

const router = express.Router();
router.use(authenticate);
router.post("/send", messageController.sendMessage);
router.post("/bulk", messageController.bulkMessageSender);

export default router;