const Notification = require('../models/Notification');
const { success, error } = require('../utils/response');

const getNotifications = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { unreadOnly = 'false', limit = 20 } = req.query;

    const query = { userId };
    if (unreadOnly === 'true') query.isRead = false;

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10));

    const unreadCount = await Notification.countDocuments({ userId, isRead: false });

    return success(res, { notifications, unreadCount });
  } catch (err) {
    return error(res, err.message, 'SERVER_ERROR', 500);
  }
};

const markRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notif = await Notification.findByIdAndUpdate(id, { isRead: true }, { new: true });
    if (!notif) return error(res, 'Notification not found', 'NOT_FOUND', 404);
    return success(res, notif, 'Marked as read');
  } catch (err) {
    return error(res, err.message, 'SERVER_ERROR', 500);
  }
};

const markAllRead = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    await Notification.updateMany({ userId, isRead: false }, { isRead: true });
    return success(res, null, 'All notifications marked as read');
  } catch (err) {
    return error(res, err.message, 'SERVER_ERROR', 500);
  }
};

module.exports = { getNotifications, markRead, markAllRead };
