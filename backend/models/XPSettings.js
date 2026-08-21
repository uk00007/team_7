const mongoose = require('mongoose');

const ACTIVITY_TYPES = ['TRAINING', 'COURSE', 'MENTORING', 'COACHING', 'PROJECT', 'ASSIGNMENT', 'QUIZ', 'PUZZLE', 'CERTIFICATE', 'MILESTONE'];

const xpSettingsSchema = new mongoose.Schema(
  {
    activityType:      { type: String, enum: ACTIVITY_TYPES, required: true, unique: true },
    baseXP:            { type: Number, required: true, min: 0 },
    maxXP:             { type: Number, required: true, min: 0 },
    passingScore:      { type: Number, required: true, min: 0, max: 100, default: 60 },
    minScoreForXP:     { type: Number, min: 0, max: 100, default: 0 },    // below this score → no XP
    bonusXP:           { type: Number, default: 0, min: 0 },              // flat bonus on top of calculated XP
    streakBonusXP:     { type: Number, default: 0, min: 0 },              // streak-eligible bonus for this activity type
    teamBonusXP:       { type: Number, default: 0, min: 0 },              // XP credited to team total (not individual)
    individualXP:      { type: Number, default: 0, min: 0 },              // guaranteed individual contribution XP
    streakEligible:    { type: Boolean, default: true },                  // does completing this count for streak?
    rewardEligible:    { type: Boolean, default: true },                  // can achievements/milestones trigger?
    allowMultipleXP:   { type: Boolean, default: false },                 // can XP be awarded more than once?
    allowRetryXP:      { type: Boolean, default: false },                 // does retrying a rejected submission earn XP?
    xpCap:             { type: Number, default: null },                   // null = no cap
    description:       { type: String, default: '' },
    isEnabled:         { type: Boolean, default: true },
    createdBy:         { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy:         { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// activityType has unique:true which creates the index — no need for additional index()
xpSettingsSchema.index({ isEnabled: 1 });


module.exports = mongoose.models.XPSettings || mongoose.model('XPSettings', xpSettingsSchema);
