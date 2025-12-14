// ============================================
// FILE 1: backend/session-service/src/controllers/message.controller.js
// ============================================

import baileys from '../services/baileys.service.js';
import Session from '../models/session.model.js';
import { successResponse } from '../../../shared/utils/response.util.js';
import { AppError } from '../../../shared/utils/errors.js';

export const sendMessage = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { to, message } = req.body;
    const userId = req.user.userId;

    // Verify session ownership
    const session = await Session.findOne({ sessionId, userId });
    if (!session) {
      throw new AppError('Session not found', 404);
    }

    if (session.status !== 'connected') {
      throw new AppError('Session not connected', 400);
    }

    // Send message via Baileys
    const result = await baileys.sendMessage(sessionId, to, message);

    return successResponse(res, {
      messageId: result.key.id,
      status: 'sent',
      timestamp: new Date()
    }, 'Message sent successfully');
  } catch (error) {
    next(error);
  }
};

export const sendMediaMessage = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { to, caption, mediaType } = req.body;
    const userId = req.user.userId;

    if (!req.file) {
      throw new AppError('Media file required', 400);
    }

    const session = await Session.findOne({ sessionId, userId });
    if (!session) {
      throw new AppError('Session not found', 404);
    }

    if (session.status !== 'connected') {
      throw new AppError('Session not connected', 400);
    }

    const result = await baileys.sendMedia(
      sessionId,
      to,
      req.file.buffer,
      mediaType || 'image',
      caption
    );

    return successResponse(res, {
      messageId: result.key.id,
      status: 'sent',
      timestamp: new Date()
    }, 'Media sent successfully');
  } catch (error) {
    next(error);
  }
};

// Internal endpoint (called by message service)
export const sendMessageInternal = async (req, res, next) => {
  try {
    const { sessionId, to, message } = req.body;

    const result = await baileys.sendMessage(sessionId, to, message);

    return successResponse(res, {
      messageId: result.key.id,
      status: 'sent',
      timestamp: new Date()
    });
  } catch (error) {
    next(error);
  }
};

export const sendMediaInternal = async (req, res, next) => {
  try {
    const { sessionId, to, mediaBuffer, mediaType, caption } = req.body;

    const buffer = Buffer.from(mediaBuffer, 'base64');
    
    const result = await baileys.sendMedia(
      sessionId,
      to,
      buffer,
      mediaType,
      caption
    );

    return successResponse(res, {
      messageId: result.key.id,
      status: 'sent',
      timestamp: new Date()
    });
  } catch (error) {
    next(error);
  }
};