const Submission = require('../models/Submission');
const Activity = require('../models/Activity');
const Enrollment = require('../models/Enrollment');
const { success, error } = require('../utils/response');

const submit = async (req, res) => {
  try {
    const { activityId, content = '', attachmentUrl = null, certificateUrl = null } = req.body;
    const studentId = req.user?.id || req.user?._id;
    const teamId = req.user?.teamId || null;

    if (!activityId) return error(res, 'activityId is required', 'VALIDATION_ERROR', 400);

    const activity = await Activity.findById(activityId);
    if (!activity) return error(res, 'Activity not found', 'NOT_FOUND', 404);

    const submission = await Submission.create({
      activityId,
      studentId,
      teamId,
      content,
      attachmentUrl,
      certificateUrl,
      status: 'PENDING',
      submittedAt: new Date(),
    });

    // Mark enrollment as submitted if exists
    await Enrollment.findOneAndUpdate(
      { studentId, activityId },
      { status: 'SUBMITTED', submittedAt: new Date() }
    );

    return success(res, submission, 'Work submitted successfully', 201);
  } catch (err) {
    return error(res, err.message, 'SERVER_ERROR', 500);
  }
};

const getByActivity = async (req, res) => {
  try {
    const { activityId } = req.params;
    const studentId = req.user?.id || req.user?._id;
    const submissions = await Submission.find({ activityId, studentId }).sort({ submittedAt: -1 });
    return success(res, submissions);
  } catch (err) {
    return error(res, err.message, 'SERVER_ERROR', 500);
  }
};

const getPending = async (req, res) => {
  try {
    const submissions = await Submission.find({ status: 'PENDING' })
      .populate('studentId', 'name email totalXP currentLevel')
      .populate('activityId', 'title type maxXP dueDate')
      .sort({ submittedAt: -1 });
    return success(res, submissions);
  } catch (err) {
    return error(res, err.message, 'SERVER_ERROR', 500);
  }
};

const getMySubmissions = async (req, res) => {
  try {
    const studentId = req.user?.id || req.user?._id;
    const submissions = await Submission.find({ studentId })
      .populate('activityId', 'title type maxXP')
      .sort({ submittedAt: -1 });
    return success(res, submissions);
  } catch (err) {
    return error(res, err.message, 'SERVER_ERROR', 500);
  }
};

module.exports = { submit, getByActivity, getPending, getMySubmissions };
