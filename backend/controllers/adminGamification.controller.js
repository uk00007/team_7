const XPSettings       = require('../models/XPSettings');
const LevelDefinition  = require('../models/LevelDefinition');
const Milestone        = require('../models/Milestone');
const Achievement      = require('../models/Achievement');
const XPTransaction    = require('../models/XPTransaction');
const User             = require('../models/User');

const xpService         = require('../services/xpService');
const xpSettingsSvc     = require('../services/xpSettingsService');
const levelService      = require('../services/levelService');
const participationSvc  = require('../services/participationService');
const auditSvc          = require('../services/auditService');

const validators        = require('../validators/admin.validators');
const { success, error } = require('../utils/response');

const validate = (schema, data) => {
  const { value, error: err } = schema.validate(data, { abortEarly: false, stripUnknown: true });
  return { value, validationError: err ? err.details.map((d) => d.message).join('; ') : null };
};

// ── XP Settings CRUD ──────────────────────────────────────────────────────────
const getXPSettings = async (req, res) => {
  try {
    const settings = await XPSettings.find().sort({ activityType: 1 });
    return success(res, { settings, count: settings.length }, 'XP settings retrieved');
  } catch (err) { return error(res, err.message, 'FETCH_FAILED', 500); }
};

const createXPSettings = async (req, res) => {
  try {
    const { value, validationError } = validate(validators.xpSettingsCreate, req.body);
    if (validationError) return error(res, validationError, 'VALIDATION_ERROR', 400);

    const existing = await XPSettings.findOne({ activityType: value.activityType });
    if (existing) return error(res, `XP settings for ${value.activityType} already exist. Use PUT to update.`, 'DUPLICATE', 409);

    const setting = await XPSettings.create({ ...value, createdBy: req.user?.id, updatedBy: req.user?.id });
    xpSettingsSvc.invalidateCache();

    await auditSvc.record({ adminId: req.user?.id, action: 'XP_SETTINGS_CREATED', newValue: setting.toObject(), reason: `Created XP config for ${value.activityType}` });
    return success(res, { setting }, 'XP settings created', 201);
  } catch (err) { return error(res, err.message, 'CREATE_FAILED', 500); }
};

const updateXPSettings = async (req, res) => {
  try {
    const { value, validationError } = validate(validators.xpSettingsUpdate, req.body);
    if (validationError) return error(res, validationError, 'VALIDATION_ERROR', 400);

    const existing = await XPSettings.findById(req.params.id);
    if (!existing) return error(res, 'XP settings not found', 'NOT_FOUND', 404);

    const updated = await XPSettings.findByIdAndUpdate(req.params.id, { ...value, updatedBy: req.user?.id }, { new: true });
    xpSettingsSvc.invalidateCache();

    await auditSvc.record({ adminId: req.user?.id, action: 'XP_SETTINGS_UPDATED', previousValue: existing.toObject(), newValue: updated.toObject() });
    return success(res, { setting: updated }, 'XP settings updated');
  } catch (err) { return error(res, err.message, 'UPDATE_FAILED', 500); }
};

const deleteXPSettings = async (req, res) => {
  try {
    const existing = await XPSettings.findById(req.params.id);
    if (!existing) return error(res, 'XP settings not found', 'NOT_FOUND', 404);

    await XPSettings.findByIdAndDelete(req.params.id);
    xpSettingsSvc.invalidateCache();

    await auditSvc.record({ adminId: req.user?.id, action: 'XP_SETTINGS_DELETED', previousValue: existing.toObject() });
    return success(res, {}, 'XP settings deleted');
  } catch (err) { return error(res, err.message, 'DELETE_FAILED', 500); }
};

// ── Level Definition CRUD ─────────────────────────────────────────────────────
const getLevelDefinitions = async (req, res) => {
  try {
    const levels = await LevelDefinition.find().sort({ level: 1 });
    return success(res, { levels, count: levels.length }, 'Level definitions retrieved');
  } catch (err) { return error(res, err.message, 'FETCH_FAILED', 500); }
};

const createLevelDefinition = async (req, res) => {
  try {
    const { value, validationError } = validate(validators.levelCreate, req.body);
    if (validationError) return error(res, validationError, 'VALIDATION_ERROR', 400);

    const conflict = await LevelDefinition.findOne({ level: value.level });
    if (conflict) return error(res, `Level ${value.level} already exists`, 'DUPLICATE', 409);

    const xpConflict = await LevelDefinition.findOne({ minXP: value.minXP });
    if (xpConflict) return error(res, `minXP ${value.minXP} conflicts with level ${xpConflict.level}`, 'CONFLICT', 409);

    const levelDef = await LevelDefinition.create({ ...value, createdBy: req.user?.id, updatedBy: req.user?.id });
    levelService.invalidateCache();

    await auditSvc.record({ adminId: req.user?.id, action: 'LEVEL_CREATED', newValue: levelDef.toObject() });
    return success(res, { level: levelDef }, 'Level definition created', 201);
  } catch (err) { return error(res, err.message, 'CREATE_FAILED', 500); }
};

const updateLevelDefinition = async (req, res) => {
  try {
    const { value, validationError } = validate(validators.levelUpdate, req.body);
    if (validationError) return error(res, validationError, 'VALIDATION_ERROR', 400);

    const existing = await LevelDefinition.findById(req.params.id);
    if (!existing) return error(res, 'Level not found', 'NOT_FOUND', 404);

    const updated = await LevelDefinition.findByIdAndUpdate(req.params.id, { ...value, updatedBy: req.user?.id }, { new: true });
    levelService.invalidateCache();

    await auditSvc.record({ adminId: req.user?.id, action: 'LEVEL_UPDATED', previousValue: existing.toObject(), newValue: updated.toObject() });
    return success(res, { level: updated }, 'Level definition updated');
  } catch (err) { return error(res, err.message, 'UPDATE_FAILED', 500); }
};

const deleteLevelDefinition = async (req, res) => {
  try {
    const existing = await LevelDefinition.findById(req.params.id);
    if (!existing) return error(res, 'Level not found', 'NOT_FOUND', 404);

    await LevelDefinition.findByIdAndDelete(req.params.id);
    levelService.invalidateCache();

    await auditSvc.record({ adminId: req.user?.id, action: 'LEVEL_DELETED', previousValue: existing.toObject() });
    return success(res, {}, 'Level definition deleted');
  } catch (err) { return error(res, err.message, 'DELETE_FAILED', 500); }
};

// ── Milestone CRUD ────────────────────────────────────────────────────────────
const getMilestonesAdmin = async (req, res) => {
  try {
    const filter = {};
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
    const milestones = await Milestone.find(filter).sort({ order: 1 });
    return success(res, { milestones, count: milestones.length }, 'Milestones retrieved');
  } catch (err) { return error(res, err.message, 'FETCH_FAILED', 500); }
};

const createMilestone = async (req, res) => {
  try {
    const { value, validationError } = validate(validators.milestoneCreate, req.body);
    if (validationError) return error(res, validationError, 'VALIDATION_ERROR', 400);

    const existing = await Milestone.findOne({ name: value.name });
    if (existing) return error(res, 'Milestone with this name already exists', 'DUPLICATE', 409);

    const milestone = await Milestone.create(value);
    await auditSvc.record({ adminId: req.user?.id, action: 'MILESTONE_CREATED', newValue: milestone.toObject() });
    return success(res, { milestone }, 'Milestone created', 201);
  } catch (err) { return error(res, err.message, 'CREATE_FAILED', 500); }
};

const updateMilestone = async (req, res) => {
  try {
    const { value, validationError } = validate(validators.milestoneUpdate, req.body);
    if (validationError) return error(res, validationError, 'VALIDATION_ERROR', 400);

    const existing = await Milestone.findById(req.params.id);
    if (!existing) return error(res, 'Milestone not found', 'NOT_FOUND', 404);

    const updated = await Milestone.findByIdAndUpdate(req.params.id, value, { new: true });
    await auditSvc.record({ adminId: req.user?.id, action: 'MILESTONE_UPDATED', previousValue: existing.toObject(), newValue: updated.toObject() });
    return success(res, { milestone: updated }, 'Milestone updated');
  } catch (err) { return error(res, err.message, 'UPDATE_FAILED', 500); }
};

const deleteMilestone = async (req, res) => {
  try {
    const existing = await Milestone.findById(req.params.id);
    if (!existing) return error(res, 'Milestone not found', 'NOT_FOUND', 404);
    await Milestone.findByIdAndDelete(req.params.id);
    await auditSvc.record({ adminId: req.user?.id, action: 'MILESTONE_DELETED', previousValue: existing.toObject() });
    return success(res, {}, 'Milestone deleted');
  } catch (err) { return error(res, err.message, 'DELETE_FAILED', 500); }
};

// ── Achievement CRUD ──────────────────────────────────────────────────────────
const getAchievementsAdmin = async (req, res) => {
  try {
    const filter = {};
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
    if (req.query.type) filter.type = req.query.type;
    const achievements = await Achievement.find(filter).sort({ 'criteria.value': 1 });
    return success(res, { achievements, count: achievements.length }, 'Achievements retrieved');
  } catch (err) { return error(res, err.message, 'FETCH_FAILED', 500); }
};

const createAchievement = async (req, res) => {
  try {
    const { value, validationError } = validate(validators.achievementCreate, req.body);
    if (validationError) return error(res, validationError, 'VALIDATION_ERROR', 400);

    const existing = await Achievement.findOne({ name: value.name });
    if (existing) return error(res, 'Achievement with this name already exists', 'DUPLICATE', 409);

    const achievement = await Achievement.create(value);
    await auditSvc.record({ adminId: req.user?.id, action: 'ACHIEVEMENT_CREATED', newValue: achievement.toObject() });
    return success(res, { achievement }, 'Achievement created', 201);
  } catch (err) { return error(res, err.message, 'CREATE_FAILED', 500); }
};

const updateAchievement = async (req, res) => {
  try {
    const { value, validationError } = validate(validators.achievementUpdate, req.body);
    if (validationError) return error(res, validationError, 'VALIDATION_ERROR', 400);

    const existing = await Achievement.findById(req.params.id);
    if (!existing) return error(res, 'Achievement not found', 'NOT_FOUND', 404);

    const updated = await Achievement.findByIdAndUpdate(req.params.id, value, { new: true });
    await auditSvc.record({ adminId: req.user?.id, action: 'ACHIEVEMENT_UPDATED', previousValue: existing.toObject(), newValue: updated.toObject() });
    return success(res, { achievement: updated }, 'Achievement updated');
  } catch (err) { return error(res, err.message, 'UPDATE_FAILED', 500); }
};

const deleteAchievement = async (req, res) => {
  try {
    const existing = await Achievement.findById(req.params.id);
    if (!existing) return error(res, 'Achievement not found', 'NOT_FOUND', 404);
    await Achievement.findByIdAndDelete(req.params.id);
    await auditSvc.record({ adminId: req.user?.id, action: 'ACHIEVEMENT_DELETED', previousValue: existing.toObject() });
    return success(res, {}, 'Achievement deleted');
  } catch (err) { return error(res, err.message, 'DELETE_FAILED', 500); }
};

// ── Manual XP Award ───────────────────────────────────────────────────────────
const manualAward = async (req, res) => {
  try {
    const { value, validationError } = validate(validators.manualAward, req.body);
    if (validationError) return error(res, validationError, 'VALIDATION_ERROR', 400);

    const student = await User.findById(value.studentId);
    if (!student || student.role !== 'student') return error(res, 'Student not found', 'NOT_FOUND', 404);

    const result = await xpService.awardXP({
      studentId:  value.studentId,
      xp:         value.xp,
      reason:     value.reason,
      type:       'MANUAL',
      activityId: value.activityId || null,
      awardedBy:  req.user?.id,
    });

    await auditSvc.record({
      adminId:         req.user?.id,
      action:          'MANUAL_XP_AWARD',
      targetStudentId: value.studentId,
      newValue:        { xp: value.xp, reason: value.reason },
      reason:          value.reason,
    });

    return success(res, result, `Manual XP award of ${value.xp} XP applied to ${student.name}`);
  } catch (err) { return error(res, err.message, 'MANUAL_AWARD_FAILED', 500); }
};

// ── Participation Monitoring ──────────────────────────────────────────────────
const getParticipation = async (req, res) => {
  try {
    const { value, validationError } = validate(validators.participationQuery, req.query);
    if (validationError) return error(res, validationError, 'VALIDATION_ERROR', 400);

    const data = await participationSvc.getParticipationSummary(value);
    return success(res, data, 'Participation data retrieved');
  } catch (err) { return error(res, err.message, 'FETCH_FAILED', 500); }
};

const getGamificationSummary = async (req, res) => {
  try {
    const data = await participationSvc.getGamificationSummary();
    return success(res, data, 'Gamification summary retrieved');
  } catch (err) { return error(res, err.message, 'FETCH_FAILED', 500); }
};

// ── XP Transactions Query ─────────────────────────────────────────────────────
const getXPTransactions = async (req, res) => {
  try {
    const { value, validationError } = validate(validators.transactionQuery, req.query);
    if (validationError) return error(res, validationError, 'VALIDATION_ERROR', 400);

    const filter = {};
    if (value.studentId) filter.studentId = value.studentId;
    if (value.type)      filter.type      = value.type;
    if (value.dateFrom || value.dateTo) {
      filter.createdAt = {};
      if (value.dateFrom) filter.createdAt.$gte = new Date(value.dateFrom);
      if (value.dateTo)   filter.createdAt.$lte = new Date(value.dateTo);
    }

    const [transactions, total] = await Promise.all([
      XPTransaction.find(filter)
        .sort({ createdAt: -1 })
        .skip((value.page - 1) * value.limit)
        .limit(value.limit)
        .populate('studentId',  'name email')
        .populate('activityId', 'title type')
        .populate('awardedBy',  'name'),
      XPTransaction.countDocuments(filter),
    ]);

    return success(res, { transactions, total, page: value.page, limit: value.limit }, 'XP transactions retrieved');
  } catch (err) { return error(res, err.message, 'FETCH_FAILED', 500); }
};

// ── Audit Log Query ───────────────────────────────────────────────────────────
const getAuditLog = async (req, res) => {
  try {
    const { adminId, action, targetStudentId, submissionId, dateFrom, dateTo, page = 1, limit = 20 } = req.query;
    const result = await auditSvc.query({ adminId, action, targetStudentId, submissionId, dateFrom, dateTo, page: +page, limit: +limit });
    return success(res, result, 'Audit log retrieved');
  } catch (err) { return error(res, err.message, 'FETCH_FAILED', 500); }
};

module.exports = {
  getXPSettings, createXPSettings, updateXPSettings, deleteXPSettings,
  getLevelDefinitions, createLevelDefinition, updateLevelDefinition, deleteLevelDefinition,
  getMilestonesAdmin, createMilestone, updateMilestone, deleteMilestone,
  getAchievementsAdmin, createAchievement, updateAchievement, deleteAchievement,
  manualAward,
  getParticipation, getGamificationSummary,
  getXPTransactions, getAuditLog,
};
