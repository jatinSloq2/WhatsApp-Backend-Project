// ============================================
// FILE 4: backend/session-service/src/controllers/session.controller.js
// ============================================

import sessionService from '../services/session.service.js';
import { successResponse, errorResponse } from '../../../shared/utils/response.util.js';

export const createSession = async (req, res, next) => {
  try {
    const { phoneNumber, sessionName } = req.body;
    const userId = req.user.userId;

    const session = await sessionService.createSession(
      userId,
      phoneNumber,
      sessionName
    );

    return successResponse(
      res,
      session,
      'Session created successfully. Scan QR code to connect.',
      201
    );
  } catch (error) {
    next(error);
  }
};

export const getSessions = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const sessions = await sessionService.getUserSessions(userId);

    return successResponse(res, { sessions, count: sessions.length });
  } catch (error) {
    next(error);
  }
};

export const getSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.userId;

    const session = await sessionService.getSession(sessionId, userId);
    return successResponse(res, session);
  } catch (error) {
    next(error);
  }
};

export const getQRCode = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.userId;

    const result = await sessionService.getQRCode(sessionId, userId);
    return successResponse(res, result, 'QR code generated');
  } catch (error) {
    next(error);
  }
};

export const getSessionStatus = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.userId;

    const status = await sessionService.getSessionStatus(sessionId, userId);
    return successResponse(res, status);
  } catch (error) {
    next(error);
  }
};

export const logoutSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.userId;

    const result = await sessionService.logoutSession(sessionId, userId);
    return successResponse(res, result, 'Session logged out successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.userId;

    const result = await sessionService.deleteSession(sessionId, userId);
    return successResponse(res, result, 'Session deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const updateSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.userId;

    const session = await sessionService.updateSession(
      sessionId,
      userId,
      req.body
    );

    return successResponse(res, session, 'Session updated successfully');
  } catch (error) {
    next(error);
  }
};
