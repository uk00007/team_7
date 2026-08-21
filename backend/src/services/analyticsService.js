// Analytics Service
// Parth — Analytics & Reporting Module
// READ-ONLY: This service ONLY queries data. It never creates/modifies XP, submissions, etc.

const mongoose = require('mongoose');
const User = require('../models/User');
const Activity = require('../models/Activity');
const Enrollment = require('../models/Enrollment');
const Submission = require('../models/Submission');
const XPTransaction = require('../models/XPTransaction');
const Team = require('../models/Team');
const Certificate = require('../models/Certificate');
const Quiz = require('../models/Quiz');
const StudentAchievement = require('../models/StudentAchievement');
const Achievement = require('../models/Achievement');

const { ENROLLMENT_STATUS, MONTH_LABELS, USER_ROLES } = require('../utils/constants');
const { toGraphFormat } = require('../utils/response');

// ============================================================
// HELPER: Get month-year boundaries
// ============================================================

function getMonthRange(year, month) {
  // month is 1-indexed (1 = Jan)
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  return { start, end };
}

function getCurrentMonthRange() {
  const now = new Date();
  return getMonthRange(now.getFullYear(), now.getMonth() + 1);
}

function getYearRange(year) {
  const start = new Date(year, 0, 1);
  const end = new Date(year + 1, 0, 1);
  return { start, end };
}

// ============================================================
// STUDENT ANALYTICS
// ============================================================

/**
 * Get full student dashboard data — all metrics in one call
 */
async function getStudentDashboard(studentId) {
  const objectId = new mongoose.Types.ObjectId(studentId);

  const [
    user,
    enrollments,
    submissions,
    xpTransactions,
    certificates,
    achievements,
  ] = await Promise.all([
    User.findById(objectId).lean(),
    Enrollment.find({ studentId: objectId }).populate('activityId').lean(),
    Submission.find({ studentId: objectId }).lean(),
    XPTransaction.find({ studentId: objectId }).lean(),
    Certificate.find({ studentId: objectId }).lean(),
    StudentAchievement.find({ studentId: objectId }).populate('achievementId').lean(),
  ]);

  if (!user) {
    throw new Error('Student not found');
  }

  // --- XP Metrics ---
  const totalXP = user.totalXP || 0;
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlyXP = xpTransactions
    .filter(t => {
      const d = new Date(t.createdAt);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, t) => sum + t.xp, 0);

  const yearlyXP = xpTransactions
    .filter(t => new Date(t.createdAt).getFullYear() === currentYear)
    .reduce((sum, t) => sum + t.xp, 0);

  // --- Level & Rank ---
  const currentLevel = user.currentLevel || 1;

  // Rank: position among all students by totalXP (descending)
  const studentsAbove = await User.countDocuments({
    role: USER_ROLES.STUDENT,
    totalXP: { $gt: totalXP },
  });
  const rank = studentsAbove + 1;

  // Team rank
  let teamRank = null;
  if (user.teamId) {
    const team = await Team.findById(user.teamId).lean();
    if (team) {
      const teamsAbove = await Team.countDocuments({ totalXP: { $gt: team.totalXP } });
      teamRank = teamsAbove + 1;
    }
  }

  // --- Activity Stats ---
  const activitiesCompleted = enrollments.filter(e => e.status === ENROLLMENT_STATUS.COMPLETED).length;
  const activitiesPending = enrollments.filter(e =>
    [ENROLLMENT_STATUS.ENROLLED, ENROLLMENT_STATUS.IN_PROGRESS].includes(e.status)
  ).length;

  const activitiesOverdue = enrollments.filter(e => {
    if (e.status === ENROLLMENT_STATUS.COMPLETED) return false;
    const activity = e.activityId;
    if (!activity || !activity.dueDate) return false;
    return new Date(activity.dueDate) < now;
  }).length;

  const totalEnrolled = enrollments.length;
  const completionRate = totalEnrolled > 0
    ? Math.round((activitiesCompleted / totalEnrolled) * 100)
    : 0;

  // --- Streaks ---
  const currentStreak = user.currentStreak || 0;
  const longestStreak = user.longestStreak || 0;

  // --- Scores ---
  const approvedSubmissions = submissions.filter(s => s.status === 'APPROVED' && s.score !== null);
  const averageScore = approvedSubmissions.length > 0
    ? Math.round(approvedSubmissions.reduce((sum, s) => sum + s.score, 0) / approvedSubmissions.length)
    : 0;

  // --- Quiz Performance ---
  const quizEnrollments = enrollments.filter(e => e.activityId && e.activityId.type === 'QUIZ');
  const quizSubmissions = submissions.filter(s => {
    const qe = quizEnrollments.find(e => e.activityId && e.activityId._id.toString() === s.activityId.toString());
    return !!qe;
  });
  const quizCompleted = quizSubmissions.filter(s => s.status === 'APPROVED').length;
  const quizAvgScore = quizSubmissions.length > 0
    ? Math.round(quizSubmissions.filter(s => s.score !== null).reduce((sum, s) => sum + s.score, 0) / quizSubmissions.filter(s => s.score !== null).length)
    : 0;

  const quizPerformance = {
    totalQuizzes: quizEnrollments.length,
    completed: quizCompleted,
    averageScore: quizAvgScore,
  };

  // --- Certificate Progress ---
  const totalCertificates = certificates.length;
  const validatedCertificates = certificates.filter(c => c.status === 'VALIDATED').length;
  const certificateProgress = {
    total: totalCertificates,
    validated: validatedCertificates,
    pending: certificates.filter(c => c.status === 'PENDING' || c.status === 'UNDER_REVIEW').length,
    rejected: certificates.filter(c => c.status === 'REJECTED').length,
    completionRate: totalCertificates > 0
      ? Math.round((validatedCertificates / totalCertificates) * 100)
      : 0,
  };

  // --- Category Performance (Strongest / Weakest) ---
  const categoryMap = {};
  for (const enrollment of enrollments) {
    const activity = enrollment.activityId;
    if (!activity) continue;
    const cat = activity.category || 'GENERAL';
    if (!categoryMap[cat]) {
      categoryMap[cat] = { total: 0, completed: 0, totalScore: 0, scoredCount: 0 };
    }
    categoryMap[cat].total += 1;
    if (enrollment.status === ENROLLMENT_STATUS.COMPLETED) {
      categoryMap[cat].completed += 1;
    }
  }
  // Add scores from submissions
  for (const sub of approvedSubmissions) {
    const enrollment = enrollments.find(e => e.activityId && e.activityId._id.toString() === sub.activityId.toString());
    if (enrollment && enrollment.activityId) {
      const cat = enrollment.activityId.category || 'GENERAL';
      if (categoryMap[cat]) {
        categoryMap[cat].totalScore += sub.score;
        categoryMap[cat].scoredCount += 1;
      }
    }
  }

  const categories = Object.entries(categoryMap).map(([category, data]) => ({
    category,
    total: data.total,
    completed: data.completed,
    completionRate: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
    averageScore: data.scoredCount > 0 ? Math.round(data.totalScore / data.scoredCount) : 0,
  }));

  // Sort by completion rate for strongest/weakest
  const sorted = [...categories].sort((a, b) => b.completionRate - a.completionRate);
  const strongestCategories = sorted.slice(0, 3);
  const weakestCategories = sorted.slice(-3).reverse();

  // --- Achievements ---
  const unlockedAchievements = achievements.map(a => ({
    name: a.achievementId ? a.achievementId.name : 'Unknown',
    description: a.achievementId ? a.achievementId.description : '',
    icon: a.achievementId ? a.achievementId.icon : '',
    unlockedAt: a.unlockedAt,
  }));

  return {
    student: {
      id: user._id,
      name: user.name,
      email: user.email,
      teamId: user.teamId,
    },
    xp: { totalXP, monthlyXP, yearlyXP },
    level: currentLevel,
    rank,
    teamRank,
    completionRate,
    activities: {
      completed: activitiesCompleted,
      pending: activitiesPending,
      overdue: activitiesOverdue,
      total: totalEnrolled,
    },
    streaks: { currentStreak, longestStreak },
    averageScore,
    quizPerformance,
    certificateProgress,
    strongestCategories,
    weakestCategories,
    achievements: unlockedAchievements,
  };
}

// ============================================================
// STUDENT GRAPH APIS
// ============================================================

/**
 * Monthly XP breakdown — labels: month names, values: XP per month
 */
async function getStudentMonthlyXPGraph(studentId, year) {
  const objectId = new mongoose.Types.ObjectId(studentId);
  const targetYear = year || new Date().getFullYear();
  const { start, end } = getYearRange(targetYear);

  const pipeline = [
    {
      $match: {
        studentId: objectId,
        createdAt: { $gte: start, $lt: end },
      },
    },
    {
      $group: {
        _id: { $month: '$createdAt' },
        totalXP: { $sum: '$xp' },
      },
    },
    { $sort: { _id: 1 } },
  ];

  const results = await XPTransaction.aggregate(pipeline);

  // Fill all 12 months
  const monthData = MONTH_LABELS.map((label, idx) => {
    const found = results.find(r => r._id === idx + 1);
    return { label, value: found ? found.totalXP : 0 };
  });

  return toGraphFormat(monthData, 'label', 'value');
}

/**
 * Yearly XP breakdown — labels: year strings, values: XP per year
 */
async function getStudentYearlyXPGraph(studentId) {
  const objectId = new mongoose.Types.ObjectId(studentId);

  const pipeline = [
    { $match: { studentId: objectId } },
    {
      $group: {
        _id: { $year: '$createdAt' },
        totalXP: { $sum: '$xp' },
      },
    },
    { $sort: { _id: 1 } },
  ];

  const results = await XPTransaction.aggregate(pipeline);

  const data = results.map(r => ({ label: String(r._id), value: r.totalXP }));
  return toGraphFormat(data, 'label', 'value');
}

/**
 * Activity completion graph — labels: month names, values: count of completions
 */
async function getStudentActivityCompletionGraph(studentId, year) {
  const objectId = new mongoose.Types.ObjectId(studentId);
  const targetYear = year || new Date().getFullYear();
  const { start, end } = getYearRange(targetYear);

  const completedEnrollments = await Enrollment.find({
    studentId: objectId,
    status: ENROLLMENT_STATUS.COMPLETED,
    completedAt: { $gte: start, $lt: end },
  }).lean();

  // Group by month
  const monthCounts = new Array(12).fill(0);
  for (const e of completedEnrollments) {
    if (e.completedAt) {
      const m = new Date(e.completedAt).getMonth();
      monthCounts[m] += 1;
    }
  }

  const data = MONTH_LABELS.map((label, idx) => ({ label, value: monthCounts[idx] }));
  return toGraphFormat(data, 'label', 'value');
}

/**
 * Score distribution graph — labels: activity titles, values: scores
 */
async function getStudentScoresGraph(studentId) {
  const objectId = new mongoose.Types.ObjectId(studentId);

  const submissions = await Submission.find({
    studentId: objectId,
    status: 'APPROVED',
    score: { $ne: null },
  })
    .populate('activityId', 'title')
    .sort({ submittedAt: -1 })
    .limit(20)
    .lean();

  const data = submissions.map(s => ({
    label: s.activityId ? s.activityId.title : 'Unknown',
    value: s.score,
  }));

  return toGraphFormat(data, 'label', 'value');
}

/**
 * Contribution over time — labels: month names, values: count of submissions/completions
 */
async function getStudentContributionGraph(studentId, year) {
  const objectId = new mongoose.Types.ObjectId(studentId);
  const targetYear = year || new Date().getFullYear();
  const { start, end } = getYearRange(targetYear);

  const pipeline = [
    {
      $match: {
        studentId: objectId,
        createdAt: { $gte: start, $lt: end },
      },
    },
    {
      $group: {
        _id: { $month: '$createdAt' },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ];

  const results = await XPTransaction.aggregate(pipeline);

  const data = MONTH_LABELS.map((label, idx) => {
    const found = results.find(r => r._id === idx + 1);
    return { label, value: found ? found.count : 0 };
  });

  return toGraphFormat(data, 'label', 'value');
}

/**
 * Streak history graph — labels: month names, values: streak count at month end
 * (Approximated using XP transactions as activity signals)
 */
async function getStudentStreakGraph(studentId, year) {
  const objectId = new mongoose.Types.ObjectId(studentId);
  const targetYear = year || new Date().getFullYear();
  const { start, end } = getYearRange(targetYear);

  // Count active days per month as a streak proxy
  const pipeline = [
    {
      $match: {
        studentId: objectId,
        createdAt: { $gte: start, $lt: end },
      },
    },
    {
      $group: {
        _id: {
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' },
        },
      },
    },
    {
      $group: {
        _id: '$_id.month',
        activeDays: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ];

  const results = await XPTransaction.aggregate(pipeline);

  const data = MONTH_LABELS.map((label, idx) => {
    const found = results.find(r => r._id === idx + 1);
    return { label, value: found ? found.activeDays : 0 };
  });

  return toGraphFormat(data, 'label', 'value');
}

/**
 * Category performance graph — labels: category names, values: completion rates
 */
async function getStudentCategoryPerformanceGraph(studentId) {
  const objectId = new mongoose.Types.ObjectId(studentId);

  const enrollments = await Enrollment.find({ studentId: objectId })
    .populate('activityId', 'category')
    .lean();

  const categoryMap = {};
  for (const e of enrollments) {
    const cat = e.activityId ? (e.activityId.category || 'GENERAL') : 'GENERAL';
    if (!categoryMap[cat]) categoryMap[cat] = { total: 0, completed: 0 };
    categoryMap[cat].total += 1;
    if (e.status === ENROLLMENT_STATUS.COMPLETED) {
      categoryMap[cat].completed += 1;
    }
  }

  const data = Object.entries(categoryMap).map(([cat, vals]) => ({
    label: cat,
    value: vals.total > 0 ? Math.round((vals.completed / vals.total) * 100) : 0,
  }));

  return toGraphFormat(data, 'label', 'value');
}

/**
 * Returns all graph data in a single call for student dashboard
 */
async function getStudentGraphs(studentId, year) {
  const [
    monthlyXP,
    yearlyXP,
    activityCompletion,
    scores,
    contribution,
    streak,
    categoryPerformance,
  ] = await Promise.all([
    getStudentMonthlyXPGraph(studentId, year),
    getStudentYearlyXPGraph(studentId),
    getStudentActivityCompletionGraph(studentId, year),
    getStudentScoresGraph(studentId),
    getStudentContributionGraph(studentId, year),
    getStudentStreakGraph(studentId, year),
    getStudentCategoryPerformanceGraph(studentId),
  ]);

  return {
    monthlyXP,
    yearlyXP,
    activityCompletion,
    scores,
    contribution,
    streak,
    categoryPerformance,
  };
}

// ============================================================
// ADMIN ANALYTICS
// ============================================================

async function getAdminDashboard() {
  const now = new Date();
  const { start: monthStart, end: monthEnd } = getCurrentMonthRange();

  // --- Student Counts ---
  const totalStudents = await User.countDocuments({ role: USER_ROLES.STUDENT });
  const totalEnrolledStudents = await Enrollment.distinct('studentId').then(ids => ids.length);

  // Active = students who have at least 1 XP transaction or enrollment update this month
  const activeStudentIds = await XPTransaction.distinct('studentId', {
    createdAt: { $gte: monthStart, $lt: monthEnd },
  });
  const activeStudents = activeStudentIds.length;
  const inactiveStudents = totalStudents - activeStudents;

  // --- Engagement Rate ---
  const monthlyEngagementRate = totalStudents > 0
    ? Math.round((activeStudents / totalStudents) * 100)
    : 0;

  // --- Completion Rate ---
  const totalEnrollments = await Enrollment.countDocuments();
  const completedEnrollments = await Enrollment.countDocuments({ status: ENROLLMENT_STATUS.COMPLETED });
  const completionRate = totalEnrollments > 0
    ? Math.round((completedEnrollments / totalEnrollments) * 100)
    : 0;

  // --- Average XP ---
  const xpAgg = await User.aggregate([
    { $match: { role: USER_ROLES.STUDENT } },
    { $group: { _id: null, avgXP: { $avg: '$totalXP' } } },
  ]);
  const averageXP = xpAgg.length > 0 ? Math.round(xpAgg[0].avgXP) : 0;

  // --- Average Score ---
  const scoreAgg = await Submission.aggregate([
    { $match: { status: 'APPROVED', score: { $ne: null } } },
    { $group: { _id: null, avgScore: { $avg: '$score' } } },
  ]);
  const averageScore = scoreAgg.length > 0 ? Math.round(scoreAgg[0].avgScore) : 0;

  // --- Top Students ---
  const topStudents = await User.find({ role: USER_ROLES.STUDENT })
    .sort({ totalXP: -1 })
    .limit(10)
    .select('name email totalXP currentLevel currentStreak teamId')
    .lean();

  // --- Bottom Engagement Students ---
  // Students with least XP who are enrolled in something
  const bottomStudents = await User.find({ role: USER_ROLES.STUDENT })
    .sort({ totalXP: 1 })
    .limit(10)
    .select('name email totalXP currentLevel currentStreak teamId')
    .lean();

  // --- Overdue Activities ---
  const overdueEnrollments = await Enrollment.find({
    status: { $in: [ENROLLMENT_STATUS.ENROLLED, ENROLLMENT_STATUS.IN_PROGRESS] },
  })
    .populate('activityId', 'title type dueDate')
    .populate('studentId', 'name email')
    .lean();

  const overdueActivities = overdueEnrollments.filter(e => {
    return e.activityId && e.activityId.dueDate && new Date(e.activityId.dueDate) < now;
  }).map(e => ({
    student: e.studentId ? { id: e.studentId._id, name: e.studentId.name, email: e.studentId.email } : null,
    activity: e.activityId ? { id: e.activityId._id, title: e.activityId.title, type: e.activityId.type, dueDate: e.activityId.dueDate } : null,
    enrollmentStatus: e.status,
  }));

  // --- Team Performance ---
  const teamPerformance = await Team.find()
    .sort({ totalXP: -1 })
    .select('name totalXP memberIds')
    .lean();

  const teamPerformanceFormatted = teamPerformance.map(t => ({
    id: t._id,
    name: t.name,
    totalXP: t.totalXP,
    memberCount: t.memberIds ? t.memberIds.length : 0,
  }));

  // --- Course Performance ---
  const coursePerformance = await getActivityTypePerformance('COURSE');

  // --- Assignment Performance ---
  const assignmentPerformance = await getActivityTypePerformance('ASSIGNMENT');

  // --- Mentoring Participation ---
  const mentoringParticipation = await getActivityTypePerformance('MENTORING');

  // --- Certificate Completion ---
  const totalCerts = await Certificate.countDocuments();
  const validatedCerts = await Certificate.countDocuments({ status: 'VALIDATED' });
  const certificateCompletion = {
    total: totalCerts,
    validated: validatedCerts,
    completionRate: totalCerts > 0 ? Math.round((validatedCerts / totalCerts) * 100) : 0,
  };

  return {
    students: {
      total: totalStudents,
      totalEnrolled: totalEnrolledStudents,
      active: activeStudents,
      inactive: inactiveStudents,
    },
    engagement: {
      monthlyEngagementRate,
      completionRate,
      averageXP,
      averageScore,
    },
    topStudents,
    bottomEngagementStudents: bottomStudents,
    overdueActivities,
    teamPerformance: teamPerformanceFormatted,
    coursePerformance,
    assignmentPerformance,
    mentoringParticipation,
    certificateCompletion,
  };
}

/**
 * Helper: Get performance metrics for a given activity type
 */
async function getActivityTypePerformance(activityType) {
  const activities = await Activity.find({ type: activityType }).select('_id title').lean();
  const activityIds = activities.map(a => a._id);

  const totalEnrollments = await Enrollment.countDocuments({ activityId: { $in: activityIds } });
  const completedEnrollments = await Enrollment.countDocuments({
    activityId: { $in: activityIds },
    status: ENROLLMENT_STATUS.COMPLETED,
  });

  const scoreAgg = await Submission.aggregate([
    { $match: { activityId: { $in: activityIds }, status: 'APPROVED', score: { $ne: null } } },
    { $group: { _id: null, avgScore: { $avg: '$score' } } },
  ]);

  return {
    type: activityType,
    totalActivities: activities.length,
    totalEnrollments,
    completedEnrollments,
    completionRate: totalEnrollments > 0 ? Math.round((completedEnrollments / totalEnrollments) * 100) : 0,
    averageScore: scoreAgg.length > 0 ? Math.round(scoreAgg[0].avgScore) : 0,
  };
}

// ============================================================
// TEAM ANALYTICS
// ============================================================

async function getTeamAnalytics(teamId) {
  const objectId = new mongoose.Types.ObjectId(teamId);
  const team = await Team.findById(objectId).populate('memberIds', 'name email totalXP currentLevel currentStreak').lean();

  if (!team) throw new Error('Team not found');

  const memberIds = team.memberIds.map(m => m._id);

  // Team-wide enrollment stats
  const totalEnrollments = await Enrollment.countDocuments({ studentId: { $in: memberIds } });
  const completedEnrollments = await Enrollment.countDocuments({
    studentId: { $in: memberIds },
    status: ENROLLMENT_STATUS.COMPLETED,
  });

  // Team score average
  const scoreAgg = await Submission.aggregate([
    { $match: { studentId: { $in: memberIds }, status: 'APPROVED', score: { $ne: null } } },
    { $group: { _id: null, avgScore: { $avg: '$score' } } },
  ]);

  // Member contributions
  const memberContributions = [];
  for (const member of team.memberIds) {
    const xpCount = await XPTransaction.aggregate([
      { $match: { studentId: member._id } },
      { $group: { _id: null, total: { $sum: '$xp' } } },
    ]);
    memberContributions.push({
      id: member._id,
      name: member.name,
      email: member.email,
      totalXP: member.totalXP,
      currentLevel: member.currentLevel,
      currentStreak: member.currentStreak,
      xpFromTransactions: xpCount.length > 0 ? xpCount[0].total : 0,
    });
  }

  // Team rank
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
    completionRate: totalEnrollments > 0 ? Math.round((completedEnrollments / totalEnrollments) * 100) : 0,
    averageScore: scoreAgg.length > 0 ? Math.round(scoreAgg[0].avgScore) : 0,
    totalEnrollments,
    completedEnrollments,
    memberContributions,
  };
}

// ============================================================
// ACTIVITY ANALYTICS
// ============================================================

async function getActivityAnalytics(activityId) {
  const objectId = new mongoose.Types.ObjectId(activityId);
  const activity = await Activity.findById(objectId).lean();

  if (!activity) throw new Error('Activity not found');

  const enrollments = await Enrollment.find({ activityId: objectId })
    .populate('studentId', 'name email')
    .lean();

  const submissions = await Submission.find({ activityId: objectId }).lean();

  const totalEnrolled = enrollments.length;
  const completed = enrollments.filter(e => e.status === ENROLLMENT_STATUS.COMPLETED).length;
  const inProgress = enrollments.filter(e =>
    [ENROLLMENT_STATUS.ENROLLED, ENROLLMENT_STATUS.IN_PROGRESS].includes(e.status)
  ).length;
  const submitted = enrollments.filter(e =>
    [ENROLLMENT_STATUS.SUBMITTED, ENROLLMENT_STATUS.UNDER_REVIEW].includes(e.status)
  ).length;

  const now = new Date();
  const isOverdue = activity.dueDate && new Date(activity.dueDate) < now;
  const overdueStudents = isOverdue
    ? enrollments.filter(e => e.status !== ENROLLMENT_STATUS.COMPLETED).map(e => ({
        id: e.studentId ? e.studentId._id : null,
        name: e.studentId ? e.studentId.name : 'Unknown',
        email: e.studentId ? e.studentId.email : '',
        status: e.status,
      }))
    : [];

  const approvedSubs = submissions.filter(s => s.status === 'APPROVED' && s.score !== null);
  const avgScore = approvedSubs.length > 0
    ? Math.round(approvedSubs.reduce((sum, s) => sum + s.score, 0) / approvedSubs.length)
    : 0;

  const totalXPAwarded = submissions.reduce((sum, s) => sum + (s.xpAwarded || 0), 0);

  return {
    activity: {
      id: activity._id,
      title: activity.title,
      type: activity.type,
      category: activity.category,
      isMandatory: activity.isMandatory,
      isTeamBased: activity.isTeamBased,
      maxXP: activity.maxXP,
      dueDate: activity.dueDate,
      status: activity.status,
    },
    enrollment: {
      total: totalEnrolled,
      completed,
      inProgress,
      submitted,
      completionRate: totalEnrolled > 0 ? Math.round((completed / totalEnrolled) * 100) : 0,
    },
    scoring: {
      averageScore: avgScore,
      totalXPAwarded,
    },
    isOverdue,
    overdueStudents,
  };
}

// ============================================================
// PARTICIPATION ANALYTICS (Management KPIs)
// ============================================================

async function getParticipationAnalytics() {
  const now = new Date();
  const { start: monthStart, end: monthEnd } = getCurrentMonthRange();

  // Get previous month for comparison
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1);

  const totalStudents = await User.countDocuments({ role: USER_ROLES.STUDENT });

  // Current month active students
  const currentActiveIds = await XPTransaction.distinct('studentId', {
    createdAt: { $gte: monthStart, $lt: monthEnd },
  });
  const currentActive = currentActiveIds.length;

  // Previous month active students
  const prevActiveIds = await XPTransaction.distinct('studentId', {
    createdAt: { $gte: prevMonth, $lt: prevMonthEnd },
  });
  const prevActive = prevActiveIds.length;

  // Participation change
  const participationChange = prevActive > 0
    ? Math.round(((currentActive - prevActive) / prevActive) * 100)
    : 0;

  // Completion rates — current vs previous month
  const currentCompletions = await Enrollment.countDocuments({
    status: ENROLLMENT_STATUS.COMPLETED,
    completedAt: { $gte: monthStart, $lt: monthEnd },
  });
  const prevCompletions = await Enrollment.countDocuments({
    status: ENROLLMENT_STATUS.COMPLETED,
    completedAt: { $gte: prevMonth, $lt: prevMonthEnd },
  });
  const completionChange = prevCompletions > 0
    ? Math.round(((currentCompletions - prevCompletions) / prevCompletions) * 100)
    : 0;

  // Overall completion rate
  const totalEnrollments = await Enrollment.countDocuments();
  const totalCompleted = await Enrollment.countDocuments({ status: ENROLLMENT_STATUS.COMPLETED });
  const overallCompletionRate = totalEnrollments > 0
    ? Math.round((totalCompleted / totalEnrollments) * 100)
    : 0;

  // Engagement rate
  const monthlyEngagementRate = totalStudents > 0
    ? Math.round((currentActive / totalStudents) * 100)
    : 0;

  // Targets
  const targets = {
    activeParticipationIncrease: 25,  // 25% increase target
    completionImprovement: 20,         // 20% improvement target
    monthlyEngagement: 80,             // 80% monthly engagement target
  };

  return {
    totalStudents,
    activeStudents: currentActive,
    inactiveStudents: totalStudents - currentActive,
    monthlyEngagementRate,
    overallCompletionRate,
    currentMonthCompletions: currentCompletions,
    previousMonthCompletions: prevCompletions,
    participationChange: `${participationChange >= 0 ? '+' : ''}${participationChange}%`,
    completionChange: `${completionChange >= 0 ? '+' : ''}${completionChange}%`,
    targets,
    vsTargets: {
      engagementVsTarget: `${monthlyEngagementRate >= targets.monthlyEngagement ? '+' : ''}${monthlyEngagementRate - targets.monthlyEngagement}%`,
      participationVsTarget: `${participationChange >= targets.activeParticipationIncrease ? 'MET' : 'NOT_MET'} (${participationChange}% vs ${targets.activeParticipationIncrease}%)`,
      completionVsTarget: `${completionChange >= targets.completionImprovement ? 'MET' : 'NOT_MET'} (${completionChange}% vs ${targets.completionImprovement}%)`,
    },
    monthlyTrend: {
      previousMonthActive: prevActive,
      currentMonthActive: currentActive,
    },
  };
}

module.exports = {
  // Student
  getStudentDashboard,
  getStudentGraphs,
  getStudentMonthlyXPGraph,
  getStudentYearlyXPGraph,
  getStudentActivityCompletionGraph,
  getStudentScoresGraph,
  getStudentContributionGraph,
  getStudentStreakGraph,
  getStudentCategoryPerformanceGraph,
  // Admin
  getAdminDashboard,
  // Team
  getTeamAnalytics,
  // Activity
  getActivityAnalytics,
  // Participation
  getParticipationAnalytics,
};
