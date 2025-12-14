
// ============================================
// FILE 2: backend/shared/utils/jwt.util.js
// ============================================

import jwt from 'jsonwebtoken';

export const generateAccessToken = (payload) => {
  return jwt.sign(payload, "your-super-secret-jwt-key-change-this-in-production", {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

export const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  });
};

export const verifyToken = (token, secret = "your-super-secret-jwt-key-change-this-in-production") => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

export const decodeToken = (token) => {
  return jwt.decode(token);
};
