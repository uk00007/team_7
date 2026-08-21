/**
 * validators/admin.validators.js
 * Joi validation schemas for all admin gamification endpoints.
 */
const Joi = require('joi');

const ACTIVITY_TYPES = ['TRAINING', 'COURSE', 'MENTORING', 'COACHING', 'PROJECT', 'ASSIGNMENT', 'QUIZ', 'PUZZLE', 'CERTIFICATE', 'MILESTONE'];

// ── XP Settings ───────────────────────────────────────────────────────────────
const xpSettingsCreate = Joi.object({
  activityType:    Joi.string().valid(...ACTIVITY_TYPES).required(),
  baseXP:          Joi.number().min(0).required(),
  maxXP:           Joi.number().min(0).required(),
  passingScore:    Joi.number().min(0).max(100).default(60),
  minScoreForXP:   Joi.number().min(0).max(100).default(0),
  bonusXP:         Joi.number().min(0).default(0),
  streakBonusXP:   Joi.number().min(0).default(0),
  teamBonusXP:     Joi.number().min(0).default(0),
  individualXP:    Joi.number().min(0).default(0),
  streakEligible:  Joi.boolean().default(true),
  rewardEligible:  Joi.boolean().default(true),
  allowMultipleXP: Joi.boolean().default(false),
  allowRetryXP:    Joi.boolean().default(false),
  xpCap:           Joi.number().min(0).allow(null).default(null),
  description:     Joi.string().allow('').default(''),
  isEnabled:       Joi.boolean().default(true),
});

const xpSettingsUpdate = xpSettingsCreate.fork(
  ['activityType', 'baseXP', 'maxXP'],
  (schema) => schema.optional()
);

// ── Level Definition ──────────────────────────────────────────────────────────
const levelCreate = Joi.object({
  level:       Joi.number().integer().min(1).required(),
  title:       Joi.string().trim().required(),
  description: Joi.string().allow('').default(''),
  minXP:       Joi.number().min(0).required(),
  maxXP:       Joi.number().min(0).allow(null).default(null),
  icon:        Joi.string().default('🏅'),
  badge:       Joi.string().allow('').default(''),
  xpReward:    Joi.number().min(0).default(0),
  isEnabled:   Joi.boolean().default(true),
});

const levelUpdate = levelCreate.fork(
  ['level', 'title', 'minXP'],
  (schema) => schema.optional()
);

// ── Milestone ─────────────────────────────────────────────────────────────────
const milestoneCreate = Joi.object({
  name:        Joi.string().trim().required(),
  description: Joi.string().required(),
  icon:        Joi.string().default('🎯'),
  criteria: Joi.object({
    type:  Joi.string().valid('XP_TOTAL', 'ACTIVITY_COUNT', 'COURSE_COUNT', 'ASSIGNMENT_COUNT', 'QUIZ_COUNT', 'MENTORING_COUNT', 'CERTIFICATE_COUNT', 'STREAK_DAYS', 'LEVEL_REACHED').required(),
    value: Joi.number().min(1).required(),
  }).required(),
  xpReward:    Joi.number().min(0).default(0),
  order:       Joi.number().integer().min(0).default(0),
  isActive:    Joi.boolean().default(true),
});

const milestoneUpdate = milestoneCreate.fork(['name', 'description', 'criteria'], (s) => s.optional());

// ── Achievement ───────────────────────────────────────────────────────────────
const achievementCreate = Joi.object({
  name:        Joi.string().trim().required(),
  description: Joi.string().required(),
  icon:        Joi.string().default('🏆'),
  criteria: Joi.object({
    type:    Joi.string().valid('XP_TOTAL', 'ACTIVITY_COUNT', 'COURSE_COUNT', 'ASSIGNMENT_COUNT', 'QUIZ_COUNT', 'STREAK_DAYS', 'LEVEL_REACHED', 'CERTIFICATE_COUNT', 'TEAM_CONTRIBUTION', 'ACTIVITY_TYPE', 'FIRST_SUBMISSION').required(),
    value:   Joi.number().min(1).default(1),
    subtype: Joi.string().valid(...ACTIVITY_TYPES).allow(null).default(null),
  }).required(),
  xpReward:    Joi.number().min(0).default(0),
  type:        Joi.string().valid('BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'SPECIAL').default('BRONZE'),
  isActive:    Joi.boolean().default(true),
});

const achievementUpdate = achievementCreate.fork(['name', 'description', 'criteria'], (s) => s.optional());

// ── Review ────────────────────────────────────────────────────────────────────
const reviewSubmission = Joi.object({
  score:            Joi.number().min(0).max(100).required(),
  status:           Joi.string().valid('APPROVED', 'REJECTED', 'NEEDS_REVISION').default('APPROVED'),
  reviewerFeedback: Joi.string().allow('').default(''),
});

const confirmReview = Joi.object({
  // No body needed — submissionId from params, adminId from JWT
});

// ── Manual Award ──────────────────────────────────────────────────────────────
const manualAward = Joi.object({
  studentId:  Joi.string().required(),
  xp:         Joi.number().not(0).required(),
  reason:     Joi.string().required(),
  type:       Joi.string().valid('MANUAL').default('MANUAL'),
  activityId: Joi.string().optional(),
});

// ── Query filters ─────────────────────────────────────────────────────────────
const participationQuery = Joi.object({
  studentId:    Joi.string().optional(),
  teamId:       Joi.string().optional(),
  activityId:   Joi.string().optional(),
  activityType: Joi.string().valid(...ACTIVITY_TYPES).optional(),
  status:       Joi.string().optional(),
  dateFrom:     Joi.date().iso().optional(),
  dateTo:       Joi.date().iso().optional(),
});

const transactionQuery = Joi.object({
  studentId:    Joi.string().optional(),
  teamId:       Joi.string().optional(),
  activityId:   Joi.string().optional(),
  type:         Joi.string().valid('ACTIVITY', 'BONUS', 'STREAK', 'TEAM', 'MANUAL', 'PENALTY').optional(),
  dateFrom:     Joi.date().iso().optional(),
  dateTo:       Joi.date().iso().optional(),
  page:         Joi.number().integer().min(1).default(1),
  limit:        Joi.number().integer().min(1).max(100).default(20),
});

module.exports = {
  xpSettingsCreate, xpSettingsUpdate,
  levelCreate, levelUpdate,
  milestoneCreate, milestoneUpdate,
  achievementCreate, achievementUpdate,
  reviewSubmission, confirmReview,
  manualAward,
  participationQuery, transactionQuery,
};
