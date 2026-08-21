const { error } = require('../utils/response');

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (process.env.NODE_ENV !== 'production' && !req.user) {
      return next();
    }

    if (!req.user || !roles.includes(req.user.role)) {
      return error(res, `Access denied: requires one of [${roles.join(', ')}]`, 'FORBIDDEN', 403);
    }

    next();
  };
};

const adminOnly = requireRole('admin');

module.exports = {
  requireRole,
  adminOnly,
};
