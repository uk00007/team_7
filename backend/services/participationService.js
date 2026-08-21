const mongoose    = require('mongoose');
const User        = require('../models/User');
const Submission  = require('../models/Submission');
const Activity    = require('../models/Activity');
const XPTransaction = require('../models/XPTransaction');
const Team        = require('../models/Team');

/**
 * Build a Mongoose query filter from admin query params.
 */
const buildFilter = ({ studentId, teamId, activityId, activityType, status, dateFrom, dateTo }) => {
  const f = {};
  if (studentId)    f.studentId   = studentId;
  if (activityId)   f.activityId  = activityId;
  if (status)       f.status      = status;
  if (dateFrom || dateTo) {
    f.submittedAt = {};
    if (dateFrom) f.submittedAt.$gte = new Date(dateFrom);
    if (dateTo)   f.submittedAt.$lte = new Date(dateTo);
  }
  return f;
};

/**
 * GET /api/admin/gamification/participation
 * Returns aggregated participation metrics.
 */
const getParticipationSummary = async (filters = {}) => {
  const now          = new Date();
  const monthStart   = new Date(now.getFullYear(), now.getMonth(), 1);
  const INACTIVE_DAYS = 14;
  const inactiveDate = new Date(now - INACTIVE_DAYS * 86400000);

  // Base submission filter from query params
  const submFilter = buildFilter(filters);

  // If activityType filter requested, get matching activityIds first
  let activityIds = null;
  if (filters.activityType) {
    const acts = await Activity.find({ type: filters.activityType }).select('_id').lean();
    activityIds = acts.map((a) => a._id);
    submFilter.activityId = { $in: activityIds };
  }
  if (filters.teamId) {
    const team = await Team.findById(filters.teamId).select('memberIds').lean();
    if (team) submFilter.studentId = { $in: team.memberIds };
  }

  const [
    totalStudents,
    activeStudents,
    inactiveStudents,
    totalSubmissions,
    pendingSubmissions,
    approvedSubmissions,
    rejectedSubmissions,
    overdueSubmissions,
    reviewPendingSubmissions,
    monthlyXPTotal,
    totalXPTotal,
    overdueActivities,
    recentActivity,
  ] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'student', lastActivityDate: { $gte: inactiveDate } }),
    User.countDocuments({ role: 'student', $or: [{ lastActivityDate: { $lt: inactiveDate } }, { lastActivityDate: null }] }),
    Submission.countDocuments(submFilter),
    Submission.countDocuments({ ...submFilter, status: 'PENDING' }),
    Submission.countDocuments({ ...submFilter, status: 'APPROVED' }),
    Submission.countDocuments({ ...submFilter, status: 'REJECTED' }),
    Submission.countDocuments({
      ...submFilter,
      status: 'PENDING',
      submittedAt: { $lt: new Date(now - 7 * 86400000) },
    }),
    Submission.countDocuments({ ...submFilter, status: 'REVIEW_PENDING_CONFIRMATION' }),
    XPTransaction.aggregate([
      { $match: { createdAt: { $gte: monthStart }, xp: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: '$xp' } } },
    ]),
    XPTransaction.aggregate([
      { $match: { xp: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: '$xp' } } },
    ]),
    Activity.countDocuments({ dueDate: { $lt: now }, status: 'PUBLISHED' }),
    Submission.find(submFilter)
      .sort({ submittedAt: -1 })
      .limit(15)
      .populate('studentId', 'name email teamId')
      .populate('activityId', 'title type'),
  ]);

  // Students with no recent activity (attention list)
  const studentsNeedingAttention = await User.find({
    role: 'student',
    $or: [{ lastActivityDate: { $lt: inactiveDate } }, { lastActivityDate: null }],
  })
    .sort({ totalXP: 1 })
    .limit(20)
    .select('name email totalXP currentLevel currentStreak lastActivityDate teamId');

  // Top students
  const topStudents = await User.find({ role: 'student' })
    .sort({ totalXP: -1 })
    .limit(10)
    .select('name email totalXP currentLevel currentStreak teamId');

  // Team participation summary
  const teamSummary = await Team.find()
    .sort({ totalXP: -1 })
    .limit(10)
    .select('name totalXP memberIds');

  return {
    students: {
      total:              totalStudents,
      active:             activeStudents,
      inactive:           inactiveStudents,
      activeThreshold:    `${INACTIVE_DAYS} days`,
      needingAttention:   studentsNeedingAttention,
      top:                topStudents,
    },
    submissions: {
      total:    totalSubmissions,
      pending:  pendingSubmissions,
      approved: approvedSubmissions,
      rejected: rejectedSubmissions,
      overdue:  overdueSubmissions,
      awaitingConfirmation: reviewPendingSubmissions,
    },
    recentActivity,
    xp: {
      totalAwarded:   totalXPTotal[0]?.total   || 0,
      monthlyAwarded: monthlyXPTotal[0]?.total || 0,
    },
    activities: {
      overdue: overdueActivities,
    },
    teams: teamSummary,
  };
};

/**
 * GET /api/admin/gamification/summary
 * High-level gamification summary for the admin dashboard.
 */
const getGamificationSummary = async () => {
  const now        = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart  = new Date(now.getFullYear(), 0, 1);

  const StudentAchievement = require('../models/StudentAchievement');
  const StudentMilestone   = require('../models/StudentMilestone');

  const [
    totalXP, monthlyXP, yearlyXP,
    activeStudents, inactiveStudents, totalStudents, activeTeams,
    milestonesCompleted, achievementsUnlocked,
    pendingReviews, approvedReviews, rejectedReviews, awaitingConfirmation,
    overdueSubmissions,
  ] = await Promise.all([
    XPTransaction.aggregate([{ $match: { xp: { $gt: 0 } } }, { $group: { _id: null, t: { $sum: '$xp' } } }]),
    XPTransaction.aggregate([{ $match: { xp: { $gt: 0 }, createdAt: { $gte: monthStart } } }, { $group: { _id: null, t: { $sum: '$xp' } } }]),
    XPTransaction.aggregate([{ $match: { xp: { $gt: 0 }, createdAt: { $gte: yearStart  } } }, { $group: { _id: null, t: { $sum: '$xp' } } }]),
    User.countDocuments({ role: 'student', lastActivityDate: { $gte: new Date(now - 14 * 86400000) } }),
    User.countDocuments({ role: 'student', $or: [{ lastActivityDate: { $lt: new Date(now - 14 * 86400000) } }, { lastActivityDate: null }] }),
    User.countDocuments({ role: 'student' }),
    Team.countDocuments({}),
    StudentMilestone.countDocuments({ isCompleted: true }),
    StudentAchievement.countDocuments({}),
    Submission.countDocuments({ status: 'PENDING' }),
    Submission.countDocuments({ status: 'APPROVED' }),
    Submission.countDocuments({ status: 'REJECTED' }),
    Submission.countDocuments({ status: 'REVIEW_PENDING_CONFIRMATION' }),
    Submission.countDocuments({ status: 'PENDING', submittedAt: { $lt: new Date(now - 7 * 86400000) } }),
  ]);

  return {
    xp: {
      total:   totalXP[0]?.t   || 0,
      monthly: monthlyXP[0]?.t || 0,
      yearly:  yearlyXP[0]?.t  || 0,
    },
    students: { total: totalStudents, active: activeStudents, inactive: inactiveStudents },
    teams:    { active: activeTeams },
    rewards:  { milestonesCompleted, achievementsUnlocked },
    reviews:  {
      pending: pendingReviews,
      approved: approvedReviews,
      rejected: rejectedReviews,
      awaitingConfirmation,
      overdue: overdueSubmissions,
    },
    participation: {
      activeRate: totalStudents > 0 ? Math.round((activeStudents / totalStudents) * 100) : 0,
    },
  };
};

module.exports = { getParticipationSummary, getGamificationSummary, buildFilter };
