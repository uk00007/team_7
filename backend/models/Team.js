
const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    memberIds:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    totalXP:     { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

teamSchema.index({ totalXP: -1 });

module.exports = mongoose.models.Team || mongoose.model('Team', teamSchema);
