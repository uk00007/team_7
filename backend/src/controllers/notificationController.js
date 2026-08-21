const notificationService = require('../services/notificationService');

async function getNotifications(req, res, next) {
  try {
    const { isRead, page, limit } = req.query;
    const result = await notificationService.listNotifications({
      userId: req.user.id,
      isRead: isRead !== undefined ? isRead === 'true' : undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
    res.success(result, 'Notifications retrieved');
  } catch (err) {
    next(err);
  }
}

async function markRead(req, res, next) {
  try {
    const notification = await notificationService.markAsRead(req.params.id, req.user.id);
    if (!notification) {
      return res.fail('Notification not found', 'Not found', 404);
    }
    res.success(notification, 'Notification marked as read');
  } catch (err) {
    next(err);
  }
}

async function markAllRead(req, res, next) {
  try {
    const count = await notificationService.markAllAsRead(req.user.id);
    res.success({ updated: count }, 'All notifications marked as read');
  } catch (err) {
    next(err);
  }
}

async function createNotification(req, res, next) {
  try {
    const { userId, type, title, message, relatedActivityId, expiresAt } = req.body;
    const notification = await notificationService.sendNotification({
      userId,
      type,
      title,
      message,
      relatedActivityId,
      expiresAt,
    });
    res.success(notification, 'Notification created', 201);
  } catch (err) {
    next(err);
  }
}

module.exports = { getNotifications, markRead, markAllRead, createNotification };
