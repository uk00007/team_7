
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId:            { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type:              {
      type: String,
      enum: [
        'XP_AWARDED',
        'LEVEL_UP',
        'ACHIEVEMENT_UNLOCKED',
        'STREAK_MAINTAINED',
        'STREAK_AT_RISK',
        'STREAK_BROKEN',
        'MILESTONE_REACHED',
        'ACTIVITY_ASSIGNED',
        'DUE_DATE_APPROACHING',
        'ACTIVITY_OVERDUE',
        'CERTIFICATE_APPROVED',
        'CERTIFICATE_REJECTED',
        'TEAM_UPDATE',
        'ADMIN_ESCALATION',
        'SUBMISSION_REVIEWED',
        'GENERAL',
      ],
      required: true,
    },
    title:             { type: String, required: true },
    message:           { type: String, required: true },
    relatedActivityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity', default: null },
    isRead:            { type: Boolean, default: false },
    expiresAt:         { type: Date, default: null },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
