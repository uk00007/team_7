const Joi              = require('joi');
const xpService        = require('../services/xpService');
const levelService     = require('../services/levelService');
const streakService    = require('../services/streakService');
const achievementSvc   = require('../services/achievementService');
const milestoneSvc     = require('../services/milestoneService');
const lbService        = require('../services/leaderboardService');
const { success, error } = require('../utils/response');
const User             = require('../models/User');
const XPTransaction    = require('../models/XPTransaction');
const mongoose         = require('mongoose');

// ── GET /api/gamification/levels ─────────────────────────────────────────────
const getLevels = async (req, res) => {
  try {
    const levels = levelService.getAllLevels();
    return success(res, { levels }, 'Level definitions retrieved');
  } catch (err) {
    return error(res, err.message, 'FETCH_FAILED', 500);
  }
};

// ── GET /api/gamification/milestones ─────────────────────────────────────────
const getMilestones = async (req, res) => {
  try {
    const { studentId } = req.query;
    if (studentId) {
      const milestones = await milestoneSvc.getStudentMilestones(studentId);
      return success(res, { milestones }, 'Student milestones retrieved');
    }
    const Milestone = require('../models/Milestone');
    const milestones = await Milestone.find({ isActive: true }).sort({ order: 1 });
    return success(res, { milestones }, 'Milestones retrieved');
  } catch (err) {
    return error(res, err.message, 'FETCH_FAILED', 500);
  }
};

// ── GET /api/gamification/streak/:studentId ───────────────────────────────────
const getStreak = async (req, res) => {
  try {
    const { studentId } = req.params;
    const streakInfo = await streakService.getStreakInfo(studentId);
    return success(res, streakInfo, 'Streak info retrieved');
  } catch (err) {
    return error(res, err.message, 'FETCH_FAILED', err.message.includes('not found') ? 404 : 500);
  }
};

// ── GET /api/gamification/achievements ───────────────────────────────────────
const getAchievements = async (req, res) => {
  try {
    const { studentId } = req.query;
    if (studentId) {
      const achievements = await achievementSvc.getStudentAchievements(studentId);
      return success(res, { achievements }, 'Student achievements retrieved');
    }
    const Achievement = require('../models/Achievement');
    const achievements = await Achievement.find({ isActive: true }).sort({ type: 1 });
    return success(res, { achievements }, 'Achievement definitions retrieved');
  } catch (err) {
    return error(res, err.message, 'FETCH_FAILED', 500);
  }
};

// ── GET /api/gamification/student/:studentId ─────────────────────────────────
const getStudentProfile = async (req, res) => {
  try {
    const { studentId } = req.params;

    const [xpSummary, streakInfo, achievements, milestones, rank, teamRank] = await Promise.all([
      xpService.getStudentXPSummary(studentId),
      streakService.getStreakInfo(studentId),
      achievementSvc.getStudentAchievements(studentId),
      milestoneSvc.getStudentMilestones(studentId),
      lbService.getStudentRank(studentId, 'alltime'),
      null, // team rank — computed separately if needed
    ]);

    // Monthly XP for chart (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyChart = await XPTransaction.aggregate([
      {
        $match: {
          studentId: new mongoose.Types.ObjectId(studentId),
          createdAt: { $gte: sixMonthsAgo },
          xp:        { $gt: 0 },
        },
      },
      {
        $group: {
          _id:   { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          total: { $sum: '$xp' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    return success(res, {
      ...xpSummary,
      rank,
      streakInfo,
      achievements: {
        total:    achievements.length,
        unlocked: achievements.filter((a) => a.isUnlocked).length,
        list:     achievements,
      },
      milestones: {
        total:     milestones.length,
        completed: milestones.filter((m) => m.isCompleted).length,
        list:      milestones,
      },
      monthlyXPChart: monthlyChart,
    }, 'Student gamification profile retrieved');
  } catch (err) {
    console.error('[Student Profile]', err);
    return error(res, err.message, 'FETCH_FAILED', err.message.includes('not found') ? 404 : 500);
  }
};

// ── GET /api/gamification/team-leaderboard ────────────────────────────────────
const getTeamLeaderboard = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const data  = await lbService.getTeamLeaderboard(limit);
    return success(res, { leaderboard: data, count: data.length }, 'Team leaderboard retrieved');
  } catch (err) {
    return error(res, err.message, 'FETCH_FAILED', 500);
  }
};

// ── GET /api/gamification/transactions/:studentId ─────────────────────────────
const getTransactions = async (req, res) => {
  try {
    const { studentId } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const page  = Math.max(parseInt(req.query.page) || 1, 1);

    const transactions = await XPTransaction.find({ studentId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('activityId', 'title type')
      .populate('awardedBy', 'name');

    const total = await XPTransaction.countDocuments({ studentId });

    return success(res, { transactions, total, page, limit }, 'XP transactions retrieved');
  } catch (err) {
    return error(res, err.message, 'FETCH_FAILED', 500);
  }
};

module.exports = {
  getLevels,
  getMilestones,
  getStreak,
  getAchievements,
  getStudentProfile,
  getTeamLeaderboard,
  getTransactions,
};
