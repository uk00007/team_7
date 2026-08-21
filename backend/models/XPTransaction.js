const mongoose = require('mongoose');

const xpTransactionSchema = new mongoose.Schema(
  {
    studentId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User',       required: true },
    teamId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Team',       default: null },
    activityId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Activity',   default: null },
    submissionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Submission', default: null },
    xp:           { type: Number, required: true },   // can be negative for penalties
    reason:       { type: String, required: true },
    type:         {
      type: String,
      enum: ['ACTIVITY', 'BONUS', 'STREAK', 'TEAM', 'MANUAL', 'PENALTY'],
      required: true,
    },
    awardedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    metadata:     { type: mongoose.Schema.Types.Mixed, default: {} }, // extra context (e.g. streakDays)
  },
  { timestamps: true }
);

xpTransactionSchema.index({ studentId: 1, createdAt: -1 });
xpTransactionSchema.index({ studentId: 1, type: 1 });
xpTransactionSchema.index({ teamId: 1, createdAt: -1 });
xpTransactionSchema.index({ activityId: 1, createdAt: -1 });
xpTransactionSchema.index({ submissionId: 1, type: 1 });
xpTransactionSchema.index({ createdAt: -1 }); // for monthly/yearly leaderboards

module.exports = mongoose.models.XPTransaction || mongoose.model('XPTransaction', xpTransactionSchema);
