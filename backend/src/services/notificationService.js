const Notification = require('../models/Notification');

// The one function other modules should call — they never write to the Notification collection directly.
async function sendNotification({ userId, type, title, message, relatedActivityId, expiresAt }) {
  if (!userId || !type) {
    throw new Error('sendNotification requires at least userId and type');
  }

  return Notification.create({ userId, type, title, message, relatedActivityId, expiresAt });
}

async function listNotifications({ userId, isRead, page = 1, limit = 20 }) {
  const filter = { userId };
  if (isRead !== undefined) filter.isRead = isRead;

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(filter),
  ]);

  return { items, total, page: Number(page), limit: Number(limit) };
}

async function markAsRead(notificationId, userId) {
  return Notification.findOneAndUpdate({ _id: notificationId, userId }, { isRead: true }, { new: true });
}

async function markAllAsRead(userId) {
  const result = await Notification.updateMany({ userId, isRead: false }, { isRead: true });
  return result.modifiedCount;
}

// Escalation hooks (see role spec §7). Detection of "overdue" / "engagement drop" belongs to the
// activity-due-date and analytics owners; they call these once they've made that determination.
async function notifyOverdueActivity({ studentId, activityId, activityTitle, adminId, isMandatory }) {
  const studentNotification = await sendNotification({
    userId: studentId,
    type: 'OVERDUE',
    title: 'Activity overdue',
    message: `Your activity "${activityTitle}" is overdue.`,
    relatedActivityId: activityId,
  });

  let adminNotification = null;
  if (isMandatory && adminId) {
    adminNotification = await sendNotification({
      userId: adminId,
      type: 'SYSTEM',
      title: 'Mandatory activity overdue',
      message: `Student ${studentId} has an overdue mandatory activity "${activityTitle}".`,
      relatedActivityId: activityId,
    });
  }

  return { studentNotification, adminNotification };
}

async function notifyEngagementDrop({ adminId, studentId, details }) {
  return sendNotification({
    userId: adminId,
    type: 'SYSTEM',
    title: 'Engagement drop detected',
    message: details || `Student ${studentId} engagement has dropped.`,
  });
}

module.exports = {
  sendNotification,
  listNotifications,
  markAsRead,
  markAllAsRead,
  notifyOverdueActivity,
  notifyEngagementDrop,
};
