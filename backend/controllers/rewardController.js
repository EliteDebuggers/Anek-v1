import Reward from '../models/Reward.js';
import RewardRedemption from '../models/RewardRedemption.js';
import User from '../models/User.js';
import GCPTransaction from '../models/GCPTransaction.js';
import Notification from '../models/Notification.js';

const defaultRewards = [
  {
    name: 'Community Garden Pass',
    description: 'Unlimited access to the downtown hydroponic lab and 5kg of seasonal harvest.',
    cost: 80,
    category: 'Local Labs',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDHwiHFmkh1R_y8Wjmd_HzLMtT7pPk3juuVRFrJ6HLieOQD4cVKJZ-94QYmbQkrqeRifhL9mhTqWtdBzyAf6XtbDQ4jCjDrEfYHQ3SwKc_tRAhE7UrTY_l4a_uoHrNHv1nDXMA9tkP3EXLxAvCIKDTI1hMbcjhTk9mg4pEIyH63h4ZQyI8wfuZi51vOY_b0j0Jm9TEKmvD_jv9nPToe6UdOPcbiD1ompDAnlgTIpfogZYZzjjE2lICyfNyD0Nr11r5whf8raLlMm5g',
    minRank: 'Vanguard Rank I',
  },
  {
    name: '$25 Coffee Credit',
    description: 'Valid at all participating \'Anek Network\' cafes. Supports fair-trade sourcing.',
    cost: 50,
    category: 'Cafes',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCsGqvabIPK1Yud-Mn_m7oj0_44KqFI9a8VW4LvBdCmO0RFN3EHlkhkYGGba7zSrAPXVlk-cOJDFo02TTzMBGpX1uMqL9u3d7pAbjyI9hsBD-rov7pWQ52VjBi7NDbSzxr6HJ9E_A_A6Yy2SXc-F50Ckz5-QbCqrfaYE_0xEiU2Zyu3kx48jw8OsYtoExILUiRIv17cZ7F4pYf_E4tu55kVVMOxBua1vJbDEiRiNegh-45YvODJb210N6qLPPwIXGklu4BuWs6gbsw',
    minRank: 'Vanguard Rank I',
  },
  {
    name: 'Wilderness Retreat Voucher',
    description: 'Exclusive 3-night stay at the Citizen Sanctuary. Requires Rank: Elder. Experience the deep quiet of the forest in a carbon-neutral sanctuary.',
    cost: 300,
    category: 'Outdoors',
    imageUrl: '',
    minRank: 'Vanguard Elder',
  }
];

/**
 * Get rewards catalog list.
 * Seeds default rewards if empty.
 * @route   GET /api/v1/rewards
 */
export const getRewards = async (req, res, next) => {
  try {
    let rewards = await Reward.find({});
    
    if (rewards.length === 0) {
      await Reward.insertMany(defaultRewards);
      rewards = await Reward.find({});
    }

    res.status(200).json({
      success: true,
      rewards,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Redeem GCP points for a reward.
 * @route   POST /api/v1/rewards/redeem
 */
export const redeemReward = async (req, res, next) => {
  const { rewardId } = req.body;

  if (!rewardId) {
    res.status(400);
    return next(new Error('Reward ID is required'));
  }

  try {
    const reward = await Reward.findById(rewardId);
    if (!reward) {
      res.status(404);
      return next(new Error('Reward not found'));
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      return next(new Error('User not found'));
    }

    if (user.points < reward.cost) {
      res.status(400);
      return next(new Error(`Insufficient points balance. You need ${reward.cost} GCP, but currently have ${user.points} GCP`));
    }

    if (reward.minRank === 'Vanguard Elder' && user.rank !== 'Vanguard Elder') {
      res.status(403);
      return next(new Error('Forbidden: This reward requires the Vanguard Elder rank to unlock'));
    } else if (reward.minRank === 'Vanguard Rank II' && user.rank === 'Vanguard Rank I') {
      res.status(403);
      return next(new Error('Forbidden: This reward requires the Vanguard Rank II rank to unlock'));
    }

    user.points -= reward.cost;
    await user.save();

    const codePart1 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const codePart2 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const redemptionCode = `ANEK-${codePart1}-${codePart2}`;

    const redemption = await RewardRedemption.create({
      user: user._id,
      reward: reward._id,
      status: 'CLAIMED',
      code: redemptionCode,
    });

    await GCPTransaction.create({
      user: user._id,
      amount: -reward.cost,
      type: 'REDEEM',
      description: `Redeemed: ${reward.name}`,
      referenceModel: 'RewardRedemption',
      referenceId: redemption._id,
    });

    await Notification.create({
      recipient: user._id,
      type: 'REWARD',
      title: 'Reward Claimed!',
      message: `You copped a voucher for "${reward.name}" for ${reward.cost} GCP. Voucher Code: ${redemptionCode}`,
    });

    res.status(200).json({
      success: true,
      message: `Successfully redeemed "${reward.name}"!`,
      redemptionCode,
      user: {
        points: user.points,
        rank: user.rank,
      }
    });
  } catch (error) {
    next(error);
  }
};
