import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

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
    select: false
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
  refreshTokens: [{
    token: String,
    expiresAt: Date
  }],
  limits: {
    maxSessions: { type: Number, default: 1 },
    maxMessagesPerDay: { type: Number, default: 50 },
    maxCampaignsPerMonth: { type: Number, default: 5 },
    maxChatbots: { type: Number, default: 1 }
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  collection: 'users'
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ isActive: 1 });

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate email verification token
userSchema.methods.generateEmailVerificationToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
  return token;
};

// Generate password reset token
userSchema.methods.generatePasswordResetToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  this.resetPasswordExpires = Date.now() + 60 * 60 * 1000;
  return token;
};

// Update limits based on tier
userSchema.methods.updateLimits = function () {
  const limits = {
    free: { maxSessions: 1, maxMessagesPerDay: 50, maxCampaignsPerMonth: 5, maxChatbots: 1 },
    pro: { maxSessions: 3, maxMessagesPerDay: 250, maxCampaignsPerMonth: 20, maxChatbots: 5 },
    business: { maxSessions: 10, maxMessagesPerDay: 1000, maxCampaignsPerMonth: 999999, maxChatbots: 20 }
  };
  this.limits = limits[this.subscriptionTier] || limits.free;
};

// To JSON - remove sensitive fields
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.emailVerificationToken;
  delete obj.emailVerificationExpires;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpires;
  delete obj.refreshTokens;
  delete obj.__v;
  return obj;
};

// Static: Find by email or username
userSchema.statics.findByEmailOrUsername = function (identifier) {
  return this.findOne({
    $or: [
      { email: identifier.toLowerCase() },
      { username: identifier }
    ]
  }).select('+password');
};

const User = mongoose.model('User', userSchema);
export default User;