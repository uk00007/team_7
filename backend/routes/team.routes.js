const express = require('express');
const router = express.Router();
const teamController = require('../controllers/team.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/my-team', protect, teamController.getMyTeam);
router.get('/leaderboard', protect, teamController.getTeamLeaderboard);
router.post('/', protect, teamController.createTeam);
router.post('/:id/members', protect, teamController.addMember);
router.delete('/:id/members/:memberId', protect, teamController.removeMember);

module.exports = router;
