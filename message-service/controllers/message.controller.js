// ============================================
// FILE: backend/message-service/src/controllers/message.controller.js
// ============================================

import messageService from '../services/message.service.js';
import { successResponse } from '../../../shared/utils/response.util.js';

export const sendMessage = async (req, res, next) => {
  try {
    const { sessionId, to, message, quotedMessageId } = req.body;
    const userId = req.user.userId;

    const result = await messageService.sendMessage(
      userId,
      sessionId,
      to,
      message,
      quotedMessageId
    );

    return successResponse(res, result, 'Message sent successfully');
  } catch (error) {
    next(error);
  }
};

export const sendMediaMessage = async (req, res, next) => {
  try {
    const { sessionId, to, caption, mediaType } = req.body;
    const userId = req.user.userId;

    if (!req.file) {
      throw new AppError('Media file required', 400);
    }

    const result = await messageService.sendMediaMessage(
      userId,
      sessionId,
      to,
      req.file.buffer,
      mediaType || 'image',
      caption
    );

    return successResponse(res, result, 'Media sent successfully');
  } catch (error) {
    next(error);
  }
};

export const getChatMessages = async (req, res, next) => {
  try {
    const { sessionId, chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const userId = req.user.userId;

    const result = await messageService.getChatMessages(
      userId,
      sessionId,
      chatId,
      parseInt(page),
      parseInt(limit)
    );

    return successResponse(res, result);
  } catch (error) {
    next(error);
  }
};

export const getChats = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.userId;

    const chats = await messageService.getChats(userId, sessionId);

    return successResponse(res, { chats, count: chats.length });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const { sessionId, chatId } = req.params;
    const userId = req.user.userId;

    await messageService.markAsRead(userId, sessionId, chatId);

    return successResponse(res, { success: true }, 'Messages marked as read');
  } catch (error) {
    next(error);
  }
};

export const deleteMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.userId;

    await messageService.deleteMessage(userId, messageId);

    return successResponse(res, { success: true }, 'Message deleted');
  } catch (error) {
    next(error);
  }
};

export const toggleStar = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.userId;

    const message = await messageService.toggleStar(userId, messageId);

    return successResponse(res, message, 'Message updated');
  } catch (error) {
    next(error);
  }
};

export const searchMessages = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { q } = req.query;
    const userId = req.user.userId;

    if (!q || q.trim().length < 2) {
      throw new AppError('Search query too short', 400);
    }

    const messages = await messageService.searchMessages(userId, sessionId, q);

    return successResponse(res, { messages, count: messages.length });
  } catch (error) {
    next(error);
  }
};

// Internal endpoint for webhook
export const saveIncomingMessage = async (req, res, next) => {
  try {
    const { sessionId, userId, messageData } = req.body;

    const message = await messageService.saveIncomingMessage(
      sessionId,
      userId,
      messageData
    );

    return successResponse(res, message);
  } catch (error) {
    next(error);
  }
};