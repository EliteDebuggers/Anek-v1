import Issue from '../models/Issue.js';
import Vote from '../models/Vote.js';
import Comment from '../models/Comment.js';
import Media from '../models/Media.js';
import User from '../models/User.js';
import GCPTransaction from '../models/GCPTransaction.js';
import Notification from '../models/Notification.js';
import { uploadToCloudinary } from '../middleware/uploadMiddleware.js';
import { serializeIssue } from '../utils/responseSerializer.js';

/**
 * Fetch issue details (vote count, comments, and media) for a list of issues
 */
const getIssueDetails = async (issues, currentUserId = null) => {
  return await Promise.all(
    issues.map(async (issue) => {
      const votesCount = await Vote.countDocuments({ issue: issue._id });
      
      let isVotedByMe = false;
      if (currentUserId) {
        const vote = await Vote.findOne({ issue: issue._id, user: currentUserId });
        isVotedByMe = !!vote;
      }

      const comments = await Comment.find({ issue: issue._id, isDeleted: false })
        .populate('user', 'username')
        .sort({ createdAt: 1 });

      const mediaList = await Media.find({ issue: issue._id });

      const serialized = serializeIssue(issue, votesCount, comments, mediaList);
      return { ...serialized, isVotedByMe };
    })
  );
};

/**
 * Report a new issue.
 * @route   POST /api/v1/issues
 */
export const createIssue = async (req, res, next) => {
  const { title, category, description, urgency, latitude, longitude, locationName } = req.body;

  try {
    const lat = latitude ? parseFloat(latitude) : 52.5200;
    const lng = longitude ? parseFloat(longitude) : 13.4050;

    const issue = await Issue.create({
      title: title.trim(),
      category: category.trim(),
      description: description.trim(),
      urgency: urgency || 'LOW',
      author: req.user._id,
      location: {
        type: 'Point',
        coordinates: [lng, lat],
      },
      locationName: locationName || 'Unknown Location',
    });

    await issue.populate('author', 'username');

    let media = null;
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, 'anek_issues');
      media = await Media.create({
        issue: issue._id,
        url: result.secure_url,
        publicId: result.public_id,
        type: req.file.mimetype.startsWith('video/') ? 'video' : 'image',
        sizeBytes: req.file.size,
      });
    }

    const user = await User.findById(req.user._id);
    user.points += 10;
    await user.save();

    await GCPTransaction.create({
      user: user._id,
      amount: 10,
      type: 'EARN',
      description: `Reported issue: ${issue.title}`,
      referenceModel: 'Issue',
      referenceId: issue._id,
    });

    await Notification.create({
      recipient: user._id,
      type: 'ISSUE_REPORT',
      title: 'Report Logged',
      message: `Your report "${issue.title}" has been submitted successfully. +10 GCP awarded!`,
    });

    const serialized = serializeIssue(issue, 0, [], media ? [media] : []);

    if (req.io) {
      req.io.emit('issueCreated', serialized);
    }

    res.status(201).json({
      success: true,
      message: 'Issue reported successfully. +10 GCP awarded!',
      issue: serialized,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all issues with filters, sorting, and pagination.
 * @route   GET /api/v1/issues
 */
export const getIssues = async (req, res, next) => {
  const { category, status, search, sort = '-createdAt', page = 1, limit = 10 } = req.query;
  const filter = { isDeleted: false };

  if (category && category !== 'all') {
    filter.category = category;
  }
  if (status) {
    filter.status = status;
  }
  if (search) {
    const regex = new RegExp(search, 'i');
    filter.$or = [
      { title: regex },
      { description: regex },
      { locationName: regex }
    ];
  }

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  try {
    const total = await Issue.countDocuments(filter);
    const issues = await Issue.find(filter)
      .populate('author', 'username')
      .populate('responsibleUser', 'username')
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    const detailedIssues = await getIssueDetails(issues, req.user ? req.user._id : null);

    res.status(200).json({
      success: true,
      issues: detailedIssues,
      totalCount: total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get issues reported by the current user.
 * @route   GET /api/v1/issues/my-reports
 */
export const getMyReports = async (req, res, next) => {
  try {
    const issues = await Issue.find({ author: req.user._id, isDeleted: false })
      .populate('author', 'username')
      .populate('responsibleUser', 'username')
      .sort('-createdAt');

    const detailedIssues = await getIssueDetails(issues, req.user._id);

    res.status(200).json({
      success: true,
      issues: detailedIssues,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get issues resolved by the current user.
 * @route   GET /api/v1/issues/my-contributions
 */
export const getMyContributions = async (req, res, next) => {
  try {
    const issues = await Issue.find({ responsibleUser: req.user._id, isDeleted: false })
      .populate('author', 'username')
      .populate('responsibleUser', 'username')
      .sort('-createdAt');

    const detailedIssues = await getIssueDetails(issues, req.user._id);

    res.status(200).json({
      success: true,
      issues: detailedIssues,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Find issues within a specified radius (geospatial query).
 * @route   GET /api/v1/issues/nearby
 */
export const getNearbyIssues = async (req, res, next) => {
  const { longitude, latitude, maxDistance = 5000 } = req.query;

  if (!longitude || !latitude) {
    res.status(400);
    return next(new Error('Longitude and Latitude coordinates are required'));
  }

  try {
    const lng = parseFloat(longitude);
    const lat = parseFloat(latitude);
    const maxDist = parseInt(maxDistance, 10);

    const issues = await Issue.find({
      isDeleted: false,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat],
          },
          $maxDistance: maxDist,
        },
      },
    })
      .populate('author', 'username')
      .populate('responsibleUser', 'username')
      .limit(50);

    const detailedIssues = await getIssueDetails(issues, req.user ? req.user._id : null);

    res.status(200).json({
      success: true,
      issues: detailedIssues,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get simple list of coordinates and categories for heatmaps.
 * @route   GET /api/v1/issues/heatmap
 */
export const getHeatmapData = async (req, res, next) => {
  try {
    const issues = await Issue.find({ isDeleted: false }).select('location category status');
    const heatmap = issues.map(issue => ({
      longitude: issue.location.coordinates[0],
      latitude: issue.location.coordinates[1],
      category: issue.category,
      status: issue.status,
    }));

    res.status(200).json({
      success: true,
      heatmap,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update issue fields.
 * @route   PATCH /api/v1/issues/:id
 */
export const updateIssue = async (req, res, next) => {
  const { id } = req.params;
  const { title, category, description, urgency } = req.body;

  try {
    const issue = await Issue.findOne({ _id: id, isDeleted: false });
    if (!issue) {
      res.status(404);
      return next(new Error('Issue not found'));
    }

    if (issue.author.toString() !== req.user._id.toString()) {
      res.status(403);
      return next(new Error('Forbidden: You can only edit your own reports'));
    }

    if (title) issue.title = title.trim();
    if (category) issue.category = category.trim();
    if (description) issue.description = description.trim();
    if (urgency) issue.urgency = urgency;

    await issue.save();
    await issue.populate('author', 'username');
    await issue.populate('responsibleUser', 'username');

    const detailed = (await getIssueDetails([issue], req.user._id))[0];

    if (req.io) {
      req.io.emit('issueUpdated', detailed);
    }

    res.status(200).json({
      success: true,
      message: 'Issue updated successfully',
      issue: detailed,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Soft delete an issue.
 * @route   DELETE /api/v1/issues/:id
 */
export const deleteIssue = async (req, res, next) => {
  const { id } = req.params;

  try {
    const issue = await Issue.findOne({ _id: id, isDeleted: false });
    if (!issue) {
      res.status(404);
      return next(new Error('Issue not found'));
    }

    if (issue.author.toString() !== req.user._id.toString()) {
      res.status(403);
      return next(new Error('Forbidden: You can only delete your own reports'));
    }

    issue.isDeleted = true;
    issue.deletedAt = new Date();
    await issue.save();

    if (req.io) {
      req.io.emit('issueDeleted', { id });
    }

    res.status(200).json({
      success: true,
      message: 'Issue soft deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle Upvote on an issue.
 * @route   POST /api/v1/issues/:id/upvote
 */
export const upvoteIssue = async (req, res, next) => {
  const { id } = req.params;

  try {
    const issue = await Issue.findOne({ _id: id, isDeleted: false });
    if (!issue) {
      res.status(404);
      return next(new Error('Issue not found'));
    }

    const voteExists = await Vote.findOne({ issue: issue._id, user: req.user._id });

    if (voteExists) {
      await Vote.deleteOne({ _id: voteExists._id });
    } else {
      await Vote.create({ issue: issue._id, user: req.user._id });
      
      if (issue.author.toString() !== req.user._id.toString()) {
        await Notification.create({
          recipient: issue.author,
          sender: req.user._id,
          type: 'UPVOTE',
          title: 'New Upvote',
          message: `@${req.user.username} upvoted your report: "${issue.title}"`,
        });
      }
    }

    const votesCount = await Vote.countDocuments({ issue: issue._id });

    if (req.io) {
      req.io.emit('issueUpvoted', { id, votes: votesCount });
    }

    res.status(200).json({
      success: true,
      message: voteExists ? 'Vote removed' : 'Vote registered',
      votes: votesCount,
      isVotedByMe: !voteExists,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Claim responsibility for an issue.
 * @route   POST /api/v1/issues/:id/take-responsibility
 */
export const takeResponsibility = async (req, res, next) => {
  const { id } = req.params;

  try {
    const issue = await Issue.findOne({ _id: id, isDeleted: false });
    if (!issue) {
      res.status(404);
      return next(new Error('Issue not found'));
    }

    if (issue.status !== 'Reported') {
      res.status(400);
      return next(new Error('Issue is already claimed or completed'));
    }

    issue.status = 'In Progress';
    issue.responsibleUser = req.user._id;
    await issue.save();

    await issue.populate('author', 'username');
    await issue.populate('responsibleUser', 'username');

    if (issue.author._id.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: issue.author._id,
        sender: req.user._id,
        type: 'STATUS_CHANGE',
        title: 'Issue Claimed',
        message: `@${req.user.username} has claimed responsibility for resolving your report: "${issue.title}"`,
      });
    }

    const detailed = (await getIssueDetails([issue], req.user._id))[0];

    if (req.io) {
      req.io.emit('issueStatusUpdated', detailed);
    }

    res.status(200).json({
      success: true,
      message: 'Claimed responsibility for issue successfully',
      issue: detailed,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Drop responsibility for an issue.
 * @route   POST /api/v1/issues/:id/drop-responsibility
 */
export const dropResponsibility = async (req, res, next) => {
  const { id } = req.params;

  try {
    const issue = await Issue.findOne({ _id: id, isDeleted: false });
    if (!issue) {
      res.status(404);
      return next(new Error('Issue not found'));
    }

    if (issue.status !== 'In Progress') {
      res.status(400);
      return next(new Error('Cannot drop responsibility, issue is not in progress'));
    }

    if (issue.responsibleUser.toString() !== req.user._id.toString()) {
      res.status(403);
      return next(new Error('Forbidden: You are not assigned to this issue'));
    }

    issue.status = 'Reported';
    issue.responsibleUser = null;
    await issue.save();

    await issue.populate('author', 'username');

    if (issue.author._id.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: issue.author._id,
        sender: req.user._id,
        type: 'STATUS_CHANGE',
        title: 'Resolver Dropped',
        message: `@${req.user.username} has dropped responsibility from your report: "${issue.title}"`,
      });
    }

    const detailed = (await getIssueDetails([issue], req.user._id))[0];

    if (req.io) {
      req.io.emit('issueStatusUpdated', detailed);
    }

    res.status(200).json({
      success: true,
      message: 'Dropped responsibility for issue successfully',
      issue: detailed,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark issue as resolved / completed.
 * @route   POST /api/v1/issues/:id/resolve
 */
export const resolveIssue = async (req, res, next) => {
  const { id } = req.params;

  try {
    const issue = await Issue.findOne({ _id: id, isDeleted: false });
    if (!issue) {
      res.status(404);
      return next(new Error('Issue not found'));
    }

    if (issue.status !== 'In Progress') {
      res.status(400);
      return next(new Error('Issue cannot be resolved; it is not currently claimed or is already completed'));
    }

    if (issue.responsibleUser.toString() !== req.user._id.toString()) {
      res.status(403);
      return next(new Error('Forbidden: Only the assigned resolver can mark this issue as resolved'));
    }

    issue.status = 'Completed';
    await issue.save();

    const user = await User.findById(req.user._id);
    user.points += 50;
    await user.save();

    await GCPTransaction.create({
      user: user._id,
      amount: 50,
      type: 'EARN',
      description: `Resolved issue: ${issue.title}`,
      referenceModel: 'Issue',
      referenceId: issue._id,
    });

    if (issue.author.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: issue.author,
        sender: req.user._id,
        type: 'STATUS_CHANGE',
        title: 'Issue Resolved',
        message: `@${req.user.username} has resolved your report: "${issue.title}". +50 GCP awarded to resolver!`,
      });
    }

    await issue.populate('author', 'username');
    await issue.populate('responsibleUser', 'username');

    const detailed = (await getIssueDetails([issue], req.user._id))[0];

    if (req.io) {
      req.io.emit('issueStatusUpdated', detailed);
    }

    res.status(200).json({
      success: true,
      message: 'Issue resolved successfully. +50 GCP awarded!',
      issue: detailed,
    });
  } catch (error) {
    next(error);
  }
};
