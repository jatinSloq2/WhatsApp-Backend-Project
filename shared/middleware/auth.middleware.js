// ============================================
// FILE 6: backend/shared/middleware/auth.middleware.js
// ============================================

import { verifyToken } from '../utils/jwt.util.js';
import jwt from "jsonwebtoken"
import { errorResponse } from '../utils/response.util.js';
import { AppError } from './errorHandler.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Access token required', 401);
    }


    const token = authHeader.split(' ')[1];
    console.log('🎫 Token:', token.substring(0, 20) + '...');
    
    // Decode first to see what's inside (without verifying)
    const decoded = jwt.decode(token);
    console.log('📦 Decoded payload:', decoded);
    console.log('⏰ Token expires at:', new Date(decoded.exp * 1000).toISOString());
    console.log('🕐 Current time:', new Date().toISOString());
    console.log('❓ Is expired?', decoded.exp < Math.floor(Date.now() / 1000));
    
    // const token = authHeader.split(' ')[1];
    
    // const decoded = verifyToken(token);
    
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      subscriptionTier: decoded.subscriptionTier
    };
    
    next();
  } catch (error) {
    return errorResponse(res, error.message, 401);
  }
};

export const checkSubscription = (allowedTiers = []) => {
  return (req, res, next) => {
    if (!allowedTiers.includes(req.user.subscriptionTier)) {
      return errorResponse(
        res,
        'Subscription tier not authorized for this action',
        403
      );
    }
    next();
  };
};