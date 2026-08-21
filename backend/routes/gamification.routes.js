const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/gamification.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/levels',                  protect, ctrl.getLevels);
router.get('/milestones',              protect, ctrl.getMilestones);
router.get('/achievements',            protect, ctrl.getAchievements);
router.get('/team-leaderboard',        protect, ctrl.getTeamLeaderboard);
router.get('/streak/:studentId',       protect, ctrl.getStreak);
router.get('/student/:studentId',      protect, ctrl.getStudentProfile);
router.get('/transactions/:studentId', protect, ctrl.getTransactions);

// Admin review + manual award live under /api/admin/* (two-step human-in-the-loop flow).

module.exports = router;
