const xpSettingsSvc = require('./xpSettingsService');

/**
 * Calculates XP based on score, activity, reward configuration,
 * completion status, individual contribution, and team contribution.
 *
 * @param {object} params
 * @param {number} params.score            - Score achieved (0-100)
 * @param {string} params.activityType     - TRAINING, COURSE, MENTORING, COACHING, PROJECT, ASSIGNMENT, QUIZ, PUZZLE, CERTIFICATE, MILESTONE
 * @param {number} [params.maxXP]          - Maximum XP override from activity
 * @param {boolean} [params.isCompleted=true] - Whether the activity is completed/passed
 * @param {number} [params.individualContribution=100] - Percentage or weight of individual contribution (0-100)
 * @returns {Promise<{ xp: number, teamXP: number, breakdown: object }>}
 */
const calculateScoreXP = async ({
  score,
  activityType,
  maxXP = null,
  isCompleted = true,
  individualContribution = 100,
}) => {
  if (score < 0 || score > 100) {
    throw new Error('Score must be between 0 and 100');
  }

  const result = await xpSettingsSvc.calculateXP(score, activityType, maxXP);

  // Apply individual contribution percentage if activity is team-based
  let individualXP = result.xp;
  if (individualContribution !== 100 && individualContribution >= 0) {
    individualXP = Math.round(individualXP * (individualContribution / 100));
  }

  return {
    xp: individualXP,
    teamXP: result.teamXP,
    breakdown: {
      ...result.breakdown,
      individualContribution,
      isCompleted,
    },
  };
};

module.exports = {
  calculateScoreXP,
};
