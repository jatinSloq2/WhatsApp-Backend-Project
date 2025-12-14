// ============================================
// FILE 3: backend/session-service/src/services/session.service.js
// ============================================

import Session from '../models/session.model.js';
import baileys from './baileys.service.js';
import { AppError } from '../../../shared/middleware/errorHandler.js';
import QRCode from 'qrcode';

class SessionService {
  async createSession(userId, phoneNumber, sessionName) {
    // Check if session already exists
    const existingSession = await Session.findOne({
      userId,
      phoneNumber,
      isActive: true
    });

    if (existingSession) {
      // If already connected, return it
      if (existingSession.status === 'connected') {
        return existingSession;
      }
      
      // If exists but not connected, start it
      const sessionId = existingSession.sessionId;
      await baileys.createSession(sessionId);
      
      existingSession.status = 'initializing';
      await existingSession.save();
      
      return existingSession;
    }

    // Create new session
    const sessionId = `session_${userId}_${Date.now()}`;
    
    const session = new Session({
      sessionId,
      userId,
      phoneNumber,
      sessionName: sessionName || 'My WhatsApp',
      status: 'initializing'
    });

    await session.save();

    // Start Baileys session
    await baileys.createSession(sessionId);

    return session;
  }

  async getSession(sessionId, userId) {
    const session = await Session.findOne({ sessionId, userId });
    if (!session) {
      throw new AppError('Session not found', 404);
    }

    // Update status from Baileys
    const baileyStatus = baileys.getSessionStatus(sessionId);
    if (baileyStatus !== session.status) {
      session.status = baileyStatus;
      await session.save();
    }

    return session;
  }

  async getUserSessions(userId) {
    const sessions = await Session.find({ userId, isActive: true })
      .sort({ createdAt: -1 });

    // Update statuses
    for (const session of sessions) {
      const baileyStatus = baileys.getSessionStatus(session.sessionId);
      if (baileyStatus !== session.status) {
        session.status = baileyStatus;
        await session.save();
      }
    }

    return sessions;
  }

  async getQRCode(sessionId, userId) {
    const session = await Session.findOne({ sessionId, userId });
    if (!session) {
      throw new AppError('Session not found', 404);
    }

    const qrText = baileys.getQR(sessionId);
    if (!qrText) {
      // Try to start session if not started
      if (session.status === 'disconnected') {
        await baileys.createSession(sessionId);
        
        // Wait a bit for QR generation
        await new Promise(resolve => setTimeout(resolve, 2000));
        const newQrText = baileys.getQR(sessionId);
        
        if (newQrText) {
          const qrDataUrl = await QRCode.toDataURL(newQrText);
          session.qrCode = qrDataUrl;
          session.status = 'qr_waiting';
          await session.save();
          return { qr: qrDataUrl, text: newQrText };
        }
      }
      
      throw new AppError('QR code not available', 404);
    }

    const qrDataUrl = await QRCode.toDataURL(qrText);
    session.qrCode = qrDataUrl;
    session.status = 'qr_waiting';
    await session.save();

    return { qr: qrDataUrl, text: qrText };
  }

  async getSessionStatus(sessionId, userId) {
    const session = await Session.findOne({ sessionId, userId });
    if (!session) {
      throw new AppError('Session not found', 404);
    }

    const baileyStatus = baileys.getSessionStatus(sessionId);
    
    if (baileyStatus !== session.status) {
      session.status = baileyStatus;
      
      if (baileyStatus === 'connected') {
        session.connectedAt = new Date();
        session.lastSeen = new Date();
        session.retryCount = 0;
        session.errorMessage = null;
      } else if (baileyStatus === 'disconnected') {
        session.disconnectedAt = new Date();
      }
      
      await session.save();
    }

    return {
      sessionId: session.sessionId,
      status: session.status,
      connectedAt: session.connectedAt,
      lastSeen: session.lastSeen
    };
  }

  async logoutSession(sessionId, userId) {
    const session = await Session.findOne({ sessionId, userId });
    if (!session) {
      throw new AppError('Session not found', 404);
    }

    await baileys.deleteSession(sessionId);

    session.status = 'disconnected';
    session.isActive = false;
    session.disconnectedAt = new Date();
    await session.save();

    return { message: 'Session logged out successfully' };
  }

  async deleteSession(sessionId, userId) {
    const session = await Session.findOne({ sessionId, userId });
    if (!session) {
      throw new AppError('Session not found', 404);
    }

    await baileys.deleteSession(sessionId);
    await Session.deleteOne({ sessionId, userId });

    return { message: 'Session deleted successfully' };
  }

  async updateSession(sessionId, userId, updates) {
    const session = await Session.findOne({ sessionId, userId });
    if (!session) {
      throw new AppError('Session not found', 404);
    }

    const allowedUpdates = ['sessionName'];
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        session[key] = updates[key];
      }
    });

    await session.save();
    return session;
  }

  // Update session status (called by Baileys events)
  async updateSessionStatus(sessionId, status, metadata = {}) {
    const session = await Session.findOne({ sessionId });
    if (!session) return;

    session.status = status;
    session.lastSeen = new Date();

    if (status === 'connected') {
      session.connectedAt = new Date();
      session.retryCount = 0;
      session.errorMessage = null;
      
      if (metadata.user) {
        session.phoneNumber = metadata.user.id.split(':')[0];
        session.metadata = {
          ...session.metadata,
          ...metadata
        };
      }
    } else if (status === 'disconnected') {
      session.disconnectedAt = new Date();
      if (metadata.error) {
        session.errorMessage = metadata.error;
      }
    } else if (status === 'error') {
      session.retryCount += 1;
      session.errorMessage = metadata.error || 'Unknown error';
    }

    await session.save();
  }

  // Restore sessions on server start
  async restoreSessions() {
    try {
      const activeSessions = await Session.find({
        isActive: true,
        status: { $in: ['connected', 'qr_waiting', 'initializing'] }
      });

      console.log(`Restoring ${activeSessions.length} active sessions...`);

      for (const session of activeSessions) {
        try {
          await baileys.createSession(session.sessionId);
          console.log(`Restored session: ${session.sessionId}`);
        } catch (error) {
          console.error(`Failed to restore session ${session.sessionId}:`, error);
          session.status = 'error';
          session.errorMessage = error.message;
          await session.save();
        }
      }

      console.log('Session restoration complete');
    } catch (error) {
      console.error('Failed to restore sessions:', error);
    }
  }
}

export default new SessionService();
