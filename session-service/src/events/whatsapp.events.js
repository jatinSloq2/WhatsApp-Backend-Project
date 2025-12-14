// ============================================
// FILE 7: backend/session-service/src/events/whatsapp.events.js
// ============================================

import baileys from '../services/baileys.service.js';
import sessionService from '../services/session.service.js';

export function setupWhatsAppEvents(io) {
  // QR Code generated
  baileys.baileyEvents.on('qr', (sessionId, qr) => {
    console.log(`[${sessionId}] QR Event`);
    
    sessionService.updateSessionStatus(sessionId, 'qr_waiting')
      .catch(err => console.error('Failed to update session status:', err));

    // Emit to Socket.io clients
    io.to(sessionId).emit('qr_code', { sessionId, qr });
  });

  // Session connected
  baileys.baileyEvents.on('connected', (sessionId, user) => {
    console.log(`[${sessionId}] Connected Event`, user);
    
    sessionService.updateSessionStatus(sessionId, 'connected', { user })
      .catch(err => console.error('Failed to update session status:', err));

    // Emit to Socket.io clients
    io.to(sessionId).emit('session_status', {
      sessionId,
      status: 'connected',
      user
    });
  });

  // Session disconnected
  baileys.baileyEvents.on('disconnected', (sessionId, reason) => {
    console.log(`[${sessionId}] Disconnected Event: ${reason}`);
    
    const status = reason === 'terminal' ? 'disconnected' : 'error';
    sessionService.updateSessionStatus(sessionId, status, { error: reason })
      .catch(err => console.error('Failed to update session status:', err));

    // Emit to Socket.io clients
    io.to(sessionId).emit('session_status', {
      sessionId,
      status,
      reason
    });
  });

  // Messages received
  baileys.baileyEvents.on('messages.upsert', (sessionId, { messages, type }) => {
    console.log(`[${sessionId}] Message Upsert: ${type}`, messages.length);
    
    // Emit to Socket.io clients
    io.to(sessionId).emit('messages_received', {
      sessionId,
      messages,
      type
    });
  });

  // Message status update
  baileys.baileyEvents.on('messages.update', (sessionId, updates) => {
    console.log(`[${sessionId}] Message Update`, updates.length);
    
    // Emit to Socket.io clients
    io.to(sessionId).emit('message_status', {
      sessionId,
      updates
    });
  });

  // Session deleted
  baileys.baileyEvents.on('session_deleted', (sessionId) => {
    console.log(`[${sessionId}] Session Deleted Event`);
    
    // Emit to Socket.io clients
    io.to(sessionId).emit('session_deleted', { sessionId });
  });

  console.log('✅ WhatsApp events setup complete');
}