// ============================================
// FILE 5: backend/session-service/src/middleware/validation.js
// ============================================

import { body, param, validationResult } from 'express-validator';
import { errorResponse } from '../../../shared/utils/response.util.js';

export const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const extractedErrors = errors.array().map(err => ({
      field: err.path,
      message: err.msg
    }));

    return errorResponse(res, 'Validation failed', 400, extractedErrors);
  };
};

export const createSessionValidation = [
  body('phoneNumber')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .matches(/^[+]?[\d]+$/).withMessage('Invalid phone number format'),
  body('sessionName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Session name must be 2-50 characters')
];

export const sessionIdValidation = [
  param('sessionId')
    .trim()
    .notEmpty().withMessage('Session ID is required')
];

export const updateSessionValidation = [
  param('sessionId')
    .trim()
    .notEmpty().withMessage('Session ID is required'),
  body('sessionName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Session name must be 2-50 characters')
];