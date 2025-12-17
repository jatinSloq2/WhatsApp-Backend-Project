// ============================================
// FILE: backend/message-service/src/services/message.service.js
// ============================================

import Message from '../models/message.model.js';
import Chat from '../models/chat.model.js';
import axios from 'axios';
import { AppError } from '../../../shared/utils/errors.js';

const SESSION_SERVICE_URL = process.env.SESSION_SERVICE_URL || 'http://localhost:8002';

class MessageService {
  // Send text message
  async sendMessage(userId, sessionId, to, text, quotedMessageId = null) {
    try {
      // Send via session service
      const response = await axios.post(
        `${SESSION_SERVICE_URL}/sessions/internal/messages/send`,
        {
          sessionId,
          to,
          message: text
        }
      );

      const { messageId } = response.data.data;

      // Format recipient JID
      const recipientJid = to.includes('@') ? to : `${to}@s.whatsapp.net`;

      // Save to database
      const message = await Message.create({
        messageId,
        sessionId,
        userId,
        chatId: recipientJid,
        from: 'me',
        to: recipientJid,
        direction: 'outgoing',
        type: 'text',
        content: { text },
        status: 'sent',
        timestamp: new Date(),
        quotedMessage: quotedMessageId ? { messageId: quotedMessageId } : null,
        metadata: {
          fromMe: true,
          hasMedia: false
        }
      });

      // Update chat
      await this.updateChat(userId, sessionId, recipientJid, {
        content: text,
        timestamp: new Date(),
        messageId,
        type: 'text',
        from: 'me'
      });

      return message;
    } catch (error) {
      throw new AppError(error.message || 'Failed to send message', 500);
    }
  }

  // Send media message
  async sendMediaMessage(userId, sessionId, to, mediaBuffer, mediaType, caption) {
    try {
      const base64Media = mediaBuffer.toString('base64');

      const response = await axios.post(
        `${SESSION_SERVICE_URL}/sessions/internal/messages/send-media`,
        {
          sessionId,
          to,
          mediaBuffer: base64Media,
          mediaType,
          caption
        }
      );

      const { messageId } = response.data.data;
      const recipientJid = to.includes('@') ? to : `${to}@s.whatsapp.net`;

      const message = await Message.create({
        messageId,
        sessionId,
        userId,
        chatId: recipientJid,
        from: 'me',
        to: recipientJid,
        direction: 'outgoing',
        type: mediaType,
        content: { caption },
        status: 'sent',
        timestamp: new Date(),
        metadata: {
          fromMe: true,
          hasMedia: true
        }
      });

      await this.updateChat(userId, sessionId, recipientJid, {
        content: caption || `📎 ${mediaType}`,
        timestamp: new Date(),
        messageId,
        type: mediaType,
        from: 'me'
      });

      return message;
    } catch (error) {
      throw new AppError(error.message || 'Failed to send media', 500);
    }
  }

  // Save incoming message
  async saveIncomingMessage(sessionId, userId, messageData) {
    try {
      const { key, message, messageTimestamp } = messageData;

      const chatId = key.remoteJid;
      const messageId = key.id;

      // Extract content based on message type
      let content = {};
      let type = 'text';
      let mediaInfo = null;

      if (message.conversation) {
        content.text = message.conversation;
        type = 'text';
      } else if (message.extendedTextMessage) {
        content.text = message.extendedTextMessage.text;
        type = 'text';
      } else if (message.imageMessage) {
        content.caption = message.imageMessage.caption || '';
        type = 'image';
        mediaInfo = {
          mimetype: message.imageMessage.mimetype,
          size: message.imageMessage.fileLength
        };
      } else if (message.videoMessage) {
        content.caption = message.videoMessage.caption || '';
        type = 'video';
        mediaInfo = {
          mimetype: message.videoMessage.mimetype,
          size: message.videoMessage.fileLength
        };
      } else if (message.audioMessage) {
        type = 'audio';
        mediaInfo = {
          mimetype: message.audioMessage.mimetype,
          size: message.audioMessage.fileLength
        };
      } else if (message.documentMessage) {
        content.caption = message.documentMessage.caption || '';
        type = 'document';
        mediaInfo = {
          mimetype: message.documentMessage.mimetype,
          filename: message.documentMessage.fileName,
          size: message.documentMessage.fileLength
        };
      }

      // Check if message already exists
      const existing = await Message.findOne({ messageId });
      if (existing) return existing;

      // Save message
      const savedMessage = await Message.create({
        messageId,
        sessionId,
        userId,
        chatId,
        from: chatId,
        to: 'me',
        direction: 'incoming',
        type,
        content,
        media: mediaInfo,
        status: 'delivered',
        timestamp: new Date(messageTimestamp * 1000),
        metadata: {
          pushName: message.pushName,
          fromMe: false,
          hasMedia: mediaInfo !== null
        }
      });

      // Update chat
      await this.updateChat(userId, sessionId, chatId, {
        content: content.text || content.caption || `📎 ${type}`,
        timestamp: savedMessage.timestamp,
        messageId,
        type,
        from: chatId
      }, message.pushName);

      return savedMessage;
    } catch (error) {
      console.error('Error saving incoming message:', error);
      throw error;
    }
  }

  // Update or create chat
  async updateChat(userId, sessionId, chatId, lastMessage, name = null) {
    try {
      // Extract phone number from JID
      const phoneNumber = chatId.split('@')[0];

      const chat = await Chat.findOneAndUpdate(
        { sessionId, chatId },
        {
          $set: {
            userId,
            lastMessage,
            updatedAt: new Date()
          },
          $setOnInsert: {
            chatId,
            sessionId,
            userId,
            name: name || phoneNumber,
            phoneNumber,
            isGroup: chatId.includes('@g.us')
          },
          $inc: {
            unreadCount: lastMessage.from !== 'me' ? 1 : 0
          }
        },
        {
          upsert: true,
          new: true
        }
      );

      return chat;
    } catch (error) {
      console.error('Error updating chat:', error);
    }
  }

  // Get chat messages
  async getChatMessages(userId, sessionId, chatId, page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    const messages = await Message.find({
      userId,
      sessionId,
      chatId,
      isDeleted: false
    })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Message.countDocuments({
      userId,
      sessionId,
      chatId,
      isDeleted: false
    });

    return {
      messages: messages.reverse(),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Get all chats for a session
  async getChats(userId, sessionId) {
    const chats = await Chat.find({
      userId,
      sessionId,
      isArchived: false
    })
      .sort({ 'lastMessage.timestamp': -1 })
      .lean();

    return chats;
  }

  // Mark messages as read
  async markAsRead(userId, sessionId, chatId) {
    await Message.updateMany(
      {
        userId,
        sessionId,
        chatId,
        direction: 'incoming',
        status: { $ne: 'read' }
      },
      {
        $set: { status: 'read' }
      }
    );

    await Chat.findOneAndUpdate(
      { userId, sessionId, chatId },
      { $set: { unreadCount: 0 } }
    );

    return { success: true };
  }

  // Delete message
  async deleteMessage(userId, messageId) {
    const message = await Message.findOne({ messageId, userId });
    if (!message) {
      throw new AppError('Message not found', 404);
    }

    message.isDeleted = true;
    await message.save();

    return { success: true };
  }

  // Star/Unstar message
  async toggleStar(userId, messageId) {
    const message = await Message.findOne({ messageId, userId });
    if (!message) {
      throw new AppError('Message not found', 404);
    }

    message.isStarred = !message.isStarred;
    await message.save();

    return message;
  }

  // Update message status
  async updateMessageStatus(sessionId, messageId, status) {
    await Message.findOneAndUpdate(
      { sessionId, messageId },
      { $set: { status } }
    );
  }

  // Search messages
  async searchMessages(userId, sessionId, query) {
    const messages = await Message.find({
      userId,
      sessionId,
      'content.text': { $regex: query, $options: 'i' },
      isDeleted: false
    })
      .sort({ timestamp: -1 })
      .limit(50)
      .lean();

    return messages;
  }
}

export default new MessageService();