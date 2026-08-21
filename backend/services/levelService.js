const { LEVELS: CONFIG_LEVELS } = require('../config/levels');

// ── In-memory cache ───────────────────────────────────────────────────────────
let _cachedLevels   = null;
let _cacheExpiresAt = 0;
const CACHE_TTL_MS  = 5 * 60 * 1000; // 5 minutes

/**
 * Load level definitions from DB (preferred) or fall back to config file.
 * Returns a sorted array of { level, title, minXP, maxXP, icon, badge }.
 */
const _loadLevels = async () => {
  try {
    const LevelDefinition = require('../models/LevelDefinition');
    const dbLevels = await LevelDefinition.find({ isEnabled: true }).sort({ level: 1 }).lean();
    if (dbLevels.length > 0) {
      _cachedLevels = dbLevels.map((l) => ({
        level:   l.level,
        title:   l.title,
        minXP:   l.minXP,
        maxXP:   l.maxXP === null ? Infinity : l.maxXP,
        icon:    l.icon,
        badge:   l.badge,
        xpReward: l.xpReward,
      }));
      _cacheExpiresAt = Date.now() + CACHE_TTL_MS;
      return _cachedLevels;
    }
  } catch (_) {
    // DB not reachable — fall through to config
  }
  // Fallback to config file
  _cachedLevels = CONFIG_LEVELS;
  _cacheExpiresAt = Date.now() + CACHE_TTL_MS;
  return _cachedLevels;
};

/** Invalidate cache (call after DB level CRUD operations). */
const invalidateCache = () => { _cachedLevels = null; _cacheExpiresAt = 0; };

/** Get levels array — from cache or DB. */
const _getLevels = async () => {
  if (_cachedLevels && Date.now() < _cacheExpiresAt) return _cachedLevels;
  return _loadLevels();
};

// ── Synchronous helpers (use cached snapshot) ─────────────────────────────────
const _computeLevel = (xp, levels) => {
  for (let i = levels.length - 1; i >= 0; i--) {
    if (xp >= levels[i].minXP) {
      const current = levels[i];
      const next    = levels[i + 1] || null;
      const progressToNext = next
        ? Math.min(100, Math.floor(((xp - current.minXP) / (next.minXP - current.minXP)) * 100))
        : 100;
      return {
        level:          current.level,
        title:          current.title,
        minXP:          current.minXP,
        maxXP:          current.maxXP === Infinity ? null : current.maxXP,
        icon:           current.icon,
        badge:          current.badge,
        progressToNext,
        xpForNext:      Math.max(0, next ? next.minXP - xp : 0),
        nextLevel:      next ? { level: next.level, title: next.title, minXP: next.minXP } : null,
      };
    }
  }
  const first = levels[0];
  return { ...first, maxXP: first.maxXP === Infinity ? null : first.maxXP, progressToNext: 0, xpForNext: levels[1]?.minXP || 100, nextLevel: levels[1] || null };
};

/**
 * Synchronous level computation using cached levels.
 * On first call (cache empty) falls back to config levels.
 */
const getLevelForXP = (xp) => {
  const levels = _cachedLevels || CONFIG_LEVELS;
  return _computeLevel(xp, levels);
};

/**
 * Async version — ensures DB levels are loaded.
 */
const getLevelForXPAsync = async (xp) => {
  const levels = await _getLevels();
  return _computeLevel(xp, levels);
};

const getLevelNumber = (xp) => getLevelForXP(xp).level;

/**
 * Returns all level definitions for the /api/gamification/levels endpoint.
 * Sync — uses cache. Use getAllLevelsAsync for fresh data.
 */
const getAllLevels = () => {
  const levels = _cachedLevels || CONFIG_LEVELS;
  return levels.map((l) => ({ ...l, maxXP: l.maxXP === Infinity ? null : l.maxXP }));
};

const getAllLevelsAsync = async () => {
  const levels = await _getLevels();
  return levels.map((l) => ({ ...l, maxXP: l.maxXP === Infinity ? null : l.maxXP }));
};

module.exports = {
  getLevelForXP,
  getLevelForXPAsync,
  getLevelNumber,
  getAllLevels,
  getAllLevelsAsync,
  invalidateCache,
};
