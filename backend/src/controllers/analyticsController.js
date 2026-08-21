// Analytics Controller
// Parth — Analytics & Reporting Module

const analyticsService = require('../services/analyticsService');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * GET /api/analytics/student/:studentId
 * Full student dashboard — all metrics
 */
exports.getStudentDashboard = async (req, res) => {
  try {
    const { studentId } = req.params;
    const data = await analyticsService.getStudentDashboard(studentId);
    return sendSuccess(res, 'Student analytics fetched successfully', data);
  } catch (err) {
    return sendError(res, err.message, 'STUDENT_ANALYTICS_ERROR', err.message === 'Student not found' ? 404 : 500);
  }
};

/**
 * GET /api/analytics/student/:studentId/graphs
 * All graph-ready data for student dashboard charts
 * Query params: ?year=2026
 */
exports.getStudentGraphs = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { year } = req.query;
    const data = await analyticsService.getStudentGraphs(studentId, year ? parseInt(year) : undefined);
    return sendSuccess(res, 'Student graph data fetched successfully', data);
  } catch (err) {
    return sendError(res, err.message, 'STUDENT_GRAPHS_ERROR');
  }
};

/**
 * GET /api/analytics/student/:studentId/graphs/monthly-xp
 * Monthly XP graph for a specific student
 */
exports.getStudentMonthlyXPGraph = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { year } = req.query;
    const data = await analyticsService.getStudentMonthlyXPGraph(studentId, year ? parseInt(year) : undefined);
    return sendSuccess(res, 'Monthly XP graph data fetched', data);
  } catch (err) {
    return sendError(res, err.message, 'MONTHLY_XP_GRAPH_ERROR');
  }
};

/**
 * GET /api/analytics/student/:studentId/graphs/yearly-xp
 */
exports.getStudentYearlyXPGraph = async (req, res) => {
  try {
    const { studentId } = req.params;
    const data = await analyticsService.getStudentYearlyXPGraph(studentId);
    return sendSuccess(res, 'Yearly XP graph data fetched', data);
  } catch (err) {
    return sendError(res, err.message, 'YEARLY_XP_GRAPH_ERROR');
  }
};

/**
 * GET /api/analytics/student/:studentId/graphs/activity-completion
 */
exports.getStudentActivityCompletionGraph = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { year } = req.query;
    const data = await analyticsService.getStudentActivityCompletionGraph(studentId, year ? parseInt(year) : undefined);
    return sendSuccess(res, 'Activity completion graph data fetched', data);
  } catch (err) {
    return sendError(res, err.message, 'ACTIVITY_COMPLETION_GRAPH_ERROR');
  }
};

/**
 * GET /api/analytics/student/:studentId/graphs/scores
 */
exports.getStudentScoresGraph = async (req, res) => {
  try {
    const { studentId } = req.params;
    const data = await analyticsService.getStudentScoresGraph(studentId);
    return sendSuccess(res, 'Scores graph data fetched', data);
  } catch (err) {
    return sendError(res, err.message, 'SCORES_GRAPH_ERROR');
  }
};

/**
 * GET /api/analytics/student/:studentId/graphs/contribution
 */
exports.getStudentContributionGraph = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { year } = req.query;
    const data = await analyticsService.getStudentContributionGraph(studentId, year ? parseInt(year) : undefined);
    return sendSuccess(res, 'Contribution graph data fetched', data);
  } catch (err) {
    return sendError(res, err.message, 'CONTRIBUTION_GRAPH_ERROR');
  }
};

/**
 * GET /api/analytics/student/:studentId/graphs/streak
 */
exports.getStudentStreakGraph = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { year } = req.query;
    const data = await analyticsService.getStudentStreakGraph(studentId, year ? parseInt(year) : undefined);
    return sendSuccess(res, 'Streak graph data fetched', data);
  } catch (err) {
    return sendError(res, err.message, 'STREAK_GRAPH_ERROR');
  }
};

/**
 * GET /api/analytics/student/:studentId/graphs/category-performance
 */
exports.getStudentCategoryPerformanceGraph = async (req, res) => {
  try {
    const { studentId } = req.params;
    const data = await analyticsService.getStudentCategoryPerformanceGraph(studentId);
    return sendSuccess(res, 'Category performance graph data fetched', data);
  } catch (err) {
    return sendError(res, err.message, 'CATEGORY_PERFORMANCE_GRAPH_ERROR');
  }
};

/**
 * GET /api/analytics/admin
 * Full admin dashboard — all platform-wide metrics
 */
exports.getAdminDashboard = async (req, res) => {
  try {
    const data = await analyticsService.getAdminDashboard();
    return sendSuccess(res, 'Admin analytics fetched successfully', data);
  } catch (err) {
    return sendError(res, err.message, 'ADMIN_ANALYTICS_ERROR');
  }
};

/**
 * GET /api/analytics/team/:teamId
 * Team analytics
 */
exports.getTeamAnalytics = async (req, res) => {
  try {
    const { teamId } = req.params;
    const data = await analyticsService.getTeamAnalytics(teamId);
    return sendSuccess(res, 'Team analytics fetched successfully', data);
  } catch (err) {
    return sendError(res, err.message, 'TEAM_ANALYTICS_ERROR', err.message === 'Team not found' ? 404 : 500);
  }
};

/**
 * GET /api/analytics/activity/:activityId
 * Activity analytics
 */
exports.getActivityAnalytics = async (req, res) => {
  try {
    const { activityId } = req.params;
    const data = await analyticsService.getActivityAnalytics(activityId);
    return sendSuccess(res, 'Activity analytics fetched successfully', data);
  } catch (err) {
    return sendError(res, err.message, 'ACTIVITY_ANALYTICS_ERROR', err.message === 'Activity not found' ? 404 : 500);
  }
};

/**
 * GET /api/analytics/participation
 * Participation KPIs for management (tracks 25%/20%/80% targets)
 */
exports.getParticipationAnalytics = async (req, res) => {
  try {
    const data = await analyticsService.getParticipationAnalytics();
    return sendSuccess(res, 'Participation analytics fetched successfully', data);
  } catch (err) {
    return sendError(res, err.message, 'PARTICIPATION_ANALYTICS_ERROR');
  }
};
