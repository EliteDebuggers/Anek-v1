import express from 'express';
import { getContributions } from '../controllers/contributionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getContributions);

export default router;
