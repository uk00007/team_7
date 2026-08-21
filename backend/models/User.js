const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name:          { type: String, required: true, trim: true },
    email:         { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:      { type: String, required: true, select: false },
    role:          { type: String, enum: ['student', 'admin'], default: 'student' },
    teamId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },

    totalXP:       { type: Number, default: 0, min: 0 },
    currentLevel:  { type: Number, default: 1, min: 1 },
    currentStreak: { type: Number, default: 0, min: 0 },
    longestStreak: { type: Number, default: 0, min: 0 },
    lastActivityDate: { type: Date, default: null }, // used for streak calculation
  },
  { timestamps: true }
);

// Index for leaderboard queries
userSchema.index({ totalXP: -1 });
userSchema.index({ role: 1, totalXP: -1 });

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
