// routes/session.routes.js
import express from 'express';
import { authenticate } from '../../../shared/middleware/auth.middleware.js';
import * as sessionController from '../controllers/session.controller.js';
import { uploadFile } from '../controllers/upload.controller.js';

const router = express.Router();

router.use(authenticate)

// Create new session and get QR
router.post('/create', sessionController.createSession);

// Get session status
router.get('/status/:sessionId', sessionController.getSessionStatus);

// Delete session
router.delete('/:sessionId', sessionController.deleteSession);

// List all active sessions
router.get('/list', sessionController.listSessions);

// Get all sessions from DB (including inactive)
router.get('/db/all', sessionController.getAllSessionsFromDB);

// Restore sessions after server restart
router.post('/restore', sessionController.restoreSessions);

router.post("/upload/media", upload.single("file"), uploadFile);


export default router;