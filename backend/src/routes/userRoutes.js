const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');
const User = require('../models/User');

// GET /api/users/students — list all students for admin directory
router.get('/students', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const students = await User.find({ role: 'student' })
      .select('name email currentLevel totalXP currentStreak lastActivityDate')
      .sort({ name: 1 })
      .lean();
    
    // Add calculated status (active if active in last 7 days)
    const now = new Date();
    const sevenDaysAgo = new Date(now.setDate(now.getDate() - 7));
    
    const formatted = students.map(s => ({
      id: s._id,
      name: s.name,
      email: s.email,
      level: s.currentLevel,
      xp: s.totalXP,
      streak: s.currentStreak,
      lastActive: s.lastActivityDate,
      status: s.lastActivityDate && new Date(s.lastActivityDate) > sevenDaysAgo ? 'Active' : 'Inactive'
    }));
    
    res.success(formatted, 'Students fetched');
  } catch (err) { next(err); }
});

module.exports = router;
