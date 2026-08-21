const express = require('express');
const router = express.Router();
const submissionController = require('../controllers/submission.controller');
const reviewController = require('../controllers/review.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');

router.post('/', protect, submissionController.submit);
router.get('/my', protect, submissionController.getMySubmissions);
router.get('/pending', protect, adminOnly, submissionController.getPending);
router.get('/activity/:activityId', protect, submissionController.getByActivity);
router.put('/:id/review', protect, adminOnly, reviewController.reviewSubmission);

module.exports = router;
