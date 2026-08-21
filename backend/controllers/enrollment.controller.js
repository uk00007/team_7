const Enrollment = require('../models/Enrollment');
const Activity = require('../models/Activity');
const { success, error } = require('../utils/response');

const enroll = async (req, res) => {
  try {
    const { activityId } = req.body;
    const studentId = req.user?.id || req.user?._id;

    if (!activityId) return error(res, 'activityId is required', 'VALIDATION_ERROR', 400);

    const activity = await Activity.findById(activityId);
    if (!activity) return error(res, 'Activity not found', 'NOT_FOUND', 404);

    let enrollment = await Enrollment.findOne({ studentId, activityId });
    if (enrollment) {
      return success(res, enrollment, 'Already enrolled in this activity');
    }

    enrollment = await Enrollment.create({
      studentId,
      activityId,
      status: 'ENROLLED',
      progress: 0,
      enrolledAt: new Date(),
    });

    return success(res, enrollment, 'Enrolled successfully', 201);
  } catch (err) {
    return error(res, err.message, 'SERVER_ERROR', 500);
  }
};

const getMyEnrollments = async (req, res) => {
  try {
    const studentId = req.user?.id || req.user?._id;
    const enrollments = await Enrollment.find({ studentId }).populate('activityId').sort({ enrolledAt: -1 });
    return success(res, enrollments);
  } catch (err) {
    return error(res, err.message, 'SERVER_ERROR', 500);
  }
};

const updateProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const { progress, status } = req.body;
    const update = {};
    if (progress !== undefined) update.progress = Number(progress);
    if (status) update.status = status;
    if (status === 'COMPLETED') update.completedAt = new Date();

    const enrollment = await Enrollment.findByIdAndUpdate(id, update, { new: true });
    if (!enrollment) return error(res, 'Enrollment not found', 'NOT_FOUND', 404);
    return success(res, enrollment, 'Progress updated');
  } catch (err) {
    return error(res, err.message, 'SERVER_ERROR', 500);
  }
};

module.exports = { enroll, getMyEnrollments, updateProgress };
