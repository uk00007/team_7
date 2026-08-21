const axios = require('axios');
const User = require('../models/User');
const Activity = require('../models/Activity');
const Submission = require('../models/Submission');
const { generateChatbotReply } = require('../ai/chatbot/chatbotService');

async function generateCoachReply(studentId, message) {
  return generateChatbotReply(studentId, message);
}

async function getRecommendations(userId) {
  try {
    const user = await User.findById(userId);
    const activities = await Activity.find({ status: 'ACTIVE' });

    if (!user) {
      throw new Error('User not found');
    }

    const submissions = await Submission.find({ studentId: userId, status: 'APPROVED' });
    const totalScore = submissions.reduce((sum, sub) => sum + (sub.score || 0), 0);
    const averageScore = submissions.length > 0 ? totalScore / submissions.length : 50;

    const payload = {
      student: {
        userId: user._id.toString(),
        interest_dsa: 1,
        interest_ml: 1,
        interest_cyber: 0,
        initial_exp: 3,
        totalXP: user.totalXP || 0,
        currentStreak: user.currentStreak || 0,
        average_score: averageScore,
        team_contribution_ratio: user.teamId ? 0.6 : 0.2,
      },
      available_activities: activities.map((activity) => ({
        id: activity._id.toString(),
        title: activity.title,
        type: activity.type,
        isMandatory: activity.isMandatory || false,
        maxXP: activity.maxXP || 100,
        dueDate: activity.dueDate ? activity.dueDate.toISOString() : null,
      })),
    };

    const aiResponse = await axios.post('http://127.0.0.1:8000/api/coach/recommend', payload);
    return aiResponse.data;
  } catch (error) {
    console.error('Error communicating with AI Service:', error.message);
    throw new Error('Failed to generate AI recommendations');
  }
}

module.exports = {
  generateCoachReply,
  getRecommendations,
  getProactiveRecommendation: getRecommendations,
};
