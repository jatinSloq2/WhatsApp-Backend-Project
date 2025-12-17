// ============================================
// FILE: backend/message-service/src/models/message.model.js
// ============================================

import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  messageId: {
    type: String,
    required: true,
    unique: true,
    index: true
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
  chatId: {
    type: String,
    required: true,
    index: true // e.g., "919876543210@s.whatsapp.net"
  },
  from: {
    type: String,
    required: true // Sender JID
  },
  to: {
    type: String,
    required: true // Recipient JID
  },
  direction: {
    type: String,
    enum: ['incoming', 'outgoing'],
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'image', 'video', 'audio', 'document', 'sticker', 'location', 'contact'],
    default: 'text'
  },
  content: {
    text: String,
    caption: String
  },
  media: {
    url: String,
    mimetype: String,
    filename: String,
    size: Number,
    thumbnail: String
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'read', 'failed'],
    default: 'pending'
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  isStarred: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  quotedMessage: {
    messageId: String,
    content: String
  },
  metadata: {
    pushName: String, // Sender's name
    broadcast: Boolean,
    fromMe: Boolean,
    hasMedia: Boolean,
    isForwarded: Boolean,
    mentionedJids: [String]
  }
}, {
  timestamps: true
});

// Indexes for performance
messageSchema.index({ sessionId: 1, chatId: 1, timestamp: -1 });
messageSchema.index({ userId: 1, timestamp: -1 });
messageSchema.index({ sessionId: 1, timestamp: -1 });

// Virtual for formatted timestamp
messageSchema.virtual('formattedTime').get(function() {
  return this.timestamp.toLocaleString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
});

const Message = mongoose.model('Message', messageSchema);

export default Message;