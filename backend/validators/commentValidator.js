import { body } from 'express-validator';
import { handleValidationErrors } from './authValidator.js';

export const validateCommentCreate = [
  body('issueId')
    .trim()
    .notEmpty()
    .withMessage('Issue ID is required')
    .isMongoId()
    .withMessage('Invalid Issue ID format'),
  body('text')
    .trim()
    .notEmpty()
    .withMessage('Comment text is required')
    .isLength({ max: 500 })
    .withMessage('Comment cannot exceed 500 characters')
    .escape(),
  handleValidationErrors,
];

export const validateCommentUpdate = [
  body('text')
    .trim()
    .notEmpty()
    .withMessage('Comment text is required')
    .isLength({ max: 500 })
    .withMessage('Comment cannot exceed 500 characters')
    .escape(),
  handleValidationErrors,
];
