const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, unique: true, trim: true },
    description: { type: String, required: true },
    icon:        { type: String, default: '🎯' },
    criteria:    {
      type:     {
        type: String,
        enum: [
          'XP_TOTAL',
          'ACTIVITY_COUNT',
          'COURSE_COUNT',
          'ASSIGNMENT_COUNT',
          'QUIZ_COUNT',
          'MENTORING_COUNT',
          'CERTIFICATE_COUNT',
          'STREAK_DAYS',
          'LEVEL_REACHED',
        ],
        required: true,
      },
      value:    { type: Number, required: true },
    },
    xpReward:    { type: Number, default: 0 },
    order:       { type: Number, default: 0 }, // display order
    isActive:    { type: Boolean, default: true },
  },
  { timestamps: true }
);

milestoneSchema.index({ order: 1 });

module.exports = mongoose.models.Milestone || mongoose.model('Milestone', milestoneSchema);
