const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quiz.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');

router.get('/:id', protect, quizController.getQuiz);
router.post('/', protect, adminOnly, quizController.createQuiz);
router.post('/:id/submit', protect, quizController.submitQuiz);

module.exports = router;
