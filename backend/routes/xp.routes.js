const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/xp.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');

router.post('/award',              protect, adminOnly, controller.awardXP);
router.get('/stats',               protect, controller.getStats);
router.get('/achievements',        protect, controller.getMyAchievements);
router.get('/student/:studentId',  protect, controller.getStudentXP);
router.get('/leaderboard',         protect, controller.getAllTimeLeaderboard);
router.get('/leaderboard/monthly', protect, controller.getMonthlyLeaderboard);
router.get('/leaderboard/yearly',  protect, controller.getYearlyLeaderboard);
router.get('/team/:teamId',        protect, controller.getTeamXP);

module.exports = router;

