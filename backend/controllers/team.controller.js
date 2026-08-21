const Team = require('../models/Team');
const User = require('../models/User');
const lbService = require('../services/leaderboardService');
const { success, error } = require('../utils/response');

const getMyTeam = async (req, res) => {
  try {
    const studentId = req.user?.id || req.user?._id;
    const user = await User.findById(studentId);
    if (!user || !user.teamId) {
      return success(res, null, 'User does not belong to a team');
    }

    const team = await Team.findById(user.teamId).populate('memberIds', 'name email totalXP currentLevel currentStreak');
    if (!team) return error(res, 'Team not found', 'NOT_FOUND', 404);

    return success(res, team);
  } catch (err) {
    return error(res, err.message, 'SERVER_ERROR', 500);
  }
};

const getTeamLeaderboard = async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const teams = await Team.find().sort({ totalXP: -1 }).limit(parseInt(limit, 10)).lean();

    const ranked = teams.map((t, idx) => ({
      rank: idx + 1,
      id: t._id,
      name: t.name,
      totalXP: t.totalXP,
      memberCount: t.memberIds ? t.memberIds.length : 0,
    }));

    return success(res, ranked);
  } catch (err) {
    return error(res, err.message, 'SERVER_ERROR', 500);
  }
};

const createTeam = async (req, res) => {
  try {
    const { name, description = '' } = req.body;
    const userId = req.user?.id || req.user?._id;

    if (!name) return error(res, 'Team name is required', 'VALIDATION_ERROR', 400);

    const team = await Team.create({
      name,
      description,
      createdBy: userId,
      memberIds: [userId],
      totalXP: 0,
    });

    await User.findByIdAndUpdate(userId, { teamId: team._id });
    return success(res, team, 'Team created successfully', 201);
  } catch (err) {
    return error(res, err.message, 'SERVER_ERROR', 500);
  }
};

const addMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { memberId } = req.body;

    if (!memberId) return error(res, 'memberId is required', 'VALIDATION_ERROR', 400);

    const team = await Team.findByIdAndUpdate(
      id,
      { $addToSet: { memberIds: memberId } },
      { new: true }
    );
    await User.findByIdAndUpdate(memberId, { teamId: id });
    return success(res, team, 'Member added to team');
  } catch (err) {
    return error(res, err.message, 'SERVER_ERROR', 500);
  }
};

const removeMember = async (req, res) => {
  try {
    const { id, memberId } = req.params;
    const team = await Team.findByIdAndUpdate(
      id,
      { $pull: { memberIds: memberId } },
      { new: true }
    );
    await User.findByIdAndUpdate(memberId, { teamId: null });
    return success(res, team, 'Member removed from team');
  } catch (err) {
    return error(res, err.message, 'SERVER_ERROR', 500);
  }
};

module.exports = { getMyTeam, getTeamLeaderboard, createTeam, addMember, removeMember };
