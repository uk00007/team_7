const XPSettings = require('../models/XPSettings');

// In-memory cache to avoid hammering DB on every XP award
let _cache    = null;
let _cacheExp = 0;
const TTL     = 5 * 60 * 1000; // 5 minutes

const DEFAULTS = {
  baseXP: 50, maxXP: 100, passingScore: 60, minScoreForXP: 0,
  bonusXP: 0, streakBonusXP: 0, teamBonusXP: 0, individualXP: 0,
  streakEligible: true, rewardEligible: true,
  allowMultipleXP: false, allowRetryXP: false, xpCap: null, isEnabled: true,
};

/** Invalidate cache after admin writes. */
const invalidateCache = () => { _cache = null; _cacheExp = 0; };

/** Load all settings from DB into a keyed map. */
const _load = async () => {
  if (_cache && Date.now() < _cacheExp) return _cache;
  const settings = await XPSettings.find({ isEnabled: true }).lean();
  _cache = {};
  for (const s of settings) _cache[s.activityType] = s;
  _cacheExp = Date.now() + TTL;
  return _cache;
};

/**
 * Get XP settings for a specific activity type.
 * @param {string} activityType
 * @returns {object} settings object
 */
const getSettingsForType = async (activityType) => {
  const map = await _load();
  return map[activityType] || { ...DEFAULTS, activityType };
};

/**
 * Calculate individual and team XP for a given score under a given activity type.
 * Score-based XP is proportional to maxXP; baseXP acts as a floor when passing.
 *
 * @param {number} score       0–100
 * @param {string} activityType
 * @param {number} [activityMaxXP]  override from Activity.maxXP if set
 * @returns {{ xp: number, teamXP: number, breakdown: object }}
 */
const calculateXP = async (score, activityType, activityMaxXP = null) => {
  const cfg = await getSettingsForType(activityType);

  if (!cfg.isEnabled) {
    return {
      xp: 0,
      teamXP: 0,
      breakdown: { base: 0, bonus: 0, individual: 0, team: 0, total: 0, disabled: true, cfg },
    };
  }

  const maxXP = activityMaxXP !== null && activityMaxXP !== undefined ? activityMaxXP : cfg.maxXP;

  if (score < cfg.minScoreForXP) {
    return {
      xp: 0,
      teamXP: 0,
      breakdown: { base: 0, bonus: 0, individual: 0, team: 0, total: 0, belowMinScore: true, cfg },
    };
  }

  const scoreBased = Math.round((score / 100) * maxXP);
  const base       = score >= cfg.passingScore ? Math.max(cfg.baseXP, scoreBased) : scoreBased;
  const bonus      = score >= cfg.passingScore ? cfg.bonusXP : 0;
  const individual = score >= cfg.passingScore ? (cfg.individualXP || 0) : 0;
  const teamXP     = score >= cfg.passingScore ? (cfg.teamBonusXP || 0) : 0;

  let total = base + bonus + individual;
  if (cfg.xpCap !== null && cfg.xpCap !== undefined) total = Math.min(total, cfg.xpCap);

  return {
    xp: total,
    teamXP,
    breakdown: {
      base,
      bonus,
      individual,
      team: teamXP,
      total,
      score,
      maxXP,
      passingScore: cfg.passingScore,
      cfg,
    },
  };
};

/**
 * Check whether a student has already received activity XP for this submission.
 */
const hasDuplicateXP = async (studentId, submissionId, XPTransaction, type = 'ACTIVITY') => {
  const existing = await XPTransaction.findOne({ studentId, submissionId, type });
  return !!existing;
};

module.exports = { getSettingsForType, calculateXP, hasDuplicateXP, invalidateCache };
