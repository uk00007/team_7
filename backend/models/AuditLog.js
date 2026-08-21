const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    adminId:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action:          {
      type: String,
      enum: [
        'SUBMISSION_APPROVED',
        'SUBMISSION_CONFIRMED',
        'SUBMISSION_REJECTED',
        'SUBMISSION_NEEDS_REVISION',
        'REVIEW_XP_PREVIEW',
        'MANUAL_XP_AWARD',
        'XP_SETTINGS_CREATED',
        'XP_SETTINGS_UPDATED',
        'XP_SETTINGS_DELETED',
        'LEVEL_CREATED',
        'LEVEL_UPDATED',
        'LEVEL_DELETED',
        'MILESTONE_CREATED',
        'MILESTONE_UPDATED',
        'MILESTONE_DELETED',
        'ACHIEVEMENT_CREATED',
        'ACHIEVEMENT_UPDATED',
        'ACHIEVEMENT_DELETED',
        'REWARD_RULE_CREATED',
        'REWARD_RULE_UPDATED',
        'REWARD_RULE_DELETED',
      ],
      required: true,
    },
    targetStudentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User',       default: null },
    submissionId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Submission',  default: null },
    activityId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Activity',    default: null },
    previousValue:   { type: mongoose.Schema.Types.Mixed,    default: null },
    newValue:        { type: mongoose.Schema.Types.Mixed,    default: null },
    reason:          { type: String, default: '' },
    metadata:        { type: mongoose.Schema.Types.Mixed,    default: {} },
  },
  {
    timestamps: true,
    // Audit logs are immutable — disable update operations at schema level
  }
);

auditLogSchema.index({ adminId: 1, createdAt: -1 });
auditLogSchema.index({ targetStudentId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ submissionId: 1 });

module.exports = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);
