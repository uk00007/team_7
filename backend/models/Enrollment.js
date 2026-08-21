const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  activityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity', required: true },
  status: {
    type: String,
    enum: ['ENROLLED', 'IN_PROGRESS', 'SUBMITTED', 'UNDER_REVIEW', 'COMPLETED', 'REJECTED'],
    default: 'ENROLLED',
  },
  progress: { type: Number, default: 0 },
  enrolledAt: { type: Date, default: Date.now },
  submittedAt: { type: Date, default: null },
  completedAt: { type: Date, default: null },
});

enrollmentSchema.index({ studentId: 1, activityId: 1 });
enrollmentSchema.index({ status: 1 });

module.exports = mongoose.models.Enrollment || mongoose.model('Enrollment', enrollmentSchema);
