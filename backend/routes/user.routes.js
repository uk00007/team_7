const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth.middleware');
const { success, error } = require('../utils/response');

// GET /api/users/students -- admin: list all students
router.get('/students', protect, adminOnly, async (req, res) => {
  try {
    const students = await User.find({ role: 'student' })
      .select('name email currentLevel totalXP currentStreak lastActivityDate')
      .sort({ name: 1 })
      .lean();

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const formatted = students.map(s => ({
      id:         s._id,
      name:       s.name,
      email:      s.email,
      level:      s.currentLevel,
      xp:         s.totalXP,
      streak:     s.currentStreak,
      lastActive: s.lastActivityDate,
      status:     s.lastActivityDate && new Date(s.lastActivityDate) > sevenDaysAgo
        ? 'Active'
        : 'Inactive',
    }));

    return success(res, formatted, 'Students fetched');
  } catch (err) {
    return error(res, err.message, 'SERVER_ERROR', 500);
  }
});

module.exports = router;
