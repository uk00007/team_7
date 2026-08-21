// Report Controller
// Parth — Analytics & Reporting Module

const reportService = require('../services/reportService');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * GET /api/reports/student/:studentId
 * Generate individual student report
 * Query params: ?month=8&year=2026&type=COURSE&status=COMPLETED&scoreMin=50&scoreMax=100
 */
exports.getStudentReport = async (req, res) => {
  try {
    const { studentId } = req.params;
    const filters = req.query;
    const data = await reportService.generateStudentReport(studentId, filters);
    return sendSuccess(res, 'Student report generated successfully', data);
  } catch (err) {
    return sendError(res, err.message, 'STUDENT_REPORT_ERROR', err.message === 'Student not found' ? 404 : 500);
  }
};

/**
 * GET /api/reports/team/:teamId
 * Generate team report
 * Query params: ?month=8&year=2026&type=COURSE&status=COMPLETED
 */
exports.getTeamReport = async (req, res) => {
  try {
    const { teamId } = req.params;
    const filters = req.query;
    const data = await reportService.generateTeamReport(teamId, filters);
    return sendSuccess(res, 'Team report generated successfully', data);
  } catch (err) {
    return sendError(res, err.message, 'TEAM_REPORT_ERROR', err.message === 'Team not found' ? 404 : 500);
  }
};

/**
 * GET /api/reports
 * General report with all filters
 * Query params: ?studentId=...&teamId=...&activityId=...&type=COURSE&month=8&year=2026&status=COMPLETED&scoreMin=50&scoreMax=100
 */
exports.getReport = async (req, res) => {
  try {
    const filters = req.query;
    const data = await reportService.generateReport(filters);
    return sendSuccess(res, 'Report generated successfully', data);
  } catch (err) {
    return sendError(res, err.message, 'REPORT_ERROR');
  }
};

/**
 * GET /api/reports/leaderboard
 * Leaderboard report
 * Query params: ?month=8&year=2026&teamId=...&limit=20
 */
exports.getLeaderboardReport = async (req, res) => {
  try {
    const filters = req.query;
    const data = await reportService.generateLeaderboardReport(filters);
    return sendSuccess(res, 'Leaderboard report generated successfully', data);
  } catch (err) {
    return sendError(res, err.message, 'LEADERBOARD_REPORT_ERROR');
  }
};
