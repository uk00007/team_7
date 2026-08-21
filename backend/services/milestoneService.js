const mongoose      = require('mongoose');
const Milestone     = require('../models/Milestone');
const StudentMilestone = require('../models/StudentMilestone');
const Submission    = require('../models/Submission');
const User          = require('../models/User');
const notificationSvc = require('./notificationService');

/**
 * Build a stats snapshot relevant to milestone criteria.
 */
const buildMilestoneStats = async (studentId) => {
  const user = await User.findById(studentId).select('totalXP currentLevel currentStreak');
  if (!user) throw new Error(`User ${studentId} not found`);

  const approvedSubs = await Submission.find({ studentId, status: 'APPROVED' }).populate('activityId', 'type');

  const typeCounts = {};
  for (const sub of approvedSubs) {
    const t = sub.activityId?.type;
    if (t) typeCounts[t] = (typeCounts[t] || 0) + 1;
  }

  return {
    totalXP:          user.totalXP,
    currentLevel:     user.currentLevel,
    currentStreak:    user.currentStreak,
    activityCount:    approvedSubs.length,
    QUIZ_COUNT:       typeCounts['QUIZ'] || 0,
    COURSE_COUNT:     typeCounts['COURSE']    || 0,
    ASSIGNMENT_COUNT: typeCounts['ASSIGNMENT'] || 0,
    MENTORING_COUNT:  typeCounts['MENTORING']  || 0,
    CERTIFICATE_COUNT:typeCounts['CERTIFICATE']|| 0,
  };
};

const getCurrentProgress = (stats, criteriaType) => {
  const map = {
    XP_TOTAL:          stats.totalXP,
    ACTIVITY_COUNT:    stats.activityCount,
    QUIZ_COUNT:       stats.QUIZ_COUNT,
    COURSE_COUNT:     stats.COURSE_COUNT,
    ASSIGNMENT_COUNT:  stats.ASSIGNMENT_COUNT,
    MENTORING_COUNT:   stats.MENTORING_COUNT,
    CERTIFICATE_COUNT: stats.CERTIFICATE_COUNT,
    STREAK_DAYS:       stats.currentStreak,
    LEVEL_REACHED:     stats.currentLevel,
  };
  return map[criteriaType] ?? 0;
};

/**
 * Update milestone progress for a student.
 * Returns list of newly completed milestones.
 */
const updateMilestoneProgress = async (studentId) => {
  const [stats, activeMilestones] = await Promise.all([
    buildMilestoneStats(studentId),
    Milestone.find({ isActive: true }).sort({ order: 1 }),
  ]);

  const newlyCompleted = [];

  for (const milestone of activeMilestones) {
    const current = getCurrentProgress(stats, milestone.criteria.type);
    const target  = milestone.criteria.value;

    try {
      const existing = await StudentMilestone.findOne({ studentId, milestoneId: milestone._id });

      if (!existing) {
        // Create new record
        await StudentMilestone.create({
          studentId,
          milestoneId:  milestone._id,
          progress:     current,
          target,
          isCompleted:  current >= target,
          completedAt:  current >= target ? new Date() : null,
        });
        if (current >= target) {
          newlyCompleted.push(milestone);
          await notificationSvc.notifyMilestone(studentId, milestone.name);
        }
      } else if (!existing.isCompleted) {
        // Update existing record
        const justCompleted = current >= target;
        await StudentMilestone.findByIdAndUpdate(existing._id, {
          progress:    current,
          isCompleted: justCompleted,
          completedAt: justCompleted ? new Date() : null,
        });
        if (justCompleted) {
          newlyCompleted.push(milestone);
          await notificationSvc.notifyMilestone(studentId, milestone.name);
        }
      }
    } catch (err) {
      if (err.code !== 11000) console.error(`[MilestoneService] Error updating milestone ${milestone._id}:`, err.message);
    }
  }

  // Award milestone bonus XP — lazy import to avoid circular dependency
  if (newlyCompleted.length > 0) {
    const xpService = require('./xpService');
    for (const milestone of newlyCompleted) {
      if (milestone.xpReward > 0) {
        await xpService.awardXP({
          studentId,
          xp:     milestone.xpReward,
          reason: `Milestone reached: ${milestone.name}`,
          type:   'BONUS',
          metadata: { milestoneId: milestone._id.toString() },
        });
      }
    }
  }

  return newlyCompleted;
};

/**
 * Get all milestones with student progress.
 */
const getStudentMilestones = async (studentId) => {
  const [stats, allMilestones, studentRecords] = await Promise.all([
    buildMilestoneStats(studentId),
    Milestone.find({ isActive: true }).sort({ order: 1 }),
    StudentMilestone.find({ studentId }),
  ]);

  const recordMap = new Map(studentRecords.map((r) => [r.milestoneId.toString(), r]));

  return allMilestones.map((m) => {
    const record  = recordMap.get(m._id.toString());
    const current = getCurrentProgress(stats, m.criteria.type);
    const target  = m.criteria.value;

    return {
      ...m.toObject(),
      currentProgress: current,
      progressPercent: Math.min(100, Math.floor((current / target) * 100)),
      isCompleted:     record?.isCompleted || false,
      completedAt:     record?.completedAt || null,
    };
  });
};

module.exports = { updateMilestoneProgress, getStudentMilestones };
