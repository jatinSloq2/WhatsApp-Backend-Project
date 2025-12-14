// ============================================
// FILE 2: backend/session-service/src/events/baileys.events.js
// ============================================

import baileys from '../services/baileys.service.js';
import Session from '../models/session.model.js';
import eventBus, { EVENTS } from '../../../shared/rabbitmq/event-bus.js';
import { io } from '../server.js';

export async function initializeBaileysEvents() {
  console.log('🔧 Initializing Baileys event handlers...');

  // Connect to event bus
  await eventBus.connect();

  // Handle incoming messages
  baileys.baileyEvents.on('messages.upsert', async (sessionId, msgUpdate) => {
    try {
      const { messages, type } = msgUpdate;

      for (const msg of messages) {
        // Skip if message is from me or is a protocol message
        if (msg.key.fromMe || !msg.message) continue;

        const session = await Session.findOne({ sessionId });
        if (!session) continue;

        // Extract message data
        const messageData = extractMessageData(msg, sessionId, session.userId);

        console.log('📨 New incoming message:', messageData);

        // Publish to message service via event bus
        await eventBus.publish('messages', EVENTS.MESSAGE_RECEIVED, messageData);

        // Also emit via Socket.IO for immediate updates
        io.to(sessionId).emit('message:received', messageData);
        io.to(`user:${session.userId}`).emit('message:received', messageData);
      }
    } catch (error) {
      console.error('Error handling messages.upsert:', error);
    }
  });

  // Handle message updates (delivery/read receipts)
  baileys.baileyEvents.on('messages.update', async (sessionId, updates) => {
    try {
      for (const update of updates) {
        const { key, update: status } = update;

        if (status.status === 2) {
          // Message delivered
          await eventBus.publish('messages', EVENTS.MESSAGE_DELIVERED, {
            sessionId,
            waMessageId: key.id,
            timestamp: new Date()
          });

          io.to(sessionId).emit('message:delivered', {
            waMessageId: key.id
          });
        } else if (status.status === 3) {
          // Message read
          await eventBus.publish('messages', EVENTS.MESSAGE_READ, {
            sessionId,
            waMessageId: key.id,
            timestamp: new Date()
          });

          io.to(sessionId).emit('message:read', {
            waMessageId: key.id
          });
        }
      }
    } catch (error) {
      console.error('Error handling messages.update:', error);
    }
  });

  // Handle QR code generation
  baileys.baileyEvents.on('qr', async (sessionId, qr) => {
    console.log('📱 QR generated for session:', sessionId);
    
    const session = await Session.findOne({ sessionId });
    if (session) {
      io.to(sessionId).emit('qr:generated', { qr });
      io.to(`user:${session.userId}`).emit('qr:generated', { sessionId, qr });
    }
  });

  // Handle connection
  baileys.baileyEvents.on('connected', async (sessionId, user) => {
    console.log('✅ Session connected:', sessionId);

    const session = await Session.findOne({ sessionId });
    if (session) {
      session.status = 'connected';
      session.connectedAt = new Date();
      session.phoneNumber = user.id.split(':')[0];
      session.metadata = { user };
      await session.save();

      await eventBus.publish('sessions', EVENTS.SESSION_CONNECTED, {
        sessionId,
        userId: session.userId,
        phoneNumber: session.phoneNumber,
        timestamp: new Date()
      });

      io.to(sessionId).emit('session:connected', { user });
      io.to(`user:${session.userId}`).emit('session:connected', { sessionId, user });
    }
  });

  // Handle disconnection
  baileys.baileyEvents.on('disconnected', async (sessionId, reason) => {
    console.log('❌ Session disconnected:', sessionId, reason);

    const session = await Session.findOne({ sessionId });
    if (session) {
      session.status = 'disconnected';
      session.disconnectedAt = new Date();
      await session.save();

      await eventBus.publish('sessions', EVENTS.SESSION_DISCONNECTED, {
        sessionId,
        userId: session.userId,
        reason,
        timestamp: new Date()
      });

      io.to(sessionId).emit('session:disconnected', { reason });
      io.to(`user:${session.userId}`).emit('session:disconnected', { sessionId, reason });
    }
  });

  // Handle session deletion
  baileys.baileyEvents.on('session_deleted', async (sessionId) => {
    console.log('🗑️ Session deleted:', sessionId);

    const session = await Session.findOne({ sessionId });
    if (session) {
      io.to(`user:${session.userId}`).emit('session:deleted', { sessionId });
    }
  });

  console.log('✅ Baileys event handlers initialized');
}

// Helper function to extract message data
function extractMessageData(msg, sessionId, userId) {
  const from = msg.key.remoteJid;
  const messageContent = msg.message;

  let messageData = {
    sessionId,
    userId,
    from,
    to: sessionId,
    chatId: from,
    waMessageId: msg.key.id,
    timestamp: new Date(msg.messageTimestamp * 1000),
    pushName: msg.pushName || 'Unknown'
  };

  // Text message
  if (messageContent.conversation) {
    messageData.message = messageContent.conversation;
    messageData.messageType = 'text';
  }
  // Extended text message
  else if (messageContent.extendedTextMessage) {
    messageData.message = messageContent.extendedTextMessage.text;
    messageData.messageType = 'text';

    if (messageContent.extendedTextMessage.contextInfo?.quotedMessage) {
      messageData.quotedMessage = {
        messageId: messageContent.extendedTextMessage.contextInfo.stanzaId,
        text: extractTextFromQuoted(messageContent.extendedTextMessage.contextInfo.quotedMessage)
      };
    }
  }
  // Image message
  else if (messageContent.imageMessage) {
    messageData.messageType = 'image';
    messageData.caption = messageContent.imageMessage.caption;
    messageData.mimeType = messageContent.imageMessage.mimetype;
    messageData.fileSize = messageContent.imageMessage.fileLength;
  }
  // Video message
  else if (messageContent.videoMessage) {
    messageData.messageType = 'video';
    messageData.caption = messageContent.videoMessage.caption;
    messageData.mimeType = messageContent.videoMessage.mimetype;
    messageData.fileSize = messageContent.videoMessage.fileLength;
  }
  // Document message
  else if (messageContent.documentMessage) {
    messageData.messageType = 'document';
    messageData.fileName = messageContent.documentMessage.fileName;
    messageData.mimeType = messageContent.documentMessage.mimetype;
    messageData.fileSize = messageContent.documentMessage.fileLength;
  }
  // Audio message
  else if (messageContent.audioMessage) {
    messageData.messageType = 'audio';
    messageData.mimeType = messageContent.audioMessage.mimetype;
    messageData.fileSize = messageContent.audioMessage.fileLength;
  }
  // Sticker message
  else if (messageContent.stickerMessage) {
    messageData.messageType = 'sticker';
    messageData.mimeType = messageContent.stickerMessage.mimetype;
  }
  // Location message
  else if (messageContent.locationMessage) {
    messageData.messageType = 'location';
    messageData.message = JSON.stringify({
      latitude: messageContent.locationMessage.degreesLatitude,
      longitude: messageContent.locationMessage.degreesLongitude,
      name: messageContent.locationMessage.name,
      address: messageContent.locationMessage.address
    });
  }
  // Contact message
  else if (messageContent.contactMessage) {
    messageData.messageType = 'contact';
    messageData.message = JSON.stringify({
      displayName: messageContent.contactMessage.displayName,
      vcard: messageContent.contactMessage.vcard
    });
  }

  return messageData;
}

function extractTextFromQuoted(quotedMessage) {
  if (quotedMessage.conversation) {
    return quotedMessage.conversation;
  } else if (quotedMessage.extendedTextMessage) {
    return quotedMessage.extendedTextMessage.text;
  } else if (quotedMessage.imageMessage) {
    return quotedMessage.imageMessage.caption || '[Image]';
  } else if (quotedMessage.videoMessage) {
    return quotedMessage.videoMessage.caption || '[Video]';
  }
  return '[Message]';
}