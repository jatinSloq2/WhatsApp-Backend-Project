```js
// backend/shared/models/User.model.js
// User Model with Mongoose

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false // Don't include password in queries by default
  },
  fullName: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  avatarUrl: {
    type: String,
    default: null
  },
  subscriptionTier: {
    type: String,
    enum: ['free', 'pro', 'business'],
    default: 'free'
  },
  subscriptionStatus: {
    type: String,
    enum: ['active', 'expired', 'cancelled', 'trial'],
    default: 'active'
  },
  subscriptionStartDate: {
    type: Date,
    default: null
  },
  subscriptionEndDate: {
    type: Date,
    default: null
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    select: false
  },
  emailVerificationExpires: {
    type: Date,
    select: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  resetPasswordToken: {
    type: String,
    select: false
  },
  resetPasswordExpires: {
    type: Date,
    select: false
  },
  // Usage limits based on subscription
  limits: {
    maxSessions: {
      type: Number,
      default: 1 // free: 1, pro: 3, business: 10
    },
    maxMessagesPerDay: {
      type: Number,
      default: 50 // free: 50, pro: 250, business: 1000
    },
    maxCampaignsPerMonth: {
      type: Number,
      default: 5 // free: 5, pro: 20, business: unlimited
    },
    maxChatbots: {
      type: Number,
      default: 1 // free: 1, pro: 5, business: 20
    }
  },
  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt
  collection: 'users'
});

// ============================================
// INDEXES
// ============================================

userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ subscriptionTier: 1, subscriptionStatus: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });

// ============================================
// VIRTUAL PROPERTIES
// ============================================

// Virtual for full subscription info
userSchema.virtual('subscriptionInfo').get(function() {
  return {
    tier: this.subscriptionTier,
    status: this.subscriptionStatus,
    startDate: this.subscriptionStartDate,
    endDate: this.subscriptionEndDate,
    isExpired: this.subscriptionEndDate ? new Date() > this.subscriptionEndDate : false
  };
});

// ============================================
// METHODS
// ============================================

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash if password is modified
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Generate email verification token
userSchema.methods.generateEmailVerificationToken = function() {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  
  return token;
};

// Generate password reset token
userSchema.methods.generatePasswordResetToken = function() {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  this.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  
  return token;
};

// Update subscription limits based on tier
userSchema.methods.updateLimits = function() {
  const limits = {
    free: {
      maxSessions: 1,
      maxMessagesPerDay: 50,
      maxCampaignsPerMonth: 5,
      maxChatbots: 1
    },
    pro: {
      maxSessions: 3,
      maxMessagesPerDay: 250,
      maxCampaignsPerMonth: 20,
      maxChatbots: 5
    },
    business: {
      maxSessions: 10,
      maxMessagesPerDay: 1000,
      maxCampaignsPerMonth: 999999,
      maxChatbots: 20
    }
  };
  
  this.limits = limits[this.subscriptionTier] || limits.free;
};

// Check if user can perform action based on limits
userSchema.methods.canPerformAction = async function(action, count = 1) {
  switch(action) {
    case 'createSession':
      const sessionCount = await mongoose.model('Session').countDocuments({ 
        userId: this._id,
        isActive: true 
      });
      return sessionCount < this.limits.maxSessions;
      
    case 'sendMessage':
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const messageCount = await mongoose.model('Message').countDocuments({
        'session.userId': this._id,
        isIncoming: false,
        timestamp: { $gte: today }
      });
      return messageCount + count <= this.limits.maxMessagesPerDay;
      
    case 'createCampaign':
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);
      const campaignCount = await mongoose.model('Campaign').countDocuments({
        userId: this._id,
        createdAt: { $gte: thisMonth }
      });
      return campaignCount < this.limits.maxCampaignsPerMonth;
      
    case 'createChatbot':
      const botCount = await mongoose.model('Chatbot').countDocuments({
        userId: this._id,
        isActive: true
      });
      return botCount < this.limits.maxChatbots;
      
    default:
      return true;
  }
};

// To JSON - remove sensitive fields
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.emailVerificationToken;
  delete obj.emailVerificationExpires;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpires;
  delete obj.__v;
  return obj;
};

// ============================================
// STATIC METHODS
// ============================================

// Find user by email or username
userSchema.statics.findByEmailOrUsername = function(identifier) {
  return this.findOne({
    $or: [
      { email: identifier.toLowerCase() },
      { username: identifier }
    ]
  }).select('+password');
};

// Get active users count
userSchema.statics.getActiveUsersCount = function() {
  return this.countDocuments({ isActive: true });
};

// Get users by subscription tier
userSchema.statics.getUsersByTier = function(tier) {
  return this.find({ 
    subscriptionTier: tier,
    subscriptionStatus: 'active'
  });
};

// ============================================
// EXPORT MODEL
// ============================================

const User = mongoose.model('User', userSchema);

module.exports = User;
```

```js
// backend/shared/models/index.js
// Central export for all models

const mongoose = require('mongoose');

// ============================================
// SESSION MODEL
// ============================================

const sessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
    trim: true
  },
  qrCode: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['connected', 'disconnected', 'qr_waiting', 'initializing', 'error'],
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
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  collection: 'sessions'
});

// Compound indexes
sessionSchema.index({ userId: 1, phoneNumber: 1 }, { unique: true });
sessionSchema.index({ status: 1, userId: 1 });

const Session = mongoose.model('Session', sessionSchema);

// ============================================
// MESSAGE MODEL
// ============================================

const messageSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  waMessageId: {
    type: String,
    index: true,
    sparse: true
  },
  fromNumber: {
    type: String,
    required: true,
    index: true
  },
  toNumber: {
    type: String,
    required: true,
    index: true
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'video', 'audio', 'document', 'sticker', 'location', 'contact', 'poll'],
    required: true
  },
  content: {
    type: String,
    default: null
  },
  mediaUrl: {
    type: String,
    default: null
  },
  mediaMimeType: {
    type: String,
    default: null
  },
  mediaSize: {
    type: Number,
    default: null
  },
  isIncoming: {
    type: Boolean,
    required: true,
    index: true
  },
  isFromMe: {
    type: Boolean,
    default: false
  },
  isGroup: {
    type: Boolean,
    default: false
  },
  groupId: {
    type: String,
    default: null
  },
  quotedMessageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'read', 'failed'],
    default: 'pending',
    index: true
  },
  errorMessage: {
    type: String,
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  timestamp: {
    type: Date,
    required: true,
    index: true
  }
}, {
  timestamps: true,
  collection: 'messages'
});

// Indexes for efficient queries
messageSchema.index({ sessionId: 1, timestamp: -1 });
messageSchema.index({ fromNumber: 1, timestamp: -1 });
messageSchema.index({ toNumber: 1, timestamp: -1 });
messageSchema.index({ status: 1, createdAt: -1 });
messageSchema.index({ timestamp: -1 });

const Message = mongoose.model('Message', messageSchema);

// ============================================
// CONTACT MODEL
// ============================================

const contactSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  phoneNumber: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    trim: true
  },
  profilePicUrl: {
    type: String,
    default: null
  },
  isBusiness: {
    type: Boolean,
    default: false
  },
  isBlocked: {
    type: Boolean,
    default: false,
    index: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  customFields: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  lastMessageAt: {
    type: Date,
    default: null
  },
  messageCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  collection: 'contacts'
});

// Compound unique index
contactSchema.index({ sessionId: 1, phoneNumber: 1 }, { unique: true });
contactSchema.index({ tags: 1 });

const Contact = mongoose.model('Contact', contactSchema);

// ============================================
// CAMPAIGN MODEL
// ============================================

const campaignSchema = new mongoose.Schema({
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
  campaignName: {
    type: String,
    required: true,
    trim: true
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'video', 'document'],
    required: true
  },
  messageContent: {
    type: String,
    required: true
  },
  mediaUrl: {
    type: String,
    default: null
  },
  totalRecipients: {
    type: Number,
    required: true,
    min: 1
  },
  sentCount: {
    type: Number,
    default: 0
  },
  deliveredCount: {
    type: Number,
    default: 0
  },
  failedCount: {
    type: Number,
    default: 0
  },
  pendingCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'running', 'paused', 'completed', 'failed'],
    default: 'draft',
    index: true
  },
  scheduleTime: {
    type: Date,
    default: null
  },
  startedAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  delayBetweenMessages: {
    type: Number,
    default: 3000, // milliseconds
    min: 1000,
    max: 10000
  },
  personalize: {
    type: Boolean,
    default: false
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  collection: 'campaigns'
});

// Indexes
campaignSchema.index({ userId: 1, status: 1 });
campaignSchema.index({ sessionId: 1, status: 1 });
campaignSchema.index({ status: 1, scheduleTime: 1 });

const Campaign = mongoose.model('Campaign', campaignSchema);

// ============================================
// CAMPAIGN RECIPIENT MODEL
// ============================================

const recipientSchema = new mongoose.Schema({
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true,
    index: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  name: {
    type: String,
    trim: true
  },
  customData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'failed'],
    default: 'pending',
    index: true
  },
  sentAt: {
    type: Date,
    default: null
  },
  deliveredAt: {
    type: Date,
    default: null
  },
  errorMessage: {
    type: String,
    default: null
  },
  messageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  }
}, {
  timestamps: true,
  collection: 'campaign_recipients'
});

recipientSchema.index({ campaignId: 1, status: 1 });
recipientSchema.index({ status: 1 });

const CampaignRecipient = mongoose.model('CampaignRecipient', recipientSchema);

// ============================================
// CHATBOT MODEL
// ============================================

const chatbotSchema = new mongoose.Schema({
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
  botName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  triggerType: {
    type: String,
    enum: ['keyword', 'always', 'pattern', 'command'],
    required: true
  },
  triggerValue: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  flows: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    default: []
  },
  variables: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  fallbackMessage: {
    type: String,
    default: 'Sorry, I didn\'t understand that.'
  },
  welcomeMessage: {
    type: String,
    default: 'Hello! How can I help you?'
  }
}, {
  timestamps: true,
  collection: 'chatbots'
});

chatbotSchema.index({ sessionId: 1, isActive: 1 });
chatbotSchema.index({ userId: 1 });

const Chatbot = mongoose.model('Chatbot', chatbotSchema);

// ============================================
// CHATBOT CONVERSATION MODEL
// ============================================

const conversationSchema = new mongoose.Schema({
  botId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chatbot',
    required: true,
    index: true
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  userPhone: {
    type: String,
    required: true,
    index: true
  },
  currentFlowId: {
    type: String,
    default: null
  },
  conversationData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  lastInteraction: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'chatbot_conversations'
});

conversationSchema.index({ botId: 1, userPhone: 1 });
conversationSchema.index({ isActive: 1, lastInteraction: -1 });

const ChatbotConversation = mongoose.model('ChatbotConversation', conversationSchema);

// ============================================
// MESSAGE TEMPLATE MODEL
// ============================================

const templateSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  templateName: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['marketing', 'support', 'notification', 'transactional'],
    default: 'marketing',
    index: true
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'video', 'document'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  mediaUrl: {
    type: String,
    default: null
  },
  variables: [{
    type: String,
    trim: true
  }],
  usageCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  collection: 'message_templates'
});

templateSchema.index({ userId: 1, category: 1 });

const MessageTemplate = mongoose.model('MessageTemplate', templateSchema);

// ============================================
// WEBHOOK MODEL
// ============================================

const webhookSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sessionId: {
    type: String,
    default: null,
    index: true
  },
  webhookUrl: {
    type: String,
    required: true,
    trim: true
  },
  webhookName: {
    type: String,
    trim: true
  },
  events: [{
    type: String,
    enum: ['message_received', 'message_sent', 'session_status', 'campaign_completed'],
    required: true
  }],
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  secretKey: {
    type: String,
    default: null
  },
  headers: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  retryCount: {
    type: Number,
    default: 3,
    min: 0,
    max: 5
  },
  lastTriggered: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  collection: 'webhooks'
});

webhookSchema.index({ userId: 1, isActive: 1 });

const Webhook = mongoose.model('Webhook', webhookSchema);

// ============================================
// ANALYTICS MODEL
// ============================================

const analyticsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sessionId: {
    type: String,
    default: null,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  messagesSent: {
    type: Number,
    default: 0
  },
  messagesReceived: {
    type: Number,
    default: 0
  },
  messagesDelivered: {
    type: Number,
    default: 0
  },
  messagesFailed: {
    type: Number,
    default: 0
  },
  uniqueContacts: {
    type: Number,
    default: 0
  },
  activeChatbots: {
    type: Number,
    default: 0
  },
  campaignMessages: {
    type: Number,
    default: 0
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  collection: 'analytics'
});

// Compound unique index
analyticsSchema.index({ userId: 1, sessionId: 1, date: 1 }, { unique: true });
analyticsSchema.index({ userId: 1, date: -1 });

const Analytics = mongoose.model('Analytics', analyticsSchema);

// ============================================
// SUBSCRIPTION PAYMENT MODEL
// ============================================

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true
  },
  paymentMethod: {
    type: String,
    enum: ['stripe', 'razorpay', 'paypal', 'manual'],
    required: true
  },
  transactionId: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    required: true,
    index: true
  },
  subscriptionTier: {
    type: String,
    enum: ['free', 'pro', 'business']
  },
  billingPeriodStart: {
    type: Date
  },
  billingPeriodEnd: {
    type: Date
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  collection: 'subscription_payments'
});

paymentSchema.index({ userId: 1, status: 1 });

const SubscriptionPayment = mongoose.model('SubscriptionPayment', paymentSchema);

// ============================================
// AUDIT LOG MODEL
// ============================================

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },
  action: {
    type: String,
    required: true,
    index: true
  },
  entityType: {
    type: String,
    enum: ['session', 'campaign', 'chatbot', 'message', 'user', 'payment'],
    default: null
  },
  entityId: {
    type: String,
    default: null
  },
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  collection: 'audit_logs'
});

auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

// ============================================
// NOTIFICATION MODEL
// ============================================

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['info', 'warning', 'error', 'success'],
    default: 'info'
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  link: {
    type: String,
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  collection: 'notifications'
});

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

// ============================================
// API KEY MODEL
// ============================================

const apiKeySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  keyName: {
    type: String,
    required: true,
    trim: true
  },
  apiKey: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  permissions: [{
    type: String,
    enum: ['read', 'write', 'admin'],
    default: ['read']
  }],
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  lastUsed: {
    type: Date,
    default: null
  },
  expiresAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  collection: 'api_keys'
});

apiKeySchema.index({ userId: 1, isActive: 1 });

const ApiKey = mongoose.model('ApiKey', apiKeySchema);

// ============================================
// EXPORT ALL MODELS
// ============================================

module.exports = {
  User: require('./User.model'),
  Session,
  Message,
  Contact,
  Campaign,
  CampaignRecipient,
  Chatbot,
  ChatbotConversation,
  MessageTemplate,
  Webhook,
  Analytics,
  SubscriptionPayment,
  AuditLog,
  Notification,
  ApiKey
};
```