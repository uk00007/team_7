const express = require('express');
const router = express.Router();
const certController = require('../controllers/certificate.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');

router.post('/upload', protect, certController.uploadCertificate);
router.get('/', protect, certController.getCertificates);
router.put('/:id/validate', protect, adminOnly, certController.validateCertificate);

module.exports = router;
