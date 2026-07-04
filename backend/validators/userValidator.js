import { body } from 'express-validator';
import { handleValidationErrors } from './authValidator.js';

export const validateProfileUpdate = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Name cannot be empty if provided')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .escape(),
  handleValidationErrors,
];

export const validateJoinMission = [
  body('missionId')
    .trim()
    .notEmpty()
    .withMessage('Mission ID is required')
    .escape(),
  handleValidationErrors,
];
