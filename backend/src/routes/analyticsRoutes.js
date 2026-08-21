// Analytics Routes
// Parth — Analytics & Reporting Module

const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

// ---- Student Analytics ----
// Full dashboard (all metrics in one call)
router.get('/student/:studentId', analyticsController.getStudentDashboard);

// All graphs combined
router.get('/student/:studentId/graphs', analyticsController.getStudentGraphs);

// Individual graph endpoints
router.get('/student/:studentId/graphs/monthly-xp', analyticsController.getStudentMonthlyXPGraph);
router.get('/student/:studentId/graphs/yearly-xp', analyticsController.getStudentYearlyXPGraph);
router.get('/student/:studentId/graphs/activity-completion', analyticsController.getStudentActivityCompletionGraph);
router.get('/student/:studentId/graphs/scores', analyticsController.getStudentScoresGraph);
router.get('/student/:studentId/graphs/contribution', analyticsController.getStudentContributionGraph);
router.get('/student/:studentId/graphs/streak', analyticsController.getStudentStreakGraph);
router.get('/student/:studentId/graphs/category-performance', analyticsController.getStudentCategoryPerformanceGraph);

// ---- Admin Analytics ----
router.get('/admin', analyticsController.getAdminDashboard);
router.get('/overview', analyticsController.getAdminDashboard);
router.get('/students', analyticsController.getAdminDashboard);

// ---- Team Analytics ----
router.get('/team/:teamId', analyticsController.getTeamAnalytics);

// ---- Activity Analytics ----
router.get('/activity/:activityId', analyticsController.getActivityAnalytics);

// ---- Participation KPIs (Management Targets) ----
router.get('/participation', analyticsController.getParticipationAnalytics);

module.exports = router;
