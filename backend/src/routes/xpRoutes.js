const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authMiddleware');
const User = require('../models/User');
const StudentAchievement = require('../models/StudentAchievement');
const Achievement = require('../models/Achievement');

// GET /api/xp/stats — get current user XP, level, streak
router.get('/stats', authenticate, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) return res.fail('User not found', 'NOT_FOUND', 404);
    
    // Calculate simple next level XP (Level 1->2 is 100XP, 2->3 is 200XP etc.)
    const nextLevelXp = user.currentLevel * 100;
    
    res.success({
      xp: user.totalXP,
      level: user.currentLevel,
      streak: user.currentStreak,
      nextLevelXp,
      teamRank: 1, // Mocked for now
      xpThisWeek: user.totalXP, // Simplified
      activitiesCompletedThisWeek: 0,
    }, 'Stats fetched');
  } catch (err) { next(err); }
});

// GET /api/xp/achievements — get user achievements
router.get('/achievements', authenticate, async (req, res, next) => {
  try {
    const studentAchievements = await StudentAchievement.find({ studentId: req.user.id })
      .populate('achievementId')
      .sort({ unlockedAt: -1 })
      .lean();
    
    const formatted = studentAchievements.map(sa => ({
      ...sa.achievementId,
      unlockedAt: sa.unlockedAt,
      progress: sa.progress,
      isLocked: sa.progress < 100
    }));

    res.success(formatted, 'Achievements fetched');
  } catch (err) { next(err); }
});

// GET /api/xp/leaderboard — get top students
router.get('/leaderboard', authenticate, async (req, res, next) => {
  try {
    const topUsers = await User.find({ role: 'student' })
      .select('name totalXP currentLevel currentStreak')
      .sort({ totalXP: -1 })
      .limit(50)
      .lean();
      
    // Add rank mapping
    const ranked = topUsers.map((u, i) => ({
      ...u,
      rank: i + 1,
      id: u._id
    }));
    
    res.success(ranked, 'Leaderboard fetched');
  } catch (err) { next(err); }
});

module.exports = router;
