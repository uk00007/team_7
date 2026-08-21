const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/adminGamification.controller');
const reviewCtrl = require('../controllers/review.controller');
const { protect } = require('../middleware/auth.middleware');
const { adminOnly } = require('../middleware/role.middleware');

router.use(protect, adminOnly);

// Mount gamification subrouter
router.use('/gamification', require('./adminGamification.routes'));

// Direct review endpoints under /api/admin/reviews
router.get   ('/reviews',                       reviewCtrl.listReviews);
router.post  ('/reviews/:submissionId',         reviewCtrl.reviewSubmission);
router.post  ('/reviews/:submissionId/confirm', reviewCtrl.confirmReview);

module.exports = router;
