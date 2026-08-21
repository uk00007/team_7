const Joi         = require('joi');
const xpService   = require('../services/xpService');
const lbService   = require('../services/leaderboardService');
const { success, error } = require('../utils/response');

// ── POST /api/xp/award ────────────────────────────────────────────────────────
const awardXP = async (req, res) => {
  try {
    const schema = Joi.object({
      studentId:    Joi.string().required(),
      xp:           Joi.number().not(0).required(),
      reason:       Joi.string().required(),
      type:         Joi.string().valid('ACTIVITY', 'BONUS', 'STREAK', 'TEAM', 'MANUAL', 'PENALTY').required(),
      activityId:   Joi.string().optional(),
      submissionId: Joi.string().optional(),
      metadata:     Joi.object().optional(),
    });

    const { value, error: validationError } = schema.validate(req.body);
    if (validationError) return error(res, validationError.details[0].message, 'VALIDATION_ERROR', 400);

    const result = await xpService.awardXP({
      ...value,
      awardedBy:  req.user?.id || null,
      creditUser: true,
      creditTeam: value.type === 'TEAM',
    });

    return success(res, result, `${value.xp} XP awarded successfully`);
  } catch (err) {
    console.error('[XP Award]', err);
    return error(res, err.message, 'XP_AWARD_FAILED', 500);
  }
};

// ── GET /api/xp/student/:studentId ────────────────────────────────────────────
const getStudentXP = async (req, res) => {
  try {
    const { studentId } = req.params;
    const summary = await xpService.getStudentXPSummary(studentId);
    return success(res, summary, 'Student XP summary retrieved');
  } catch (err) {
    console.error('[Get Student XP]', err);
    return error(res, err.message, 'FETCH_FAILED', err.message.includes('not found') ? 404 : 500);
  }
};

// ── GET /api/xp/leaderboard ───────────────────────────────────────────────────
const getAllTimeLeaderboard = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const data  = await lbService.getAllTimeLeaderboard(limit);
    return success(res, { leaderboard: data, period: 'alltime', count: data.length }, 'All-time leaderboard retrieved');
  } catch (err) {
    console.error('[Leaderboard All-Time]', err);
    return error(res, err.message, 'FETCH_FAILED', 500);
  }
};

// ── GET /api/xp/leaderboard/monthly ───────────────────────────────────────────
const getMonthlyLeaderboard = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const data  = await lbService.getPeriodLeaderboard('monthly', limit);
    return success(res, { leaderboard: data, period: 'monthly', count: data.length }, 'Monthly leaderboard retrieved');
  } catch (err) {
    console.error('[Leaderboard Monthly]', err);
    return error(res, err.message, 'FETCH_FAILED', 500);
  }
};

// ── GET /api/xp/leaderboard/yearly ────────────────────────────────────────────
const getYearlyLeaderboard = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const data  = await lbService.getPeriodLeaderboard('yearly', limit);
    return success(res, { leaderboard: data, period: 'yearly', count: data.length }, 'Yearly leaderboard retrieved');
  } catch (err) {
    console.error('[Leaderboard Yearly]', err);
    return error(res, err.message, 'FETCH_FAILED', 500);
  }
};

// ── GET /api/xp/team/:teamId ──────────────────────────────────────────────────
const getTeamXP = async (req, res) => {
  try {
    const { teamId } = req.params;
    const summary = await xpService.getTeamXPSummary(teamId);
    return success(res, summary, 'Team XP summary retrieved');
  } catch (err) {
    console.error('[Get Team XP]', err);
    return error(res, err.message, 'FETCH_FAILED', err.message.includes('not found') ? 404 : 500);
  }
};

// ── GET /api/xp/stats ─────────────────────────────────────────────────────────
const getStats = async (req, res) => {
  try {
    const studentId = req.user?.id || req.user?._id;
    const User = require('../models/User');
    const user = await User.findById(studentId).lean();
    if (!user) return error(res, 'User not found', 'NOT_FOUND', 404);
    const nextLevelXp = user.currentLevel * 100;
    return success(res, {
      xp:                          user.totalXP,
      level:                       user.currentLevel,
      streak:                      user.currentStreak,
      nextLevelXp,
      teamRank:                    1,
      xpThisWeek:                  0,
      activitiesCompletedThisWeek: 0,
    }, 'Stats fetched');
  } catch (err) {
    return error(res, err.message, 'SERVER_ERROR', 500);
  }
};

// ── GET /api/xp/achievements ──────────────────────────────────────────────────
const getMyAchievements = async (req, res) => {
  try {
    const studentId = req.user?.id || req.user?._id;
    const StudentAchievement = require('../models/StudentAchievement');
    const achievements = await StudentAchievement.find({ studentId })
      .populate('achievementId')
      .sort({ unlockedAt: -1 })
      .lean();
    const formatted = achievements.map(sa => ({
      ...(sa.achievementId || {}),
      unlockedAt: sa.unlockedAt,
      progress:   sa.progress,
      isLocked:   (sa.progress || 0) < 100,
    }));
    return success(res, formatted, 'Achievements fetched');
  } catch (err) {
    return error(res, err.message, 'SERVER_ERROR', 500);
  }
};

module.exports = { awardXP, getStudentXP, getAllTimeLeaderboard, getMonthlyLeaderboard, getYearlyLeaderboard, getTeamXP, getStats, getMyAchievements };
