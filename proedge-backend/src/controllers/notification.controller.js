const notificationService = require('../services/notification.service');

/**
 * Send notification (Admin only)
 */
async function sendNotification(req, res, next) {
  try {
    const { userId, type, title, message, data } = req.body;
    
    const notification = await notificationService.sendNotification(
      userId,
      type,
      title,
      message,
      data
    );
    
    res.status(201).json({
      success: true,
      message: 'Notification sent successfully',
      data: { notification },
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
