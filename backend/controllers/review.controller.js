const xpService = require('../services/xpService');
const auditSvc = require('../services/auditService');
const Submission = require('../models/Submission');
const Activity = require('../models/Activity');
const validators = require('../validators/admin.validators');
const { success, error } = require('../utils/response');

const validate = (schema, data) => {
  const { value, error: err } = schema.validate(data, { abortEarly: false, stripUnknown: true });
  return { value, validationError: err ? err.details.map((d) => d.message).join('; ') : null };
};

const listReviews = async (req, res) => {
  try {
    const { status, activityType, studentId, teamId, dateFrom, dateTo, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status)    filter.status    = status;
    if (studentId) filter.studentId = studentId;
    if (teamId)    filter.teamId    = teamId;
    if (dateFrom || dateTo) {
      filter.submittedAt = {};
      if (dateFrom) filter.submittedAt.$gte = new Date(dateFrom);
      if (dateTo)   filter.submittedAt.$lte = new Date(dateTo);
    }

    if (activityType) {
      const acts = await Activity.find({ type: activityType }).select('_id');
      filter.activityId = { $in: acts.map((a) => a._id) };
    }

    const pageNum  = Math.max(parseInt(page), 1);
    const limitNum = Math.min(parseInt(limit), 100);

    const [submissions, total] = await Promise.all([
      Submission.find(filter)
        .sort({ submittedAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .populate('studentId', 'name email totalXP currentLevel teamId')
        .populate('activityId', 'title type maxXP isMandatory dueDate')
        .populate('reviewerId', 'name email'),
      Submission.countDocuments(filter),
    ]);

    return success(res, { submissions, total, page: pageNum, limit: limitNum }, 'Reviews retrieved');
  } catch (err) {
    return error(res, err.message, 'FETCH_FAILED', 500);
  }
};

const reviewSubmission = async (req, res) => {
  try {
    const { value, validationError } = validate(validators.reviewSubmission, req.body);
    if (validationError) return error(res, validationError, 'VALIDATION_ERROR', 400);

    const submissionId = req.params.submissionId || req.params.id;
    const reviewerId   = req.user?.id || req.user?._id;

    let result = await xpService.processReview({
      submissionId,
      score:            value.score,
      status:           value.status,
      reviewerFeedback: value.reviewerFeedback,
      reviewerId,
    });

    // Auto-confirm: award XP immediately on approval (bypass manual two-step UI).
    if (value.status === 'APPROVED') {
      try {
        const confirmed = await xpService.confirmReview({ submissionId, reviewerId });
        result = { ...result, ...confirmed, autoConfirmed: true };
      } catch (confirmErr) {
        // Already confirmed or duplicate — safe to ignore
        console.warn('[Auto-Confirm]', confirmErr.message);
      }
    }

    await auditSvc.record({
      adminId:         req.user?.id || req.user?._id,
      action:          value.status === 'APPROVED' ? 'SUBMISSION_APPROVED'
                     : value.status === 'REJECTED' ? 'SUBMISSION_REJECTED'
                     : 'SUBMISSION_NEEDS_REVISION',
      targetStudentId: result.submission.studentId,
      submissionId:    result.submission._id,
      newValue:        { score: value.score, status: value.status, xpPreview: result.xpPreview },
      reason:          value.reviewerFeedback,
    });

    const msg = value.status === 'APPROVED'
      ? `Review saved. Calculated XP: ${result.xpPreview?.xp || result.xpPreview}. Call POST /confirm to award.`
      : value.status === 'NEEDS_REVISION'
      ? 'Submission marked for revision.'
      : 'Submission rejected.';

    return success(res, result, msg);
  } catch (err) {
    return error(res, err.message, 'REVIEW_FAILED', err.message.includes('not found') ? 404 : 500);
  }
};

const confirmReview = async (req, res) => {
  try {
    const result = await xpService.confirmReview({
      submissionId: req.params.submissionId || req.params.id,
      reviewerId:   req.user?.id || req.user?._id,
    });

    await auditSvc.record({
      adminId:         req.user?.id || req.user?._id,
      action:          'SUBMISSION_APPROVED',
      targetStudentId: result.submission.studentId,
      submissionId:    result.submission._id,
      newValue:        { xpAwarded: result.submission.xpAwarded, confirmed: true },
    });

    return success(res, result, `XP officially awarded: ${result.submission.xpAwarded} XP`);
  } catch (err) {
    return error(res, err.message, 'CONFIRM_FAILED', err.message.includes('not found') ? 404 : 500);
  }
};

module.exports = {
  listReviews,
  reviewSubmission,
  confirmReview,
};
