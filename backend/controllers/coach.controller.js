const coachService = require('../src/services/coachService');
const Activity = require('../models/Activity');
const User = require('../models/User');
const { success, error } = require('../utils/response');

const getRecommendations = async (req, res) => {
  try {
    const studentId = req.user?.id || req.user?._id;

    try {
      const recommendations = await coachService.getRecommendations(studentId);
      return success(res, recommendations);
    } catch (aiErr) {
      // Graceful fallback when Python microservice is offline
      const user = await User.findById(studentId);
      const activities = await Activity.find({ status: { $in: ['PUBLISHED', 'ACTIVE'] } }).limit(5);

      const fallbackRecommendations = {
        studentId,
        studentName: user ? user.name : 'Student',
        currentLevel: user ? user.currentLevel : 1,
        totalXP: user ? user.totalXP : 0,
        recommendedActivities: activities.map((act) => ({
          id: act._id,
          title: act.title,
          type: act.type,
          maxXP: act.maxXP,
          isMandatory: act.isMandatory,
          reason: act.isMandatory ? 'Mandatory activity' : 'Recommended for XP boost',
        })),
        coachingTip: 'Keep up your daily streak and complete pending activities to level up!',
        source: 'rule-based-fallback',
      };

      return success(res, fallbackRecommendations);
    }
  } catch (err) {
    return error(res, err.message, 'SERVER_ERROR', 500);
  }
};

module.exports = { getRecommendations };
