const AuditLog = require('../models/AuditLog');

/**
 * Record a sensitive admin action.
 * @param {object} params
 * @param {string}  params.adminId
 * @param {string}  params.action            — AuditLog action enum value
 * @param {string}  [params.targetStudentId]
 * @param {string}  [params.submissionId]
 * @param {string}  [params.activityId]
 * @param {*}       [params.previousValue]
 * @param {*}       [params.newValue]
 * @param {string}  [params.reason]
 * @param {object}  [params.metadata]
 */
const record = async (params) => {
  try {
    await AuditLog.create(params);
  } catch (err) {
    // Audit failures must never break the main flow — log silently
    console.error('[AuditLog] Failed to record:', err.message);
  }
};

/**
 * Query audit logs with filters + pagination.
 */
const query = async ({ adminId, action, targetStudentId, submissionId, dateFrom, dateTo, page = 1, limit = 20 }) => {
  const filter = {};
  if (adminId)         filter.adminId         = adminId;
  if (action)          filter.action          = action;
  if (targetStudentId) filter.targetStudentId = targetStudentId;
  if (submissionId)    filter.submissionId    = submissionId;
  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
    if (dateTo)   filter.createdAt.$lte = new Date(dateTo);
  }

  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('adminId',         'name email')
      .populate('targetStudentId', 'name email')
      .populate('submissionId',    'status score')
      .populate('activityId',      'title type'),
    AuditLog.countDocuments(filter),
  ]);

  return { logs, total, page, limit };
};

module.exports = { record, query };
