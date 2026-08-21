const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema(
  {
    name:          { type: String, required: true, unique: true, trim: true },
    description:   { type: String, required: true },
    icon:          { type: String, default: '🏆' },
    criteria:      {
      type:         {
        type: String,
        enum: [
          'XP_TOTAL',
          'ACTIVITY_COUNT',
          'COURSE_COUNT',
          'ASSIGNMENT_COUNT',
          'QUIZ_COUNT',
          'STREAK_DAYS',
          'LEVEL_REACHED',
          'CERTIFICATE_COUNT',
          'TEAM_CONTRIBUTION',
          'ACTIVITY_TYPE',
          'FIRST_SUBMISSION',
        ],
        required: true,
      },
      value:        { type: Number, default: 1 },  // threshold value
      subtype:      { type: String, default: null }, // used when type = ACTIVITY_TYPE (e.g. 'COURSE')
    },
    xpReward:      { type: Number, default: 0, min: 0 },
    type:          {
      type: String,
      enum: ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'SPECIAL'],
      default: 'BRONZE',
    },
    isActive:      { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Achievement || mongoose.model('Achievement', achievementSchema);
