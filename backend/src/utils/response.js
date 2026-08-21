// Shared response helpers — standard API response format
// Used across all controllers for consistent JSON structure

/**
 * Send a success response
 * @param {object} res - Express response object
 * @param {string} message - Human-readable message
 * @param {object} data - Response payload
 * @param {number} statusCode - HTTP status (default 200)
 */
const sendSuccess = (res, message, data = {}, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Send an error response
 * @param {object} res - Express response object
 * @param {string} message - Human-readable error message
 * @param {string} error - Error code or detail
 * @param {number} statusCode - HTTP status (default 500)
 */
const sendError = (res, message, error = 'INTERNAL_ERROR', statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    message,
    error,
  });
};

/**
 * Format data into graph-friendly JSON (labels + values)
 * @param {Array} items - Array of objects
 * @param {string} labelKey - Key to use for labels
 * @param {string} valueKey - Key to use for values
 * @returns {{ labels: string[], values: number[] }}
 */
const toGraphFormat = (items, labelKey, valueKey) => {
  return {
    labels: items.map(item => item[labelKey]),
    values: items.map(item => item[valueKey]),
  };
};

module.exports = { sendSuccess, sendError, toGraphFormat };
