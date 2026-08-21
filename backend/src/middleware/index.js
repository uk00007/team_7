const authenticate = require('./authMiddleware');
const authorize = require('./roleMiddleware');
const validateRequest = require('./validationMiddleware');
const errorHandler = require('./errorMiddleware');
const requestLogger = require('./loggerMiddleware');
const requestId = require('./requestIdMiddleware');
const rateLimiter = require('./rateLimiterMiddleware');
const formatResponse = require('./responseMiddleware');

module.exports = {
  authenticate,
  authorize,
  validateRequest,
  errorHandler,
  requestLogger,
  requestId,
  rateLimiter,
  formatResponse,
};
