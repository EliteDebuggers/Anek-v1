import express from 'express';
import {
  getProfile,
  updateProfile,
  updateAvatar,
  getLeaderboard,
  searchUsers,
  joinMission
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { multerUpload } from '../middleware/uploadMiddleware.js';

import { validateProfileUpdate, validateJoinMission } from '../validators/userValidator.js';

const router = express.Router();

router.get('/profile', protect, getProfile);
router.patch('/profile', protect, validateProfileUpdate, updateProfile);
router.post('/profile/avatar', protect, multerUpload.single('avatar'), updateAvatar);
router.get('/leaderboard', protect, getLeaderboard);
router.get('/search', protect, searchUsers);
router.post('/missions/join', protect, validateJoinMission, joinMission);

export default router;
