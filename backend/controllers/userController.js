import User from '../models/User.js';
import GCPTransaction from '../models/GCPTransaction.js';
import { uploadToCloudinary } from '../middleware/uploadMiddleware.js';
import { serializeUser, serializeLeaderboardUser } from '../utils/responseSerializer.js';

/**
 * Get current user profile.
 * @route   GET /api/v1/users/profile
 */
export const getProfile = async (req, res, next) => {
  try {
    const globalRank = await User.countDocuments({
      isDeleted: false,
      $or: [
        { points: { $gt: req.user.points } },
        { points: req.user.points, username: { $lt: req.user.username } }
      ]
    }) + 1;

    res.status(200).json({
      success: true,
      user: {
        ...serializeUser(req.user),
        globalRank
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update current user profile details.
 * @route   PATCH /api/v1/users/profile
 */
export const updateProfile = async (req, res, next) => {
  const { name } = req.body;

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      return next(new Error('User not found'));
    }

    if (name) {
      user.name = name.trim();
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: serializeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload or update user profile picture.
 * @route   POST /api/v1/users/profile/avatar
 */
export const updateAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400);
      return next(new Error('No file uploaded'));
    }

    const result = await uploadToCloudinary(req.file.buffer, 'anek_avatars');

    const user = await User.findById(req.user._id);
    user.profilePicture = result.secure_url;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Avatar uploaded successfully',
      avatarUrl: result.secure_url,
      user: serializeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Fetch leaderboard rankings dynamically.
 * Sorted by points descending, with search filter and pagination support.
 * @route   GET /api/v1/users/leaderboard
 */
export const getLeaderboard = async (req, res, next) => {
  const { search, page = 1, limit = 20 } = req.query;
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  try {
    const query = { isDeleted: false };
    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [{ name: regex }, { username: regex }];
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .sort({ points: -1, username: 1 })
      .skip(skip)
      .limit(limitNum);

    const serializedList = await Promise.all(
      users.map(async (user, idx) => {
        const globalRank = search
          ? await User.countDocuments({
              isDeleted: false,
              $or: [
                { points: { $gt: user.points } },
                { points: user.points, username: { $lt: user.username } }
              ]
            }) + 1
          : skip + idx + 1;
        return serializeLeaderboardUser(user, globalRank);
      })
    );

    res.status(200).json({
      success: true,
      leaderboard: serializedList,
      totalCount: total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Search users by name or username.
 * @route   GET /api/v1/users/search
 */
export const searchUsers = async (req, res, next) => {
  const { query, limit = 10 } = req.query;

  try {
    if (!query) {
      return res.status(200).json({ success: true, users: [] });
    }

    const regex = new RegExp(query, 'i');
    const users = await User.find({
      isDeleted: false,
      $or: [{ name: regex }, { username: regex }],
    })
      .limit(parseInt(limit, 10))
      .select('name username profilePicture points');

    res.status(200).json({
      success: true,
      users: users.map(user => serializeUser(user)),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Join Partnership Mission.
 * Awards points and logs activity.
 * @route   POST /api/v1/users/missions/join
 */
export const joinMission = async (req, res, next) => {
  const { missionId } = req.body;

  if (!missionId) {
    res.status(400);
    return next(new Error('Mission ID is required'));
  }

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      return next(new Error('User not found'));
    }

    const pointsAwarded = 20;
    user.points += pointsAwarded;
    await user.save();

    const transaction = await GCPTransaction.create({
      user: user._id,
      amount: pointsAwarded,
      type: 'EARN',
      description: `Joined Partnership Mission #${missionId}`,
      referenceModel: 'User',
      referenceId: user._id,
    });

    res.status(200).json({
      success: true,
      message: `Successfully joined mission #${missionId}! +20 GCP awarded.`,
      user: serializeUser(user),
      transactionId: transaction._id,
    });
  } catch (error) {
    next(error);
  }
};
