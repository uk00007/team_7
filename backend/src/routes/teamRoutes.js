const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authMiddleware');
const Team = require('../models/Team');

// GET /api/teams/my-team
router.get('/my-team', authenticate, async (req, res, next) => {
  try {
    const team = await Team.findOne({ memberIds: req.user.id })
      .populate('memberIds', 'name currentLevel totalXP')
      .lean();
    
    // It's okay if team is null (user is not in a team)
    res.success(team, 'Team fetched');
  } catch (err) { next(err); }
});

// GET /api/teams/leaderboard
router.get('/leaderboard', authenticate, async (req, res, next) => {
  try {
    const topTeams = await Team.find()
      .populate('memberIds', 'name')
      .sort({ totalXP: -1 })
      .limit(20)
      .lean();
      
    const ranked = topTeams.map((t, i) => ({
      ...t,
      rank: i + 1,
      id: t._id
    }));
    
    res.success(ranked, 'Team leaderboard fetched');
  } catch (err) { next(err); }
});

module.exports = router;
