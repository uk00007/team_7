const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authMiddleware');
const Certificate = require('../models/Certificate');

// GET /api/certificates
router.get('/', authenticate, async (req, res, next) => {
  try {
    const certs = await Certificate.find({ studentId: req.user.id })
      .populate('activityId', 'title')
      .sort({ createdAt: -1 })
      .lean();
    res.success(certs, 'Certificates fetched');
  } catch (err) { next(err); }
});

// POST /api/certificates/upload
router.post('/upload', authenticate, async (req, res, next) => {
  try {
    const { activityId, certificateUrl, certificateName, issuer } = req.body;
    if (!activityId || !certificateUrl) return res.fail('Activity ID and URL required', 'VALIDATION_ERROR', 400);

    const cert = await Certificate.create({
      studentId: req.user.id,
      activityId,
      certificateUrl,
      certificateName,
      issuer,
      status: 'PENDING',
      issueDate: new Date()
    });
    res.success(cert, 'Certificate uploaded successfully', 201);
  } catch (err) { next(err); }
});

module.exports = router;
