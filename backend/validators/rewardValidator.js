import { body } from 'express-validator';
import { handleValidationErrors } from './authValidator.js';

export const validateRedeemReward = [
  body('rewardId')
    .trim()
    .notEmpty()
    .withMessage('Reward ID is required')
    .isMongoId()
    .withMessage('Invalid Reward ID format'),
  handleValidationErrors,
];
