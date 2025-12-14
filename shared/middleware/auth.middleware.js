// ============================================
// FILE 6: backend/shared/middleware/auth.middleware.js
// ============================================

import { verifyToken } from '../utils/jwt.util.js';
import { errorResponse } from '../utils/response.util.js';
import { AppError } from './errorHandler.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Access token required', 401);
    }

    const token = authHeader.split(' ')[1];
    
    const decoded = verifyToken(token);
    
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