const success = (res, data = {}, message = 'Operation successful', statusCode = 200) =>
  res.status(statusCode).json({ success: true, message, data });

const error = (res, message = 'Something went wrong', errorCode = 'INTERNAL_ERROR', statusCode = 500) =>
  res.status(statusCode).json({ success: false, message, error: errorCode });

module.exports = { success, error };
