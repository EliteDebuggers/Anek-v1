import { body } from 'express-validator';
import { handleValidationErrors } from './authValidator.js';

export const validateIssue = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 100 })
    .withMessage('Title cannot exceed 100 characters')
    .escape(),
  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required')
    .escape(),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .escape(),
  body('urgency')
    .optional()
    .isIn(['LOW', 'PRIORITY', 'EMERGENCY'])
    .withMessage('Urgency must be LOW, PRIORITY, or EMERGENCY'),
  body('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be a valid float between -90 and 90'),
  body('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be a valid float between -180 and 180'),
  body('locationName')
    .optional()
    .trim()
    .escape(),
  handleValidationErrors,
];

export const validateIssueUpdate = [
  body('title')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Title cannot exceed 100 characters')
    .escape(),
  body('category')
    .optional()
    .trim()
    .escape(),
  body('description')
    .optional()
    .trim()
    .escape(),
  body('urgency')
    .optional()
    .isIn(['LOW', 'PRIORITY', 'EMERGENCY'])
    .withMessage('Urgency must be LOW, PRIORITY, or EMERGENCY'),
  body('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be a valid float between -90 and 90'),
  body('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be a valid float between -180 and 180'),
  body('locationName')
    .optional()
    .trim()
    .escape(),
  handleValidationErrors,
];
