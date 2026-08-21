const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');
const Submission = require('../models/Submission');
const Enrollment = require('../models/Enrollment');
const Activity = require('../models/Activity');
const User = require('../models/User');
const XPTransaction = require('../models/XPTransaction');
const Notification = require('../models/Notification');

// POST /api/submissions — student submit
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { activityId, content, attachmentUrl } = req.body;
    if (!activityId) return res.fail('Activity ID required', 'VALIDATION_ERROR', 400);

    const submission = await Submission.create({
      activityId,
      studentId: req.user.id,
      content,
      attachmentUrl,
      status: 'PENDING'
    });

    await Enrollment.findOneAndUpdate(
      { studentId: req.user.id, activityId },
      { status: 'SUBMITTED', submittedAt: new Date() },
      { upsert: true }
    );

    res.success(submission, 'Submitted successfully', 201);
  } catch (err) { next(err); }
});

// GET /api/submissions/activity/:activityId — get student's submission for activity
router.get('/activity/:activityId', authenticate, async (req, res, next) => {
  try {
    const submission = await Submission.findOne({
      studentId: req.user.id,
      activityId: req.params.activityId
    }).sort({ createdAt: -1 }).lean();
    res.success(submission, 'Submission fetched');
  } catch (err) { next(err); }
});

// GET /api/submissions/pending — admin list
router.get('/pending', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const submissions = await Submission.find({ status: 'PENDING' })
      .populate('studentId', 'name email')
      .populate('activityId', 'title maxXP type')
      .sort({ createdAt: 1 })
      .lean();
    res.success(submissions, 'Pending submissions fetched');
  } catch (err) { next(err); }
});

// PUT /api/submissions/:id/review — admin review
router.put('/:id/review', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { status, score, feedback } = req.body; // status: APPROVED or REJECTED
    if (!status) return res.fail('Status required', 'VALIDATION_ERROR', 400);

    const submission = await Submission.findById(req.params.id)
      .populate('activityId')
      .populate('studentId');
    
    if (!submission) return res.fail('Submission not found', 'NOT_FOUND', 404);
    if (submission.status !== 'PENDING') return res.fail('Submission already reviewed', 'BAD_REQUEST', 400);

    const activity = submission.activityId;
    let xpAwarded = 0;

    if (status === 'APPROVED') {
      // Calculate XP based on score (if score exists), otherwise full maxXP
      xpAwarded = score !== undefined ? Math.floor(activity.maxXP * (score / 100)) : activity.maxXP;
      
      // 1. Create XP transaction
      await XPTransaction.create({
        studentId: submission.studentId._id,
        activityId: activity._id,
        submissionId: submission._id,
        xp: xpAwarded,
        reason: `Completed ${activity.title}`,
        type: 'ACTIVITY',
        awardedBy: req.user.id
      });

      // 2. Update User totalXP and recalculate level
      const user = await User.findById(submission.studentId._id);
      user.totalXP += xpAwarded;
      // Simple leveling formula: Level = Math.floor(totalXP / 100) + 1
      const newLevel = Math.floor(user.totalXP / 100) + 1;
      let levelUp = false;
      if (newLevel > user.currentLevel) {
        user.currentLevel = newLevel;
        levelUp = true;
      }
      
      // Basic streak update (just checking if today, increment otherwise keep)
      // Real streak logic requires timezone handling, simplified for demo
      const today = new Date().toDateString();
      if (!user.lastActivityDate || user.lastActivityDate.toDateString() !== today) {
        user.currentStreak += 1;
        if (user.currentStreak > user.longestStreak) user.longestStreak = user.currentStreak;
        user.lastActivityDate = new Date();
      }
      await user.save();

      // 3. Update Enrollment
      await Enrollment.findOneAndUpdate(
        { studentId: submission.studentId._id, activityId: activity._id },
        { status: 'COMPLETED', completedAt: new Date() }
      );

      // 4. Notifications
      await Notification.create({
        userId: user._id,
        type: 'SUBMISSION_REVIEWED',
        title: 'Submission Approved',
        message: `Your submission for "${activity.title}" was approved. You earned ${xpAwarded} XP!`,
        relatedActivityId: activity._id
      });

      if (levelUp) {
         await Notification.create({
          userId: user._id,
          type: 'LEVEL_UP',
          title: 'Level Up!',
          message: `Congratulations! You reached Level ${newLevel}!`,
        });
      }
    } else {
      await Enrollment.findOneAndUpdate(
        { studentId: submission.studentId._id, activityId: activity._id },
        { status: 'REJECTED' }
      );
      await Notification.create({
        userId: submission.studentId._id,
        type: 'SUBMISSION_REVIEWED',
        title: 'Submission Rejected',
        message: `Your submission for "${activity.title}" requires changes.`,
        relatedActivityId: activity._id
      });
    }

    // Finally update the submission
    submission.status = status;
    submission.score = score;
    submission.xpAwarded = xpAwarded;
    submission.reviewerId = req.user.id;
    submission.reviewerFeedback = feedback;
    submission.reviewedAt = new Date();
    await submission.save();

    res.success(submission, 'Submission reviewed');
  } catch (err) { next(err); }
});

module.exports = router;
