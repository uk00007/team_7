const mongoose = require('mongoose');
const User            = require('../models/User');
const Team            = require('../models/Team');
const XPTransaction   = require('../models/XPTransaction');
const Submission      = require('../models/Submission');
const Activity        = require('../models/Activity');
const levelService    = require('./levelService');
const streakService   = require('./streakService');
const achievementSvc  = require('./achievementService');
const notificationSvc = require('./notificationService');
const milestoneSvc    = require('./milestoneService');
const xpSettingsSvc   = require('./xpSettingsService');

/**
 * Core XP award function — the ONLY path that modifies User.totalXP and Team.totalXP.
 *
 * @param {object} params
 * @param {boolean} [params.creditUser=true]  — increment student totalXP
 * @param {boolean} [params.creditTeam=false] — increment team totalXP
 */
const awardXP = async ({
  studentId,
  xp,
  reason,
  type,
  activityId    = null,
  submissionId  = null,
  teamId        = null,
  awardedBy     = null,
  metadata      = {},
  creditUser    = true,
  creditTeam    = false,
}) => {
  if (!xp || xp === 0) throw new Error('XP value must be non-zero');
  if (!creditUser && !creditTeam) throw new Error('XP must credit at least user or team');

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const previousUser = await User.findById(studentId).session(session);
    if (!previousUser) throw new Error(`User ${studentId} not found`);

    const resolvedTeamId = teamId || previousUser.teamId || null;

    const [transaction] = await XPTransaction.create(
      [{
        studentId,
        teamId:       resolvedTeamId,
        activityId,
        submissionId,
        xp,
        reason,
        type,
        awardedBy,
        metadata:     { ...metadata, creditUser, creditTeam },
      }],
      { session }
    );

    let updatedUser = previousUser;
    let newLevel    = previousUser.currentLevel;
    let levelBefore = previousUser.currentLevel;
    let levelInfo   = levelService.getLevelForXP(previousUser.totalXP);

    if (creditUser) {
      const newTotalXP = Math.max(0, previousUser.totalXP + xp);
      levelBefore      = previousUser.currentLevel;
      levelInfo        = levelService.getLevelForXP(newTotalXP);
      newLevel         = levelInfo.level;

      updatedUser = await User.findByIdAndUpdate(
        studentId,
        { totalXP: newTotalXP, currentLevel: newLevel },
        { new: true, session }
      );
    }

    if (creditTeam && resolvedTeamId && xp > 0) {
      await Team.findByIdAndUpdate(
        resolvedTeamId,
        { $inc: { totalXP: xp } },
        { session }
      );
    }

    await session.commitTransaction();

    let streakResult = { streakIncremented: false, newStreak: updatedUser.currentStreak, bonusXP: 0, bonusReason: null };

    if (creditUser) {
      streakResult = await streakService.updateStreak(studentId);

      if (streakResult.bonusXP > 0) {
        await awardXP({
          studentId,
          xp:     streakResult.bonusXP,
          reason: streakResult.bonusReason,
          type:   'STREAK',
          creditUser: true,
          creditTeam: false,
        });
      }

      const newlyUnlocked = await achievementSvc.evaluateAchievements(studentId);

      for (const { achievement, bonusXP } of newlyUnlocked) {
        if (bonusXP > 0) {
          await awardXP({
            studentId,
            xp:       bonusXP,
            reason:   `Achievement unlocked: ${achievement.name}`,
            type:     'BONUS',
            metadata: { achievementId: achievement._id.toString() },
            creditUser: true,
            creditTeam: false,
          });
        }
      }

      await milestoneSvc.updateMilestoneProgress(studentId);
      await notificationSvc.notifyXPAwarded(studentId, xp, reason, activityId);

      if (newLevel > levelBefore) {
        await notificationSvc.notifyLevelUp(studentId, newLevel, levelInfo.title);
      }
    }

    return {
      transaction,
      updatedUser,
      leveledUp:               creditUser && newLevel > levelBefore,
      newLevel,
      levelInfo,
      streakResult,
    };
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

const calculateXPFromScore = async (score, activityType, maxXP) =>
  xpSettingsSvc.calculateXP(score, activityType, maxXP);

const calculateXPFromScoreSync = (score, maxXP) => {
  if (score < 0 || score > 100) throw new Error('Score must be between 0 and 100');
  return Math.round((score / 100) * maxXP);
};

/**
 * STEP 1 — Admin reviews submission: calculates XP preview WITHOUT awarding.
 */
const processReview = async ({ submissionId, score, reviewerId, reviewerFeedback = '', status }) => {
  const submission = await Submission.findById(submissionId).populate('activityId');
  if (!submission) throw new Error(`Submission ${submissionId} not found`);
  if (submission.reviewStep === 'CONFIRMED') {
    throw new Error('Review already confirmed and XP awarded — duplicate confirmation blocked');
  }
  if (submission.status === 'APPROVED' && submission.reviewStep === 'CONFIRMED') {
    throw new Error('Submission has already been approved');
  }

  const activity = submission.activityId;
  if (!activity) throw new Error('Activity not found for this submission');

  if (status === 'APPROVED') {
    const isDuplicate = await xpSettingsSvc.hasDuplicateXP(
      submission.studentId, submission._id, XPTransaction, 'ACTIVITY'
    );
    if (isDuplicate) {
      const cfg = await xpSettingsSvc.getSettingsForType(activity.type);
      if (!cfg.allowMultipleXP) {
        throw new Error('XP has already been awarded for this submission (duplicate protection)');
      }
    }
  }

  let xpPreview = null;

  if (status === 'APPROVED') {
    const calculated = await xpSettingsSvc.calculateXP(score, activity.type, activity.maxXP);
    xpPreview = {
      xp:     calculated.xp,
      teamXP: calculated.teamXP,
      breakdown: calculated.breakdown,
    };

    await Submission.findByIdAndUpdate(submissionId, {
      score,
      pendingXP:        calculated.xp,
      pendingTeamXP:    calculated.teamXP,
      reviewStep:       'CALCULATED',
      status:           'REVIEW_PENDING_CONFIRMATION',
      reviewerId,
      reviewerFeedback,
      reviewedAt:       new Date(),
    });
  } else if (status === 'NEEDS_REVISION') {
    await Submission.findByIdAndUpdate(submissionId, {
      score: score ?? null,
      pendingXP: null,
      pendingTeamXP: null,
      status: 'NEEDS_REVISION',
      reviewerId,
      reviewerFeedback,
      reviewedAt: new Date(),
      reviewStep: 'NONE',
    });
    await notificationSvc.createNotification({
      userId:            submission.studentId,
      type:              'SUBMISSION_REVIEWED',
      title:             'Submission Needs Revision',
      message:           `Your submission for "${activity.title}" needs revision. Feedback: ${reviewerFeedback || 'See feedback.'}`,
      relatedActivityId: activity._id,
    });
  } else {
    await Submission.findByIdAndUpdate(submissionId, {
      score: score ?? 0,
      xpAwarded: 0,
      pendingXP: null,
      pendingTeamXP: null,
      status: 'REJECTED',
      reviewerId,
      reviewerFeedback,
      reviewedAt: new Date(),
      reviewStep: 'NONE',
    });
    await notificationSvc.createNotification({
      userId:            submission.studentId,
      type:              'SUBMISSION_REVIEWED',
      title:             'Submission Rejected',
      message:           `Your submission for "${activity.title}" was rejected. Feedback: ${reviewerFeedback || 'No feedback provided.'}`,
      relatedActivityId: activity._id,
    });
  }

  const updatedSubmission = await Submission.findById(submissionId);
  return {
    submission: updatedSubmission,
    score,
    status,
    xpPreview:            xpPreview?.xp ?? null,
    teamXPPreview:        xpPreview?.teamXP ?? null,
    breakdown:            xpPreview?.breakdown ?? null,
    requiresConfirmation: status === 'APPROVED',
  };
};

/**
 * STEP 2 — Admin confirms the XP award (human-in-the-loop final step).
 */
const confirmReview = async ({ submissionId, reviewerId }) => {
  const submission = await Submission.findById(submissionId).populate('activityId');
  if (!submission) throw new Error(`Submission ${submissionId} not found`);

  if (submission.reviewStep === 'CONFIRMED') {
    throw new Error('Review already confirmed — XP was already awarded');
  }
  if (submission.reviewStep !== 'CALCULATED') {
    throw new Error('No pending XP calculation to confirm. Run processReview first.');
  }
  if (submission.pendingXP === null || submission.pendingXP === undefined) {
    throw new Error('No pending XP to award');
  }

  const activity = submission.activityId;

  const isDuplicate = await xpSettingsSvc.hasDuplicateXP(
    submission.studentId, submission._id, XPTransaction, 'ACTIVITY'
  );
  const cfg = await xpSettingsSvc.getSettingsForType(activity.type);
  if (isDuplicate && !cfg.allowMultipleXP) {
    throw new Error('Duplicate XP protection triggered: XP already exists for this submission');
  }

  const student = await User.findById(submission.studentId).select('teamId');
  const teamId  = submission.teamId || student?.teamId || null;

  await Submission.findByIdAndUpdate(submissionId, {
    status:    'APPROVED',
    xpAwarded: submission.pendingXP,
    reviewStep:'CONFIRMED',
  });

  const xpResult = await awardXP({
    studentId:    submission.studentId,
    xp:           submission.pendingXP,
    reason:       `Activity completed: ${activity.title}`,
    type:         'ACTIVITY',
    activityId:   activity._id,
    submissionId: submission._id,
    teamId,
    awardedBy:    reviewerId,
    creditUser:   true,
    creditTeam:   false,
  });

  let teamXPResult = null;
  if (submission.pendingTeamXP > 0 && teamId) {
    const teamDuplicate = await xpSettingsSvc.hasDuplicateXP(
      submission.studentId, submission._id, XPTransaction, 'TEAM'
    );
    if (!teamDuplicate) {
      teamXPResult = await awardXP({
        studentId:    submission.studentId,
        xp:           submission.pendingTeamXP,
        reason:       `Team contribution: ${activity.title}`,
        type:         'TEAM',
        activityId:   activity._id,
        submissionId: submission._id,
        teamId,
        awardedBy:    reviewerId,
        creditUser:   false,
        creditTeam:   true,
      });
    }
  }

  const updatedSubmission = await Submission.findById(submissionId);
  return { submission: updatedSubmission, xpResult, teamXPResult };
};

const getStudentXPSummary = async (studentId) => {
  const user = await User.findById(studentId).select(
    'name email totalXP currentLevel currentStreak longestStreak teamId lastActivityDate'
  );
  if (!user) throw new Error(`User ${studentId} not found`);

  const now      = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart  = new Date(now.getFullYear(), 0, 1);

  const [monthlyXP, yearlyXP, recentTransactions] = await Promise.all([
    XPTransaction.aggregate([
      { $match: { studentId: new mongoose.Types.ObjectId(studentId), createdAt: { $gte: monthStart }, xp: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: '$xp' } } },
    ]),
    XPTransaction.aggregate([
      { $match: { studentId: new mongoose.Types.ObjectId(studentId), createdAt: { $gte: yearStart }, xp: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: '$xp' } } },
    ]),
    XPTransaction.find({ studentId })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('activityId', 'title type'),
  ]);

  const levelInfo = await levelService.getLevelForXPAsync(user.totalXP);

  return {
    studentId:          user._id,
    name:               user.name,
    totalXP:            user.totalXP,
    monthlyXP:          monthlyXP[0]?.total || 0,
    yearlyXP:           yearlyXP[0]?.total  || 0,
    currentLevel:       user.currentLevel,
    levelInfo,
    currentStreak:      user.currentStreak,
    longestStreak:      user.longestStreak,
    recentTransactions,
  };
};

const getTeamXPSummary = async (teamId) => {
  const team = await Team.findById(teamId).populate('memberIds', 'name totalXP currentLevel');
  if (!team) throw new Error(`Team ${teamId} not found`);

  const now        = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const memberIds = team.memberIds.map((m) => m._id);
  const monthlyBreakdown = await XPTransaction.aggregate([
    {
      $match: {
        studentId: { $in: memberIds },
        createdAt: { $gte: monthStart },
        xp:        { $gt: 0 },
      },
    },
    { $group: { _id: '$studentId', monthlyXP: { $sum: '$xp' } } },
  ]);

  const monthlyMap = new Map(monthlyBreakdown.map((r) => [r._id.toString(), r.monthlyXP]));

  return {
    teamId:      team._id,
    name:        team.name,
    totalXP:     team.totalXP,
    memberCount: team.memberIds.length,
    members:     team.memberIds.map((m) => ({
      studentId:    m._id,
      name:         m.name,
      totalXP:      m.totalXP,
      currentLevel: m.currentLevel,
      monthlyXP:    monthlyMap.get(m._id.toString()) || 0,
    })),
  };
};

module.exports = {
  awardXP,
  calculateXPFromScore,
  calculateXPFromScoreSync,
  processReview,
  confirmReview,
  getStudentXPSummary,
  getTeamXPSummary,
};
