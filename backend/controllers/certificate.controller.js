const Certificate = require('../models/Certificate');
const Activity = require('../models/Activity');
const xpService = require('../services/xpService');
const { success, error } = require('../utils/response');

const uploadCertificate = async (req, res) => {
  try {
    const { activityId, certificateUrl, certificateName = 'Certificate', issuer = 'Katalyst' } = req.body;
    const studentId = req.user?.id || req.user?._id;

    if (!activityId || !certificateUrl) {
      return error(res, 'activityId and certificateUrl are required', 'VALIDATION_ERROR', 400);
    }

    const cert = await Certificate.create({
      studentId,
      activityId,
      certificateUrl,
      certificateName,
      issuer,
      issueDate: new Date(),
      status: 'PENDING',
    });

    return success(res, cert, 'Certificate uploaded and pending validation', 201);
  } catch (err) {
    return error(res, err.message, 'SERVER_ERROR', 500);
  }
};

const getCertificates = async (req, res) => {
  try {
    const studentId = req.user?.id || req.user?._id;
    const certs = await Certificate.find({ studentId }).populate('activityId', 'title type maxXP').sort({ createdAt: -1 });
    return success(res, certs);
  } catch (err) {
    return error(res, err.message, 'SERVER_ERROR', 500);
  }
};

const validateCertificate = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, validationScore = 100, reviewerFeedback = '', xpAwarded = 50 } = req.body;
    const reviewerId = req.user?.id || req.user?._id;

    const cert = await Certificate.findById(id);
    if (!cert) return error(res, 'Certificate not found', 'NOT_FOUND', 404);

    cert.status = status || 'VALIDATED';
    cert.validationScore = Number(validationScore);
    cert.reviewerFeedback = reviewerFeedback;
    cert.reviewerId = reviewerId;

    if (cert.status === 'VALIDATED' && Number(xpAwarded) > 0) {
      cert.xpAwarded = Number(xpAwarded);
      await xpService.awardXP({
        studentId: cert.studentId,
        activityId: cert.activityId,
        xp: Number(xpAwarded),
        reason: `Certificate validated: ${cert.certificateName}`,
        type: 'ACTIVITY',
      });
    }

    await cert.save();
    return success(res, cert, 'Certificate validated successfully');
  } catch (err) {
    return error(res, err.message, 'SERVER_ERROR', 500);
  }
};

module.exports = { uploadCertificate, getCertificates, validateCertificate };
