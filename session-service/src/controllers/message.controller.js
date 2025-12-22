import baileys from '../services/baileys.service.js';
import Session from '../models/session.model.js';
import { successResponse } from '../../../shared/utils/response.util.js';
import mongoose from 'mongoose';

export const sendMessage = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { to, message } = req.body;
    
    console.log('=== SEND MESSAGE DEBUG ===');
    console.log('SessionId:', sessionId);
    console.log('To:', to);
    console.log('Message:', message);

    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const session = await Session.findOne({ sessionId });
    
    console.log('Session found:', !!session);
    console.log('DB Session status:', session?.status);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Check ACTUAL Baileys status, not just DB status
    const actualStatus = baileys.getSessionStatus(sessionId);
    console.log('Baileys actual status:', actualStatus);
    
    if (actualStatus !== 'connected') {
      // Sync DB status with actual status
      if (session.status !== actualStatus) {
        await Session.findOneAndUpdate(
          { sessionId },
          { status: actualStatus }
        );
      }
      
      return res.status(400).json({
        success: false,
        message: `Session not ready. Current status: ${actualStatus}. Please wait for connection to complete or scan QR code again.`,
        actualStatus
      });
    }

    // Additional validation - check if socket has user
    const sock = baileys.getSession(sessionId);
    if (!sock?.user) {
      return res.status(400).json({
        success: false,
        message: 'Session exists but not authenticated. Please reconnect.',
        actualStatus: 'not_authenticated'
      });
    }

    console.log('Socket authenticated, user:', sock.user.id);

    const result = await baileys.sendMessage(sessionId, to, message);
    
    console.log('✓ Message sent successfully:', result?.key?.id);
    console.log('=== END DEBUG ===');
    
    return successResponse(
      res,
      {
        messageId: result.key.id,
        status: 'sent',
        timestamp: new Date(),
        to: result.key.remoteJid
      },
      'Message sent successfully'
    );
  } catch (error) {
    console.error('❌ Send message error:', error.message);
    console.error('Stack:', error.stack);
    next(error);
  }
};

export const sendMediaMessage = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { to, caption, mediaType } = req.body;
    const userId = req.user.userId;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Media file required'
      });
    }

    const session = await Session.findOne({ sessionId, userId });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Check actual status
    const actualStatus = baileys.getSessionStatus(sessionId);
    if (actualStatus !== 'connected') {
      return res.status(400).json({
        success: false,
        message: `Session not ready. Status: ${actualStatus}`
      });
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

// Internal endpoint
export const sendMessageInternal = async (req, res, next) => {
  try {
    const { sessionId, to, message } = req.body;
    
    // Verify actual connection
    const actualStatus = baileys.getSessionStatus(sessionId);
    if (actualStatus !== 'connected') {
      return res.status(400).json({
        success: false,
        message: `Session not ready: ${actualStatus}`
      });
    }
    
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