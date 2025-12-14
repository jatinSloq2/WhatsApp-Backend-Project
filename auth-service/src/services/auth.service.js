// ============================================
// FILE 8: backend/auth-service/src/services/auth.service.js
// ============================================

import User from '../models/user.model.js';
import { generateAccessToken, generateRefreshToken, verifyToken } from '../../../shared/utils/jwt.util.js';
import { AppError } from '../../../shared/middleware/errorHandler.js';
import crypto from 'crypto';

class AuthService {
  async register(userData) {
    const { email, username, password, fullName, phone } = userData;

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username }]
    });

    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        throw new AppError('Email already registered', 400);
      }
      throw new AppError('Username already taken', 400);
    }

    // Create user
    const user = new User({
      email: email.toLowerCase(),
      username,
      password,
      fullName,
      phone
    });

    // Set limits based on tier
    user.updateLimits();

    // Generate email verification token (optional)
    const verificationToken = user.generateEmailVerificationToken();

    await user.save();

    // TODO: Send verification email here
    // await emailService.sendVerificationEmail(user.email, verificationToken);

    return {
      user: user.toJSON(),
      verificationToken: process.env.NODE_ENV === 'development' ? verificationToken : undefined
    };
  }

  async login(identifier, password) {
    // Find user by email or username
    const user = await User.findByEmailOrUsername(identifier);

    if (!user || !user.isActive) {
      throw new AppError('Invalid credentials', 401);
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401);
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user._id,
      email: user.email,
      subscriptionTier: user.subscriptionTier
    });

    const refreshToken = generateRefreshToken({
      userId: user._id
    });

    // Store refresh token
    user.refreshTokens.push({
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    return {
      user: user.toJSON(),
      tokens: {
        accessToken,
        refreshToken
      }
    };
  }

  async refreshToken(refreshToken) {
    try {
      const decoded = verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET);

      const user = await User.findById(decoded.userId);
      if (!user || !user.isActive) {
        throw new AppError('Invalid refresh token', 401);
      }

      // Check if refresh token exists and is valid
      const tokenExists = user.refreshTokens.some(
        rt => rt.token === refreshToken && rt.expiresAt > new Date()
      );

      if (!tokenExists) {
        throw new AppError('Invalid or expired refresh token', 401);
      }

      // Generate new access token
      const newAccessToken = generateAccessToken({
        userId: user._id,
        email: user.email,
        subscriptionTier: user.subscriptionTier
      });

      return {
        accessToken: newAccessToken
      };
    } catch (error) {
      throw new AppError('Invalid refresh token', 401);
    }
  }

  async logout(userId, refreshToken) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Remove refresh token
    user.refreshTokens = user.refreshTokens.filter(rt => rt.token !== refreshToken);
    await user.save();

    return { message: 'Logged out successfully' };
  }

  async verifyEmail(token) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      throw new AppError('Invalid or expired verification token', 400);
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    return { message: 'Email verified successfully' };
  }

  async forgotPassword(email) {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't reveal if user exists
      return { message: 'If email exists, reset link has been sent' };
    }

    const resetToken = user.generatePasswordResetToken();
    await user.save();

    // TODO: Send reset email
    // await emailService.sendPasswordResetEmail(user.email, resetToken);

    return {
      message: 'Password reset link sent to email',
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
    };
  }

  async resetPassword(token, newPassword) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    }).select('+password');

    if (!user) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.refreshTokens = []; // Invalidate all sessions
    await user.save();

    return { message: 'Password reset successfully' };
  }

  async getProfile(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return user.toJSON();
  }

  async updateProfile(userId, updates) {
    const allowedUpdates = ['fullName', 'phone', 'avatarUrl'];
    const filteredUpdates = {};

    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      userId,
      filteredUpdates,
      { new: true, runValidators: true }
    );

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user.toJSON();
  }
}

export default new AuthService();