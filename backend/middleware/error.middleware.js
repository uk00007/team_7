const { error } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  console.error('[Error Middleware]:', err);

  const statusCode = err.statusCode || (err.name === 'ValidationError' ? 400 : 500);
  const message = err.message || 'Internal server error';
  const errorCode = err.code || (err.name === 'ValidationError' ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR');

  return error(res, message, errorCode, statusCode);
};

const notFoundHandler = (req, res) => {
  return error(res, `Route ${req.method} ${req.originalUrl} not found`, 'NOT_FOUND', 404);
};

module.exports = {
  errorHandler,
  notFoundHandler,
};
