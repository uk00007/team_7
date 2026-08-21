const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    title:               { type: String, required: true, trim: true },
    description:         { type: String, default: '' },
    type:                {
      type: String,
      enum: ['TRAINING', 'COURSE', 'MENTORING', 'COACHING', 'PROJECT', 'ASSIGNMENT', 'QUIZ', 'PUZZLE', 'CERTIFICATE', 'MILESTONE'],
      required: true,
    },
    category:            { type: String, default: '' },
    isMandatory:         { type: Boolean, default: false },
    isTeamBased:         { type: Boolean, default: false },
    maxXP:               { type: Number, required: true, min: 0 },
    startDate:           { type: Date, default: null },
    dueDate:             { type: Date, default: null },
    certificateRequired: { type: Boolean, default: false },
    createdBy:           { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status:              { type: String, enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'], default: 'PUBLISHED' },
  },
  { timestamps: true }
);

activitySchema.index({ type: 1, status: 1 });
activitySchema.index({ isMandatory: 1, dueDate: 1 });

module.exports = mongoose.models.Activity || mongoose.model('Activity', activitySchema);
