const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authMiddleware');
const Enrollment = require('../models/Enrollment');

// POST /api/enrollments — student enroll
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { activityId } = req.body;
    if (!activityId) return res.fail('Activity ID required', 'VALIDATION_ERROR', 400);

    let enrollment = await Enrollment.findOne({ studentId: req.user.id, activityId });
    if (!enrollment) {
      enrollment = await Enrollment.create({ studentId: req.user.id, activityId, status: 'ENROLLED' });
    }
    res.success(enrollment, 'Enrolled successfully', 201);
  } catch (err) { next(err); }
});

module.exports = router;
