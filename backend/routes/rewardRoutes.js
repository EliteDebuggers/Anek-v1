import express from 'express';
import { getRewards, redeemReward } from '../controllers/rewardController.js';
import { protect } from '../middleware/authMiddleware.js';

import { validateRedeemReward } from '../validators/rewardValidator.js';

const router = express.Router();

router.use(protect);

router.get('/', getRewards);
router.post('/redeem', validateRedeemReward, redeemReward);

export default router;
