const jwt = require('jsonwebtoken');
const { error } = require('../utils/response');

const DEV_MODE = process.env.NODE_ENV !== 'production';

const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET || 'dev_secret');
      req.user = decoded;
      return next();
    } catch (err) {
      return error(res, 'Invalid or expired token', 'UNAUTHORIZED', 401);
    }
  }

  if (DEV_MODE) {
    req.user = req.user || {
      id:    req.headers['x-dev-user-id']   || 'dev-user-id',
      role:  req.headers['x-dev-user-role'] || 'admin',
      name:  'Dev User',
      email: 'dev@katalyst.com',
    };
    return next();
  }

  return error(res, 'No token provided', 'UNAUTHORIZED', 401);
};

const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return error(res, 'Admin access required', 'FORBIDDEN', 403);
  }
  next();
};

module.exports = { protect, adminOnly };
