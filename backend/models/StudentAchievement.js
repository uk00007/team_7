const mongoose = require('mongoose');

const studentAchievementSchema = new mongoose.Schema(
  {
    studentId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User',        required: true },
    achievementId: { type: mongoose.Schema.Types.ObjectId, ref: 'Achievement',  required: true },
    unlockedAt:    { type: Date, default: Date.now },
    progress:      { type: Number, default: 100 }, // 0-100, 100 = unlocked
  },
  { timestamps: true }
);

// Prevent duplicate unlocks
studentAchievementSchema.index({ studentId: 1, achievementId: 1 }, { unique: true });
studentAchievementSchema.index({ studentId: 1, unlockedAt: -1 });

module.exports = mongoose.models.StudentAchievement || mongoose.model('StudentAchievement', studentAchievementSchema);
