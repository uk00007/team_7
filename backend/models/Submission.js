const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema(
  {
    activityId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Activity', required: true },
    studentId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User',     required: true },
    teamId:           { type: mongoose.Schema.Types.ObjectId, ref: 'Team',     default: null },
    content:          { type: String, default: '' },
    attachmentUrl:    { type: String, default: null },
    certificateUrl:   { type: String, default: null },

    // Review fields — written by gamification review endpoint
    status:           {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'NEEDS_REVISION', 'REVIEW_PENDING_CONFIRMATION'],
      default: 'PENDING',
    },
    score:            { type: Number, default: null, min: 0, max: 100 },
    xpAwarded:        { type: Number, default: 0, min: 0 },
    reviewerId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewerFeedback: { type: String, default: null },
    reviewedAt:       { type: Date, default: null },
    submittedAt:      { type: Date, default: Date.now },
    // Two-step review fields
    pendingXP:        { type: Number, default: null },     // individual XP preview (step 1)
    pendingTeamXP:    { type: Number, default: null },     // team XP preview (step 1)
    reviewStep:       { type: String, enum: ['NONE', 'CALCULATED', 'CONFIRMED'], default: 'NONE' },
  },
  { timestamps: true }
);

submissionSchema.index({ studentId: 1, status: 1 });
submissionSchema.index({ activityId: 1, status: 1 });

module.exports = mongoose.models.Submission || mongoose.model('Submission', submissionSchema);
