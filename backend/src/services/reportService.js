// Report Service
// Parth — Analytics & Reporting Module
// Generates filtered reports from shared DB data

const mongoose = require('mongoose');
const User = require('../models/User');
const Activity = require('../models/Activity');
const Enrollment = require('../models/Enrollment');
const Submission = require('../models/Submission');
const XPTransaction = require('../models/XPTransaction');
const Team = require('../models/Team');
const Certificate = require('../models/Certificate');

const { ENROLLMENT_STATUS, MONTH_LABELS, USER_ROLES } = require('../utils/constants');
const { toGraphFormat } = require('../utils/response');

// ============================================================
// HELPER: Build dynamic filter query
// ============================================================

function buildDateFilter(month, year) {
  const filter = {};
  if (year && month) {
    const start = new Date(parseInt(year), parseInt(month) - 1, 1);
    const end = new Date(parseInt(year), parseInt(month), 1);
    filter.$gte = start;
    filter.$lt = end;
  } else if (year) {
    const start = new Date(parseInt(year), 0, 1);
    const end = new Date(parseInt(year) + 1, 0, 1);
    filter.$gte = start;
    filter.$lt = end;
  }
  return Object.keys(filter).length > 0 ? filter : null;
}

// ============================================================
// INDIVIDUAL STUDENT REPORT
// ============================================================

async function generateStudentReport(studentId, filters = {}) {
  const objectId = new mongoose.Types.ObjectId(studentId);
  const { month, year, type, status, scoreMin, scoreMax } = filters;

  const user = await User.findById(objectId).select('-password').lean();
  if (!user) throw new Error('Student not found');

  // Build enrollment query
  const enrollmentQuery = { studentId: objectId };
  if (status) enrollmentQuery.status = status;

  let enrollments = await Enrollment.find(enrollmentQuery)
    .populate('activityId')
    .lean();

  // Filter by activity type if specified
  if (type) {
    enrollments = enrollments.filter(e => e.activityId && e.activityId.type === type);
  }

  // Filter by date range
  const dateFilter = buildDateFilter(month, year);
  if (dateFilter) {
    enrollments = enrollments.filter(e => {
      const d = new Date(e.enrolledAt);
      return (!dateFilter.$gte || d >= dateFilter.$gte) && (!dateFilter.$lt || d < dateFilter.$lt);
    });
  }

  // Build submission query
  const submissionQuery = { studentId: objectId, status: 'APPROVED' };
  if (scoreMin || scoreMax) {
    submissionQuery.score = {};
    if (scoreMin) submissionQuery.score.$gte = parseInt(scoreMin);
    if (scoreMax) submissionQuery.score.$lte = parseInt(scoreMax);
  }

  const submissions = await Submission.find(submissionQuery)
    .populate('activityId', 'title type category')
    .lean();

  // XP transactions
  const xpQuery = { studentId: objectId };
  if (dateFilter) xpQuery.createdAt = dateFilter;
  const xpTransactions = await XPTransaction.find(xpQuery).lean();
  const totalXPInPeriod = xpTransactions.reduce((sum, t) => sum + t.xp, 0);

  // Certificates
  const certificates = await Certificate.find({ studentId: objectId }).lean();

  // Summary
  const completed = enrollments.filter(e => e.status === ENROLLMENT_STATUS.COMPLETED).length;
  const total = enrollments.length;

  return {
    student: {
      id: user._id,
      name: user.name,
      email: user.email,
      totalXP: user.totalXP,
      currentLevel: user.currentLevel,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
    },
    filters: { month, year, type, status, scoreMin, scoreMax },
    summary: {
      totalEnrollments: total,
      completedActivities: completed,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      totalXPEarned: totalXPInPeriod,
      averageScore: submissions.length > 0
        ? Math.round(submissions.filter(s => s.score !== null).reduce((sum, s) => sum + s.score, 0) / submissions.filter(s => s.score !== null).length)
        : 0,
      totalCertificates: certificates.length,
      validatedCertificates: certificates.filter(c => c.status === 'VALIDATED').length,
    },
    enrollments: enrollments.map(e => ({
      activityId: e.activityId ? e.activityId._id : null,
      title: e.activityId ? e.activityId.title : 'Unknown',
      type: e.activityId ? e.activityId.type : 'Unknown',
      status: e.status,
      progress: e.progress,
      enrolledAt: e.enrolledAt,
      completedAt: e.completedAt,
    })),
    submissions: submissions.map(s => ({
      activityTitle: s.activityId ? s.activityId.title : 'Unknown',
      activityType: s.activityId ? s.activityId.type : 'Unknown',
      score: s.score,
      xpAwarded: s.xpAwarded,
      submittedAt: s.submittedAt,
    })),
  };
}

// ============================================================
// TEAM REPORT
// ============================================================

async function generateTeamReport(teamId, filters = {}) {
  const objectId = new mongoose.Types.ObjectId(teamId);
  const { month, year, type, status } = filters;

  const team = await Team.findById(objectId)
    .populate('memberIds', 'name email totalXP currentLevel currentStreak')
    .lean();

  if (!team) throw new Error('Team not found');

  const memberObjectIds = team.memberIds.map(m => m._id);

  // Enrollment stats for the team
  const enrollmentQuery = { studentId: { $in: memberObjectIds } };
  if (status) enrollmentQuery.status = status;

  let enrollments = await Enrollment.find(enrollmentQuery)
    .populate('activityId', 'title type category')
    .lean();

  if (type) {
    enrollments = enrollments.filter(e => e.activityId && e.activityId.type === type);
  }

  const dateFilter = buildDateFilter(month, year);
  if (dateFilter) {
    enrollments = enrollments.filter(e => {
      const d = new Date(e.enrolledAt);
      return (!dateFilter.$gte || d >= dateFilter.$gte) && (!dateFilter.$lt || d < dateFilter.$lt);
    });
  }

  const completed = enrollments.filter(e => e.status === ENROLLMENT_STATUS.COMPLETED).length;
  const total = enrollments.length;

  // XP in period
  const xpQuery = { studentId: { $in: memberObjectIds } };
  if (dateFilter) xpQuery.createdAt = dateFilter;
  const xpTransactions = await XPTransaction.find(xpQuery).lean();
  const totalTeamXPInPeriod = xpTransactions.reduce((sum, t) => sum + t.xp, 0);

  // Per-member breakdown
  const memberBreakdown = team.memberIds.map(member => {
    const memberEnrollments = enrollments.filter(e => e.studentId && e.studentId.toString() === member._id.toString());
    const memberXP = xpTransactions
      .filter(t => t.studentId.toString() === member._id.toString())
      .reduce((sum, t) => sum + t.xp, 0);

    return {
      id: member._id,
      name: member.name,
      email: member.email,
      totalXP: member.totalXP,
      xpInPeriod: memberXP,
      enrollments: memberEnrollments.length,
      completed: memberEnrollments.filter(e => e.status === ENROLLMENT_STATUS.COMPLETED).length,
    };
  });

  // Rank
  const teamsAbove = await Team.countDocuments({ totalXP: { $gt: team.totalXP } });

  return {
    team: {
      id: team._id,
      name: team.name,
      description: team.description,
      totalXP: team.totalXP,
      rank: teamsAbove + 1,
      memberCount: team.memberIds.length,
    },
    filters: { month, year, type, status },
    summary: {
      totalEnrollments: total,
      completedActivities: completed,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      totalXPEarned: totalTeamXPInPeriod,
    },
    memberBreakdown,
  };
}

// ============================================================
// GENERAL REPORT (with all filters)
// ============================================================

async function generateReport(filters = {}) {
  const { studentId, teamId, activityId, type, month, year, status, scoreMin, scoreMax } = filters;

  // If a specific student or team is requested, delegate
  if (studentId) return generateStudentReport(studentId, filters);
  if (teamId) return generateTeamReport(teamId, filters);

  // Otherwise, generate a platform-wide report
  const dateFilter = buildDateFilter(month, year);

  // --- Activity filter ---
  const activityQuery = {};
  if (activityId) activityQuery._id = new mongoose.Types.ObjectId(activityId);
  if (type) activityQuery.type = type;
  const activities = await Activity.find(activityQuery).lean();
  const activityIds = activities.map(a => a._id);

  // --- Enrollment query ---
  const enrollmentQuery = {};
  if (activityIds.length > 0 && (activityId || type)) {
    enrollmentQuery.activityId = { $in: activityIds };
  }
  if (status) enrollmentQuery.status = status;

  let enrollments = await Enrollment.find(enrollmentQuery)
    .populate('activityId', 'title type category dueDate')
    .populate('studentId', 'name email teamId')
    .lean();

  if (dateFilter) {
    enrollments = enrollments.filter(e => {
      const d = new Date(e.enrolledAt);
      return (!dateFilter.$gte || d >= dateFilter.$gte) && (!dateFilter.$lt || d < dateFilter.$lt);
    });
  }

  // --- Submission query ---
  const submissionQuery = {};
  if (activityIds.length > 0 && (activityId || type)) {
    submissionQuery.activityId = { $in: activityIds };
  }
  if (scoreMin || scoreMax) {
    submissionQuery.score = {};
    if (scoreMin) submissionQuery.score.$gte = parseInt(scoreMin);
    if (scoreMax) submissionQuery.score.$lte = parseInt(scoreMax);
  }

  const submissions = await Submission.find(submissionQuery)
    .populate('activityId', 'title type')
    .populate('studentId', 'name email')
    .lean();

  // Summary
  const totalEnrollments = enrollments.length;
  const completed = enrollments.filter(e => e.status === ENROLLMENT_STATUS.COMPLETED).length;
  const inProgress = enrollments.filter(e =>
    [ENROLLMENT_STATUS.ENROLLED, ENROLLMENT_STATUS.IN_PROGRESS].includes(e.status)
  ).length;

  const approvedSubs = submissions.filter(s => s.status === 'APPROVED' && s.score !== null);
  const avgScore = approvedSubs.length > 0
    ? Math.round(approvedSubs.reduce((sum, s) => sum + s.score, 0) / approvedSubs.length)
    : 0;

  // XP in period
  const xpQuery = {};
  if (activityIds.length > 0 && (activityId || type)) {
    xpQuery.activityId = { $in: activityIds };
  }
  if (dateFilter) xpQuery.createdAt = dateFilter;
  const xpTransactions = await XPTransaction.find(xpQuery).lean();
  const totalXP = xpTransactions.reduce((sum, t) => sum + t.xp, 0);

  // Activity-level breakdown
  const activityBreakdown = activities.map(a => {
    const aEnrollments = enrollments.filter(e => e.activityId && e.activityId._id.toString() === a._id.toString());
    const aCompleted = aEnrollments.filter(e => e.status === ENROLLMENT_STATUS.COMPLETED).length;
    const aSubs = submissions.filter(s => s.activityId && s.activityId._id.toString() === a._id.toString());
    const aApproved = aSubs.filter(s => s.status === 'APPROVED' && s.score !== null);
    return {
      id: a._id,
      title: a.title,
      type: a.type,
      category: a.category,
      enrolled: aEnrollments.length,
      completed: aCompleted,
      completionRate: aEnrollments.length > 0 ? Math.round((aCompleted / aEnrollments.length) * 100) : 0,
      averageScore: aApproved.length > 0
        ? Math.round(aApproved.reduce((sum, s) => sum + s.score, 0) / aApproved.length)
        : 0,
    };
  });

  // Leaderboard
  const leaderboard = await User.find({ role: USER_ROLES.STUDENT })
    .sort({ totalXP: -1 })
    .limit(20)
    .select('name email totalXP currentLevel')
    .lean();

  return {
    filters: { activityId, type, month, year, status, scoreMin, scoreMax },
    summary: {
      totalEnrollments,
      completed,
      inProgress,
      completionRate: totalEnrollments > 0 ? Math.round((completed / totalEnrollments) * 100) : 0,
      averageScore: avgScore,
      totalXPAwarded: totalXP,
    },
    activityBreakdown: activityBreakdown.length > 0 ? activityBreakdown : undefined,
    leaderboard,
  };
}

// ============================================================
// LEADERBOARD REPORT
// ============================================================

async function generateLeaderboardReport(filters = {}) {
  const { month, year, teamId, limit = 20 } = filters;

  // Individual leaderboard
  let individualLeaderboard;
  if (month && year) {
    // Monthly leaderboard from XP transactions
    const dateFilter = buildDateFilter(month, year);
    const pipeline = [
      { $match: { createdAt: dateFilter } },
      { $group: { _id: '$studentId', totalXP: { $sum: '$xp' } } },
      { $sort: { totalXP: -1 } },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 0,
          studentId: '$_id',
          name: '$user.name',
          email: '$user.email',
          totalXP: 1,
          currentLevel: '$user.currentLevel',
        },
      },
    ];
    individualLeaderboard = await XPTransaction.aggregate(pipeline);
  } else {
    // All-time leaderboard
    individualLeaderboard = await User.find({ role: USER_ROLES.STUDENT })
      .sort({ totalXP: -1 })
      .limit(parseInt(limit))
      .select('name email totalXP currentLevel')
      .lean();
  }

  // Team leaderboard
  let teamLeaderboard;
  if (teamId) {
    const team = await Team.findById(teamId).lean();
    teamLeaderboard = team ? [team] : [];
  } else {
    teamLeaderboard = await Team.find()
      .sort({ totalXP: -1 })
      .limit(parseInt(limit))
      .select('name totalXP memberIds')
      .lean();
  }

  teamLeaderboard = teamLeaderboard.map((t, idx) => ({
    rank: idx + 1,
    id: t._id,
    name: t.name,
    totalXP: t.totalXP,
    memberCount: t.memberIds ? t.memberIds.length : 0,
  }));

  return {
    filters: { month, year, teamId, limit },
    individualLeaderboard: individualLeaderboard.map((s, idx) => ({
      rank: idx + 1,
      ...s,
    })),
    teamLeaderboard,
  };
}

module.exports = {
  generateStudentReport,
  generateTeamReport,
  generateReport,
  generateLeaderboardReport,
};
