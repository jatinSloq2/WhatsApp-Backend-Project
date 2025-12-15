// ============================================
// FILE 1: backend/session-service/src/models/session.model.js
// ============================================

import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true
  },
  sessionName: {
    type: String,
    trim: true,
    default: 'My WhatsApp'
  },
  qrCode: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['connected', 'disconnected', 'qr_waiting', 'initializing', 'error', "no_session"],
    default: 'disconnected',
    index: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  lastSeen: {
    type: Date,
    default: null
  },
  connectedAt: {
    type: Date,
    default: null
  },
  disconnectedAt: {
    type: Date,
    default: null
  },
  retryCount: {
    type: Number,
    default: 0
  },
  errorMessage: {
    type: String,
    default: null
  },
  metadata: {
    waVersion: String,
    platform: String,
    deviceManufacturer: String,
    deviceModel: String,
    osVersion: String,
    waWebVersion: String
  }
}, {
  timestamps: true,
  collection: 'sessions'
});

// Compound indexes
sessionSchema.index({ userId: 1, phoneNumber: 1 });
sessionSchema.index({ status: 1, userId: 1 });
sessionSchema.index({ isActive: 1, status: 1 });

// Methods
sessionSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

const Session = mongoose.model('Session', sessionSchema);
export default Session;
