// RBAC based on req.user.role, populated by authMiddleware.
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.fail('You do not have permission to perform this action', 'Forbidden', 403);
    }
    next();
  };
}

module.exports = authorize;
