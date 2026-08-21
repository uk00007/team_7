// Report Routes
// Parth — Analytics & Reporting Module

const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

// Individual student report (with filters)
router.get('/student/:studentId', reportController.getStudentReport);

// Team report (with filters)
router.get('/team/:teamId', reportController.getTeamReport);

// Leaderboard report
router.get('/leaderboard', reportController.getLeaderboardReport);

// General report (with all filters via query params)
router.get('/', reportController.getReport);

module.exports = router;
