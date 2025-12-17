// ============================================
// FILE: backend/message-service/src/models/chat.model.js
// ============================================

import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
  chatId: {
    type: String,
    required: true,
    index: true // e.g., "919876543210@s.whatsapp.net"
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  profilePicture: {
    type: String,
    default: null
  },
  isGroup: {
    type: Boolean,
    default: false
  },
  groupMetadata: {
    subject: String,
    participants: [{
      jid: String,
      isAdmin: Boolean
    }],
    creation: Date
  },
  lastMessage: {
    content: String,
    timestamp: Date,
    messageId: String,
    type: String,
    from: String
  },
  unreadCount: {
    type: Number,
    default: 0
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  isMuted: {
    type: Boolean,
    default: false
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  tags: [String],
  notes: String
}, {
  timestamps: true
});

// Compound index for unique chat per session
chatSchema.index({ sessionId: 1, chatId: 1 }, { unique: true });

// Index for user's chats
chatSchema.index({ userId: 1, 'lastMessage.timestamp': -1 });

const Chat = mongoose.model('Chat', chatSchema);

export default Chat;