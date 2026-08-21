const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String }],
  correctAnswer: { type: String, required: true },
  points: { type: Number, default: 1 },
  explanation: { type: String, default: '' },
});

module.exports = mongoose.models.Question || mongoose.model('Question', questionSchema);
