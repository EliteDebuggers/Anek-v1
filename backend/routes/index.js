import express from 'express';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import issueRoutes from './issueRoutes.js';
import commentRoutes from './commentRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import contributionRoutes from './contributionRoutes.js';
import rewardRoutes from './rewardRoutes.js';

const router = express.Router();

// Mount routes under API version 1 namespace
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/issues', issueRoutes);
router.use('/comments', commentRoutes);
router.use('/notifications', notificationRoutes);
router.use('/contributions', contributionRoutes);
router.use('/rewards', rewardRoutes);

export default router;
