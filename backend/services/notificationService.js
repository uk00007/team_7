
const Notification = require('../models/Notification');

/**
 * Create a single notification record.
 * @param {object} params
 * @param {string} params.userId
 * @param {string} params.type         — one of Notification type enum values
 * @param {string} params.title
 * @param {string} params.message
 * @param {string} [params.relatedActivityId]
 * @param {Date}   [params.expiresAt]
 */
const createNotification = async ({ userId, type, title, message, relatedActivityId = null, expiresAt = null }) => {
  try {
    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      relatedActivityId,
      expiresAt,
    });
    return notification;
  } catch (err) {
    // Notifications are non-critical — log but don't throw
    console.error(`[NotificationService] Failed to create notification for user ${userId}:`, err.message);
    return null;
  }
};

/**
 * Notify a student that XP was awarded.
 */
const notifyXPAwarded = async (userId, xp, reason, activityId = null) => {
  return createNotification({
    userId,
    type: 'XP_AWARDED',
    title: `+${xp} XP Earned!`,
    message: `You earned ${xp} XP. Reason: ${reason}`,
    relatedActivityId: activityId,
  });
};

/**
 * Notify a student that they levelled up.
 */
const notifyLevelUp = async (userId, newLevel, levelTitle) => {
  return createNotification({
    userId,
    type: 'LEVEL_UP',
    title: `🎉 Level Up! You're now Level ${newLevel}`,
    message: `Congratulations! You've reached Level ${newLevel} — ${levelTitle}. Keep going!`,
  });
};

/**
 * Notify a student that an achievement was unlocked.
 */
const notifyAchievementUnlocked = async (userId, achievementName, xpReward) => {
  return createNotification({
    userId,
    type: 'ACHIEVEMENT_UNLOCKED',
    title: `🏆 Achievement Unlocked: ${achievementName}`,
    message: xpReward > 0
      ? `You unlocked "${achievementName}" and earned ${xpReward} bonus XP!`
      : `You unlocked the "${achievementName}" achievement!`,
  });
};

/**
 * Notify a student about their streak status.
 */
const notifyStreak = async (userId, streakDays, type = 'STREAK_MAINTAINED') => {
  const titles = {
    STREAK_MAINTAINED: `🔥 ${streakDays}-Day Streak!`,
    STREAK_AT_RISK:    `⚠️ Streak at Risk!`,
    STREAK_BROKEN:     `💔 Streak Broken`,
  };
  const messages = {
    STREAK_MAINTAINED: `Amazing! You're on a ${streakDays}-day activity streak. Keep it up!`,
    STREAK_AT_RISK:    `You haven't been active today. Complete an activity to maintain your streak!`,
    STREAK_BROKEN:     `Your activity streak has been reset. Start a new one today!`,
  };
  return createNotification({
    userId,
    type,
    title: titles[type] || titles.STREAK_MAINTAINED,
    message: messages[type] || messages.STREAK_MAINTAINED,
  });
};

/**
 * Notify a student about a milestone.
 */
const notifyMilestone = async (userId, milestoneName) => {
  return createNotification({
    userId,
    type: 'MILESTONE_REACHED',
    title: `🎯 Milestone Reached: ${milestoneName}`,
    message: `You've reached the "${milestoneName}" milestone. Outstanding progress!`,
  });
};

module.exports = {
  createNotification,
  notifyXPAwarded,
  notifyLevelUp,
  notifyAchievementUnlocked,
  notifyStreak,
  notifyMilestone,
};
