const Achievement     = require('../models/Achievement');
const StudentAchievement = require('../models/StudentAchievement');
const Submission      = require('../models/Submission');
const XPTransaction   = require('../models/XPTransaction');
const User            = require('../models/User');
const notificationSvc = require('./notificationService');

/**
 * Build the student's current stats snapshot for achievement evaluation.
 * @param {string} studentId
 * @returns {object} stats
 */
const buildStudentStats = async (studentId) => {
  const user = await User.findById(studentId);
  if (!user) throw new Error(`User ${studentId} not found`);

  // Count approved submissions (= completed activities)
  const approvedSubmissions = await Submission.find({ studentId, status: 'APPROVED' }).populate('activityId', 'type');

  const typeCounts = {};
  for (const sub of approvedSubmissions) {
    const t = sub.activityId?.type;
    if (t) typeCounts[t] = (typeCounts[t] || 0) + 1;
  }

  const teamContribution = await XPTransaction.aggregate([
    { $match: { studentId: user._id, type: 'TEAM', xp: { $gt: 0 } } },
    { $group: { _id: null, total: { $sum: '$xp' } } },
  ]);

  return {
    totalXP:        user.totalXP,
    currentLevel:   user.currentLevel,
    currentStreak:  user.currentStreak,
    activityCount:  approvedSubmissions.length,
    courseCount:    typeCounts['COURSE'] || 0,
    assignmentCount:typeCounts['ASSIGNMENT'] || 0,
    quizCount:      typeCounts['QUIZ'] || 0,
    certificateCount:typeCounts['CERTIFICATE'] || 0,
    teamContribution: teamContribution[0]?.total || 0,
    typeCounts,
    isFirstSubmission: approvedSubmissions.length >= 1,
  };
};

/**
 * Check if a single achievement's criteria is satisfied.
 */
const isCriteriaMet = (achievement, stats) => {
  const { type, value, subtype } = achievement.criteria;
  switch (type) {
    case 'XP_TOTAL':           return stats.totalXP >= value;
    case 'ACTIVITY_COUNT':     return stats.activityCount >= value;
    case 'COURSE_COUNT':       return stats.courseCount >= value;
    case 'ASSIGNMENT_COUNT':   return stats.assignmentCount >= value;
    case 'QUIZ_COUNT':         return stats.quizCount >= value;
    case 'CERTIFICATE_COUNT':  return stats.certificateCount >= value;
    case 'TEAM_CONTRIBUTION':  return stats.teamContribution >= value;
    case 'STREAK_DAYS':        return stats.currentStreak >= value;
    case 'LEVEL_REACHED':      return stats.currentLevel >= value;
    case 'ACTIVITY_TYPE':      return (stats.typeCounts[subtype] || 0) >= value;
    case 'FIRST_SUBMISSION':   return stats.isFirstSubmission;
    default:                   return false;
  }
};

/**
 * Evaluate all active achievements for a student.
 * Unlocks newly earned achievements and returns the list of newly unlocked ones.
 *
 * NOTE: This function does NOT directly award XP — it returns bonuses for xpService to apply.
 *
 * @param {string} studentId
 * @returns {Array<{ achievement, bonusXP }>}  newly unlocked achievements with their bonus XP
 */
const evaluateAchievements = async (studentId) => {
  const [stats, allAchievements, alreadyUnlocked] = await Promise.all([
    buildStudentStats(studentId),
    Achievement.find({ isActive: true }),
    StudentAchievement.find({ studentId }).select('achievementId'),
  ]);

  const alreadyUnlockedIds = new Set(alreadyUnlocked.map((sa) => sa.achievementId.toString()));
  const newlyUnlocked = [];

  for (const achievement of allAchievements) {
    if (alreadyUnlockedIds.has(achievement._id.toString())) continue; // already earned
    if (!isCriteriaMet(achievement, stats)) continue;

    // Unlock it
    try {
      await StudentAchievement.create({
        studentId,
        achievementId: achievement._id,
        progress: 100,
        unlockedAt: new Date(),
      });

      await notificationSvc.notifyAchievementUnlocked(studentId, achievement.name, achievement.xpReward);
      newlyUnlocked.push({ achievement, bonusXP: achievement.xpReward });
    } catch (err) {
      if (err.code !== 11000) throw err; // ignore duplicate key (race condition safety)
    }
  }

  return newlyUnlocked;
};

/**
 * Get all achievements for a student with unlock status and progress.
 */
const getStudentAchievements = async (studentId) => {
  const [stats, allAchievements, unlocked] = await Promise.all([
    buildStudentStats(studentId),
    Achievement.find({ isActive: true }).sort({ type: 1, 'criteria.value': 1 }),
    StudentAchievement.find({ studentId }).populate('achievementId'),
  ]);

  const unlockedMap = new Map(unlocked.map((sa) => [sa.achievementId._id.toString(), sa]));

  return allAchievements.map((ach) => {
    const unlockedRecord = unlockedMap.get(ach._id.toString());
    const isUnlocked = !!unlockedRecord;

    // Calculate progress percentage for locked achievements
    let progressPct = 0;
    if (isUnlocked) {
      progressPct = 100;
    } else {
      const { type, value } = ach.criteria;
      switch (type) {
        case 'XP_TOTAL':           progressPct = Math.min(100, Math.floor((stats.totalXP / value) * 100)); break;
        case 'ACTIVITY_COUNT':     progressPct = Math.min(100, Math.floor((stats.activityCount / value) * 100)); break;
        case 'COURSE_COUNT':       progressPct = Math.min(100, Math.floor((stats.courseCount / value) * 100)); break;
        case 'ASSIGNMENT_COUNT':   progressPct = Math.min(100, Math.floor((stats.assignmentCount / value) * 100)); break;
        case 'QUIZ_COUNT':         progressPct = Math.min(100, Math.floor((stats.quizCount / value) * 100)); break;
        case 'CERTIFICATE_COUNT':  progressPct = Math.min(100, Math.floor((stats.certificateCount / value) * 100)); break;
        case 'TEAM_CONTRIBUTION':  progressPct = Math.min(100, Math.floor((stats.teamContribution / value) * 100)); break;
        case 'STREAK_DAYS':        progressPct = Math.min(100, Math.floor((stats.currentStreak / value) * 100)); break;
        case 'LEVEL_REACHED':      progressPct = Math.min(100, Math.floor((stats.currentLevel / value) * 100)); break;
        case 'ACTIVITY_TYPE':      progressPct = Math.min(100, Math.floor(((stats.typeCounts[ach.criteria.subtype] || 0) / value) * 100)); break;
        case 'FIRST_SUBMISSION':   progressPct = stats.activityCount > 0 ? 100 : 0; break;
      }
    }

    return {
      ...ach.toObject(),
      isUnlocked,
      unlockedAt: unlockedRecord?.unlockedAt || null,
      progress:   progressPct,
    };
  });
};

module.exports = { evaluateAchievements, getStudentAchievements };
