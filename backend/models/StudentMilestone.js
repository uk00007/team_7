const mongoose = require('mongoose');

const studentMilestoneSchema = new mongoose.Schema(
  {
    studentId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User',      required: true },
    milestoneId: { type: mongoose.Schema.Types.ObjectId, ref: 'Milestone', required: true },
    progress:    { type: Number, default: 0 },     // current progress value (e.g. 7 out of 10)
    target:      { type: Number, required: true },  // copied from milestone.criteria.value at unlock time
    isCompleted: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

studentMilestoneSchema.index({ studentId: 1, milestoneId: 1 }, { unique: true });
studentMilestoneSchema.index({ studentId: 1, isCompleted: 1 });

module.exports = mongoose.models.StudentMilestone || mongoose.model('StudentMilestone', studentMilestoneSchema);
