import Comment from '../models/Comment.js';
import Issue from '../models/Issue.js';
import Notification from '../models/Notification.js';

/**
 * Add a comment/reply to an issue.
 * @route   POST /api/v1/comments
 */
export const createComment = async (req, res, next) => {
  const { issueId, text } = req.body;

  if (!issueId || !text) {
    res.status(400);
    return next(new Error('Issue ID and comment text are required'));
  }

  try {
    const issue = await Issue.findOne({ _id: issueId, isDeleted: false });
    if (!issue) {
      res.status(404);
      return next(new Error('Issue not found'));
    }

    const comment = await Comment.create({
      issue: issueId,
      user: req.user._id,
      text: text.trim(),
    });

    await comment.populate('user', 'username');

    if (issue.author.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: issue.author,
        sender: req.user._id,
        type: 'COMMENT',
        title: 'New Reply',
        message: `@${req.user.username} commented on your report "${issue.title}": "${text.substring(0, 30)}..."`,
      });
    }

    const formattedComment = {
      id: comment._id,
      author: comment.user.username,
      text: comment.text,
      createdAt: comment.createdAt,
    };

    if (req.io) {
      req.io.to(`issue:${issueId}`).emit('commentAdded', {
        issueId,
        comment: formattedComment,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Comment posted successfully',
      comment: formattedComment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Edit comment text.
 * @route   PATCH /api/v1/comments/:id
 */
export const updateComment = async (req, res, next) => {
  const { id } = req.params;
  const { text } = req.body;

  try {
    const comment = await Comment.findOne({ _id: id, isDeleted: false }).populate('user', 'username');
    if (!comment) {
      res.status(404);
      return next(new Error('Comment not found'));
    }

    if (comment.user._id.toString() !== req.user._id.toString()) {
      res.status(403);
      return next(new Error('Forbidden: You can only edit your own comments'));
    }

    comment.text = text.trim();
    await comment.save();

    const formattedComment = {
      id: comment._id,
      author: comment.user.username,
      text: comment.text,
      createdAt: comment.createdAt,
    };

    if (req.io) {
      req.io.to(`issue:${comment.issue}`).emit('commentUpdated', {
        issueId: comment.issue,
        comment: formattedComment,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Comment updated successfully',
      comment: formattedComment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Soft delete a comment.
 * @route   DELETE /api/v1/comments/:id
 */
export const deleteComment = async (req, res, next) => {
  const { id } = req.params;

  try {
    const comment = await Comment.findOne({ _id: id, isDeleted: false });
    if (!comment) {
      res.status(404);
      return next(new Error('Comment not found'));
    }

    const issue = await Issue.findById(comment.issue);

    const isCommentAuthor = comment.user.toString() === req.user._id.toString();
    const isIssueAuthor = issue && issue.author.toString() === req.user._id.toString();

    if (!isCommentAuthor && !isIssueAuthor) {
      res.status(403);
      return next(new Error('Forbidden: You cannot delete this comment'));
    }

    comment.isDeleted = true;
    comment.deletedAt = new Date();
    await comment.save();

    if (req.io) {
      req.io.to(`issue:${comment.issue}`).emit('commentDeleted', {
        issueId: comment.issue,
        commentId: id,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
