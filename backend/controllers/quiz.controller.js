const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const Activity = require('../models/Activity');
const Submission = require('../models/Submission');
const xpService = require('../services/xpService');
const { success, error } = require('../utils/response');

const getQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const quiz = await Quiz.findById(id).populate('questions');
    if (!quiz) return error(res, 'Quiz not found', 'NOT_FOUND', 404);

    // Hide correctAnswer from student response
    const questionsSanitized = quiz.questions.map((q) => ({
      _id: q._id,
      question: q.question,
      options: q.options,
      points: q.points,
    }));

    return success(res, {
      _id: quiz._id,
      activityId: quiz.activityId,
      title: quiz.title,
      maxScore: quiz.maxScore,
      xp: quiz.xp,
      passingScore: quiz.passingScore,
      questions: questionsSanitized,
    });
  } catch (err) {
    return error(res, err.message, 'SERVER_ERROR', 500);
  }
};

const createQuiz = async (req, res) => {
  try {
    const { activityId, title, questions = [], maxScore = 100, xp = 50, passingScore = 50 } = req.body;
    if (!activityId || !title) return error(res, 'activityId and title are required', 'VALIDATION_ERROR', 400);

    const questionIds = [];
    for (const q of questions) {
      const createdQ = await Question.create(q);
      questionIds.push(createdQ._id);
    }

    const quiz = await Quiz.create({
      activityId,
      title,
      questions: questionIds,
      maxScore,
      xp,
      passingScore,
    });

    return success(res, quiz, 'Quiz created successfully', 201);
  } catch (err) {
    return error(res, err.message, 'SERVER_ERROR', 500);
  }
};

const submitQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const { answers = [] } = req.body; // Array of { questionId, answer }
    const studentId = req.user?.id || req.user?._id;

    const quiz = await Quiz.findById(id).populate('questions');
    if (!quiz) return error(res, 'Quiz not found', 'NOT_FOUND', 404);

    let earnedPoints = 0;
    let totalPoints = 0;

    for (const q of quiz.questions) {
      totalPoints += q.points || 1;
      const studentAns = answers.find((a) => a.questionId?.toString() === q._id?.toString());
      if (studentAns && studentAns.answer === q.correctAnswer) {
        earnedPoints += q.points || 1;
      }
    }

    const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const passed = score >= (quiz.passingScore || 50);

    let xpAwarded = 0;
    let xpResult = null;

    if (passed && quiz.xp > 0) {
      xpAwarded = Math.round((score / 100) * quiz.xp);
      xpResult = await xpService.awardXP({
        studentId,
        activityId: quiz.activityId,
        xp: xpAwarded,
        reason: `Passed quiz: ${quiz.title} (${score}%)`,
        type: 'ACTIVITY',
      });
    }

    const submission = await Submission.create({
      activityId: quiz.activityId,
      studentId,
      status: passed ? 'APPROVED' : 'REJECTED',
      score,
      xpAwarded,
      reviewerFeedback: passed ? `Quiz passed with score ${score}%` : `Quiz failed with score ${score}%`,
      reviewedAt: new Date(),
    });

    return success(res, {
      score,
      passed,
      earnedPoints,
      totalPoints,
      xpAwarded,
      xpResult,
      submissionId: submission._id,
    }, passed ? 'Quiz passed!' : 'Quiz not passed');
  } catch (err) {
    return error(res, err.message, 'SERVER_ERROR', 500);
  }
};

module.exports = { getQuiz, createQuiz, submitQuiz };
