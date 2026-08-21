function formatResponse(req, res, next) {
  res.success = (data = null, message = 'Success', statusCode = 200) => {
    res.status(statusCode).json({ success: true, message, data });
  };

  res.fail = (error = 'Something went wrong', message = 'Failed', statusCode = 400) => {
    res.status(statusCode).json({ success: false, message, error });
  };

  next();
}

module.exports = formatResponse;
