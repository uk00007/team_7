
const User           = require('../models/User');
const Team           = require('../models/Team');
const XPTransaction  = require('../models/XPTransaction');
const levelService   = require('./levelService');

/**
 * Build a date range for a given period.
 */
const getPeriodRange = (period) => {
  const now = new Date();
  if (period === 'monthly') {
    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end:   new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
    };
  }
  if (period === 'yearly') {
    return {
      start: new Date(now.getFullYear(), 0, 1),
      end:   new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999),
    };
  }
  return null; // all-time
};

/**
 * Individual all-time leaderboard (sorted by User.totalXP).
 */
const getAllTimeLeaderboard = async (limit = 50) => {
  const students = await User.find({ role: 'student' })
    .sort({ totalXP: -1 })
    .limit(limit)
    .select('name email totalXP currentLevel teamId');

  return students.map((s, index) => ({
    rank:         index + 1,
    studentId:    s._id,
    name:         s.name,
    email:        s.email,
    totalXP:      s.totalXP,
    level:        levelService.getLevelForXP(s.totalXP),
    teamId:       s.teamId,
  }));
};

/**
 * Individual leaderboard for a specific period (monthly or yearly).
 * Aggregates XP from XPTransaction records within the period.
 */
const getPeriodLeaderboard = async (period, limit = 50) => {
  const range = getPeriodRange(period);
  if (!range) return getAllTimeLeaderboard(limit);

  const pipeline = [
    {
      $match: {
        createdAt: { $gte: range.start, $lte: range.end },
        xp: { $gt: 0 }, // exclude penalties from ranking
      },
    },
    {
      $group: {
        _id:      '$studentId',
        totalXP:  { $sum: '$xp' },
        txCount:  { $sum: 1 },
      },
    },
    { $sort: { totalXP: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from:         'users',
        localField:   '_id',
        foreignField: '_id',
        as:           'user',
      },
    },
    { $unwind: '$user' },
    { $match: { 'user.role': 'student' } },
  ];

  const results = await XPTransaction.aggregate(pipeline);

  return results.map((r, index) => ({
    rank:      index + 1,
    studentId: r._id,
    name:      r.user.name,
    email:     r.user.email,
    xp:        r.totalXP,
    txCount:   r.txCount,
    level:     levelService.getLevelForXP(r.user.totalXP), // all-time level
    teamId:    r.user.teamId,
    period,
    from:      range.start,
    to:        range.end,
  }));
};

/**
 * Team leaderboard (all-time, sorted by Team.totalXP).
 */
const getTeamLeaderboard = async (limit = 20) => {
  const teams = await Team.find()
    .sort({ totalXP: -1 })
    .limit(limit)
    .populate('memberIds', 'name email totalXP currentLevel');

  return teams.map((t, index) => ({
    rank:        index + 1,
    teamId:      t._id,
    name:        t.name,
    totalXP:     t.totalXP,
    memberCount: t.memberIds.length,
    members:     t.memberIds.map((m) => ({
      studentId:    m._id,
      name:         m.name,
      totalXP:      m.totalXP,
      currentLevel: m.currentLevel,
    })),
  }));
};

/**
 * Team period leaderboard (monthly or yearly) based on XPTransaction records.
 */
const getTeamPeriodLeaderboard = async (period, limit = 20) => {
  const range = getPeriodRange(period);
  if (!range) return getTeamLeaderboard(limit);

  const pipeline = [
    {
      $match: {
        createdAt: { $gte: range.start, $lte: range.end },
        teamId: { $ne: null },
        xp: { $gt: 0 },
      },
    },
    {
      $group: {
        _id: '$teamId',
        periodXP: { $sum: '$xp' },
        txCount: { $sum: 1 },
      },
    },
    { $sort: { periodXP: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'teams',
        localField: '_id',
        foreignField: '_id',
        as: 'team',
      },
    },
    { $unwind: '$team' },
  ];

  const results = await XPTransaction.aggregate(pipeline);

  return results.map((r, index) => ({
    rank: index + 1,
    teamId: r._id,
    name: r.team.name,
    xp: r.periodXP,
    totalXP: r.team.totalXP,
    period,
  }));
};

/**
 * Get the rank of a specific student in a given leaderboard.
 * @param {string} studentId
 * @param {'alltime'|'monthly'|'yearly'} period
 * @returns {number} rank (1-based)
 */
const getStudentRank = async (studentId, period = 'alltime') => {
  if (period === 'alltime') {
    const user = await User.findById(studentId).select('totalXP');
    if (!user) return null;
    const higherCount = await User.countDocuments({ role: 'student', totalXP: { $gt: user.totalXP } });
    return higherCount + 1;
  }

  const range = getPeriodRange(period);
  const pipeline = [
    { $match: { createdAt: { $gte: range.start, $lte: range.end }, xp: { $gt: 0 } } },
    { $group: { _id: '$studentId', totalXP: { $sum: '$xp' } } },
    { $sort: { totalXP: -1 } },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
    { $unwind: '$user' },
    { $match: { 'user.role': 'student' } },
  ];

  const results = await XPTransaction.aggregate(pipeline);
  const idx = results.findIndex((r) => r._id.toString() === studentId.toString());
  return idx === -1 ? null : idx + 1;
};

module.exports = {
  getAllTimeLeaderboard,
  getPeriodLeaderboard,
  getTeamLeaderboard,
  getTeamPeriodLeaderboard,
  getStudentRank,
  getPeriodRange,
};

