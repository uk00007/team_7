const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  activityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity', required: true },
  certificateUrl: { type: String, default: '' },
  certificateName: { type: String, default: '' },
  issuer: { type: String, default: '' },
  issueDate: { type: Date, default: null },
  status: { type: String, enum: ['PENDING', 'UNDER_REVIEW', 'VALIDATED', 'REJECTED'], default: 'PENDING' },
  validationScore: { type: Number, default: null },
  reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reviewerFeedback: { type: String, default: '' },
  xpAwarded: { type: Number, default: 0 },
}, { timestamps: true });

certificateSchema.index({ studentId: 1, status: 1 });

module.exports = mongoose.models.Certificate || mongoose.model('Certificate', certificateSchema);
