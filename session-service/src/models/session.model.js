// models/Session.model.js
import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['initializing', 'qr_waiting', 'connected', 'disconnected', 'no_session'],
    default: 'initializing'
  },
  phoneNumber: {
    type: String,
    default: null
  },
  lastConnected: {
    type: Date,
    default: null
  },
  lastDisconnected: {
    type: Date,
    default: null
  },
  qrGenerated: {
    type: Boolean,
    default: false
  },
  retryCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    type: Map,
    of: String,
    default: {}
  }
}, {
  timestamps: true
});

// Index for faster queries
sessionSchema.index({ sessionId: 1 });
sessionSchema.index({ status: 1 });
sessionSchema.index({ isActive: 1 });

// Method to update status
sessionSchema.methods.updateStatus = async function(newStatus, phoneNumber = null) {
  this.status = newStatus;
  
  if (newStatus === 'connected') {
    this.lastConnected = new Date();
    this.retryCount = 0;
    if (phoneNumber) this.phoneNumber = phoneNumber;
  }
  
  if (newStatus === 'disconnected' || newStatus === 'no_session') {
    this.lastDisconnected = new Date();
  }
  
  return await this.save();
};

// Static method to find or create session
sessionSchema.statics.findOrCreate = async function(sessionId) {
  let session = await this.findOne({ sessionId });
  
  if (!session) {
    session = await this.create({
      sessionId,
      status: 'initializing',
      isActive: true
    });
  }
  
  return session;
};

// Static method to mark session as inactive
sessionSchema.statics.markInactive = async function(sessionId) {
  return await this.findOneAndUpdate(
    { sessionId },
    { 
      isActive: false, 
      status: 'no_session',
      lastDisconnected: new Date()
    },
    { new: true }
  );
};

export default mongoose.models.Session || mongoose.model('Session', sessionSchema);