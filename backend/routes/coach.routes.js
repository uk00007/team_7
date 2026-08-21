const express = require('express');
const router = express.Router();
const coachController = require('../controllers/coach.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/recommendation', protect, coachController.getRecommendations);

module.exports = router;
