const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
  activityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity', required: true },
  title: { type: String, required: true },
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
  maxScore: { type: Number, default: 100 },
  xp: { type: Number, default: 0 },
  passingScore: { type: Number, default: 50 },
});

module.exports = mongoose.models.Quiz || mongoose.model('Quiz', quizSchema);
