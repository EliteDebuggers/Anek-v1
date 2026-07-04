import Notification from '../models/Notification.js';
import { serializeNotification } from '../utils/responseSerializer.js';

/**
 * Get all notifications for current user.
 * @route   GET /api/v1/notifications
 */
export const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate('sender', 'username profilePicture')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      notifications: notifications.map(n => serializeNotification(n)),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark a specific notification as read.
 * @route   PATCH /api/v1/notifications/:id/read
 */
export const markAsRead = async (req, res, next) => {
  const { id } = req.params;

  try {
    const notification = await Notification.findOne({ _id: id, recipient: req.user._id });
    if (!notification) {
      res.status(404);
      return next(new Error('Notification not found'));
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      notification: serializeNotification(notification),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark all user notifications as read.
 * @route   PATCH /api/v1/notifications/read-all
 */
export const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    next(error);
  }
};
