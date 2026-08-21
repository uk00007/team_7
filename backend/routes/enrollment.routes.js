const express = require('express');
const router = express.Router();
const enrollmentController = require('../controllers/enrollment.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/', protect, enrollmentController.enroll);
router.get('/', protect, enrollmentController.getMyEnrollments);
router.put('/:id', protect, enrollmentController.updateProgress);

module.exports = router;
