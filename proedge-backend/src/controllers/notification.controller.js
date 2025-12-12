const notificationService = require('../services/notification.service');

/**
 * Send notification (Admin only)
 */
async function sendNotification(req, res, next) {
  try {
    const { userId, userIds, type, title, message, data } = req.body;

    // Support both single userId and array of userIds
    const targets = userIds || (userId ? [userId] : []);

    if (targets.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No recipients specified',
      });
    }

    const notifications = [];
    for (const targetId of targets) {
      const notification = await notificationService.sendNotification(
        targetId,
        type,
        title,
        message,
        data
      );
      notifications.push(notification);
    }

    res.status(201).json({
      success: true,
      message: `Notification sent successfully to ${notifications.length} user(s)`,
      data: { notifications },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get user notifications
 */
async function getUserNotifications(req, res, next) {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 20;

    const notifications = await notificationService.getUserNotifications(userId, limit);

    res.status(200).json({
      success: true,
      message: 'Notifications fetched successfully',
      data: { notifications },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Mark notification as read
 */
async function markAsRead(req, res, next) {
  try {
    const { id } = req.params;

    await notificationService.markAsRead(id);

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete notification (Admin only)
 */
async function deleteNotification(req, res, next) {
  try {
    const { id } = req.params;

    await notificationService.deleteNotification(id);

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  sendNotification,
  getUserNotifications,
  markAsRead,
  deleteNotification,
};
