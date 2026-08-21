const mongoose = require('mongoose');

const levelDefinitionSchema = new mongoose.Schema(
  {
    level:       { type: Number, required: true, unique: true, min: 1 },
    title:       { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    minXP:       { type: Number, required: true, min: 0 },
    maxXP:       { type: Number, default: null },       // null = no upper bound (for max level)
    icon:        { type: String, default: '🏅' },
    badge:       { type: String, default: '' },         // asset key for frontend
    xpReward:    { type: Number, default: 0, min: 0 }, // bonus XP awarded when level is first reached
    isEnabled:   { type: Boolean, default: true },
    createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// level has unique:true which creates the index — no need for additional index()
levelDefinitionSchema.index({ minXP: 1 });


module.exports = mongoose.models.LevelDefinition || mongoose.model('LevelDefinition', levelDefinitionSchema);
