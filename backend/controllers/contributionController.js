import GCPTransaction from '../models/GCPTransaction.js';
import { serializeContribution } from '../utils/responseSerializer.js';

/**
 * Fetch all contribution/activity logs for the current user.
 * Supports filtering by category.
 * @route   GET /api/v1/contributions
 */
export const getContributions = async (req, res, next) => {
  const { category } = req.query;

  try {
    const transactions = await GCPTransaction.find({ user: req.user._id })
      .populate('referenceId')
      .sort('-createdAt');

    let logs = transactions.map(t => serializeContribution(t)).filter(Boolean);

    if (category && category !== 'all') {
      logs = logs.filter(log => log.category === category);
    }

    res.status(200).json({
      success: true,
      contributions: logs,
    });
  } catch (error) {
    next(error);
  }
};
