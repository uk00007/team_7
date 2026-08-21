// Last-mounted error middleware. Formats all thrown/forwarded errors into the shared envelope.
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 ? 'Internal server error' : err.message || 'Request failed';

  console.error(`[${req.id || 'no-req-id'}]`, err.stack || err.message);

  res.fail(err.message || 'Unexpected error', message, statusCode);
}

module.exports = errorHandler;
