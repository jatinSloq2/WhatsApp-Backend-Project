// ============================================
// FILE 9: backend/auth-service/src/controllers/auth.controller.js
// ============================================

import authService from '../services/auth.service.js';
import { successResponse, errorResponse } from '../../../shared/utils/response.util.js';
import { AppError } from '../../../shared/middleware/errorHandler.js';

export const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    return successResponse(res, result, 'User registered successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;
    const result = await authService.login(identifier, password);
    return successResponse(res, result, 'Login successful');
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refreshToken(refreshToken);
    return successResponse(res, result, 'Token refreshed successfully');
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.logout(req.user.userId, refreshToken);
    return successResponse(res, result, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;
    const result = await authService.verifyEmail(token);
    return successResponse(res, result, 'Email verified successfully');
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await authService.forgotPassword(email);
    return successResponse(res, result);
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const result = await authService.resetPassword(token, password);
    return successResponse(res, result, 'Password reset successfully');
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const result = await authService.getProfile(req.user.userId);
    return successResponse(res, result);
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const result = await authService.updateProfile(req.user.userId, req.body);
    return successResponse(res, result, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};
