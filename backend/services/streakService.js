const User = require('../models/User');
const Notification = require('../models/Notification');
const { STREAK_BONUSES } = require('../config/levels');
const notificationSvc = require('./notificationService');

/**
 * Normalise a Date to midnight UTC for day-level comparison.
 */
const toUTCDay = (date) => {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

const diffDays = (a, b) => Math.round((toUTCDay(a) - toUTCDay(b)) / 86400000);

/**
 * Update the streak for a student after a qualifying activity event.
 *
 * @param {string} studentId
 * @param {Date}   eventDate   — the date of the activity (usually now)
 * @returns {{ streakIncremented: boolean, newStreak: number, bonusXP: number, bonusReason: string|null }}
 */
const updateStreak = async (studentId, eventDate = new Date()) => {
  const user = await User.findById(studentId);
  if (!user) throw new Error(`User ${studentId} not found`);

  const today = toUTCDay(eventDate);
  const lastDate = user.lastActivityDate ? toUTCDay(user.lastActivityDate) : null;

  let newStreak = user.currentStreak;
  let streakIncremented = false;

  if (!lastDate) {
    // First ever activity
    newStreak = 1;
    streakIncremented = true;
  } else {
    const gap = diffDays(today, lastDate);
    if (gap === 0) {
      // Same day — streak unchanged, no bonus
      return { streakIncremented: false, newStreak, bonusXP: 0, bonusReason: null };
    } else if (gap === 1) {
      // Consecutive day
      newStreak = user.currentStreak + 1;
      streakIncremented = true;
    } else {
      // Gap > 1 day — streak broken
      newStreak = 1;
      streakIncremented = true; // reset to 1 counts as "updating"
      await notificationService.notifyStreak(studentId, user.currentStreak, 'STREAK_BROKEN');
    }
  }

  const newLongest = Math.max(user.longestStreak, newStreak);

  await User.findByIdAndUpdate(studentId, {
    currentStreak:    newStreak,
    longestStreak:    newLongest,
    lastActivityDate: eventDate,
  });

  // Calculate streak bonus XP for milestones
  let bonusXP = 0;
  let bonusReason = null;

  if (streakIncremented && newStreak > 1) {
    // Find the highest applicable bonus for the NEW streak
    const applicable = [...STREAK_BONUSES]
      .reverse()
      .find((b) => newStreak === b.streakDays); // exact day milestone only

    if (applicable) {
      bonusXP = applicable.bonusXP;
      bonusReason = applicable.reason;
      await notificationService.notifyStreak(studentId, newStreak, 'STREAK_MAINTAINED');
    }
  }

  return { streakIncremented, newStreak, bonusXP, bonusReason };
};

/**
 * Get streak data for a student without modifying anything.
 */
const getStreakInfo = async (studentId) => {
  const user = await User.findById(studentId).select(
    'currentStreak longestStreak lastActivityDate totalXP'
  );
  if (!user) throw new Error(`User ${studentId} not found`);

  const today = toUTCDay(new Date());
  const lastDate = user.lastActivityDate ? toUTCDay(user.lastActivityDate) : null;
  const daysSinceLastActivity = lastDate ? diffDays(today, lastDate) : null;

  // Streak is "at risk" if no activity today (gap === 1 day, meaning they had yesterday)
  const atRisk = daysSinceLastActivity === 1;
  const broken = daysSinceLastActivity !== null && daysSinceLastActivity > 1;

  // Next streak bonus milestones
  const upcomingBonuses = STREAK_BONUSES.filter((b) => b.streakDays > user.currentStreak).slice(0, 3);

  return {
    currentStreak:        user.currentStreak,
    longestStreak:        user.longestStreak,
    lastActivityDate:     user.lastActivityDate,
    daysSinceLastActivity,
    isAtRisk:             atRisk,
    isStreakBroken:       broken,
    upcomingStreakBonuses: upcomingBonuses,
  };
};

module.exports = { updateStreak, getStreakInfo };
