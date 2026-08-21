const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/adminGamification.controller');
const reviewCtrl = require('../controllers/review.controller');
const { protect } = require('../middleware/auth.middleware');
const { adminOnly } = require('../middleware/role.middleware');

router.use(protect, adminOnly);

// ── XP Settings ───────────────────────────────────────────────────────────────
router.get   ('/xp-settings',      ctrl.getXPSettings);
router.post  ('/xp-settings',      ctrl.createXPSettings);
router.put   ('/xp-settings/:id',  ctrl.updateXPSettings);
router.delete('/xp-settings/:id',  ctrl.deleteXPSettings);

// ── Level Definitions ─────────────────────────────────────────────────────────
router.get   ('/levels',           ctrl.getLevelDefinitions);
router.post  ('/levels',           ctrl.createLevelDefinition);
router.put   ('/levels/:id',       ctrl.updateLevelDefinition);
router.delete('/levels/:id',       ctrl.deleteLevelDefinition);

// ── Milestones ────────────────────────────────────────────────────────────────
router.get   ('/milestones',       ctrl.getMilestonesAdmin);
router.post  ('/milestones',       ctrl.createMilestone);
router.put   ('/milestones/:id',   ctrl.updateMilestone);
router.delete('/milestones/:id',   ctrl.deleteMilestone);

// ── Achievements ──────────────────────────────────────────────────────────────
router.get   ('/achievements',     ctrl.getAchievementsAdmin);
router.post  ('/achievements',     ctrl.createAchievement);
router.put   ('/achievements/:id', ctrl.updateAchievement);
router.delete('/achievements/:id', ctrl.deleteAchievement);

// ── Submission Reviews (Human-in-the-loop, two-step) ─────────────────────────
router.get   ('/reviews',                      reviewCtrl.listReviews);
router.post  ('/reviews/:submissionId',        reviewCtrl.reviewSubmission);
router.post  ('/reviews/:submissionId/confirm',reviewCtrl.confirmReview);

// ── Manual XP Award & Monitoring ──────────────────────────────────────────────
router.post  ('/manual-award',     ctrl.manualAward);
router.get   ('/participation',    ctrl.getParticipation);
router.get   ('/summary',          ctrl.getGamificationSummary);
router.get   ('/xp-transactions',  ctrl.getXPTransactions);
router.get   ('/audit',            ctrl.getAuditLog);

module.exports = router;
