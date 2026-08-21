const jwt = require('jsonwebtoken');

// Verifies the JWT issued by the auth service. Expected payload shape: { id, role }.
function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.fail('No token provided', 'Unauthorized', 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (err) {
    return res.fail('Invalid or expired token', 'Unauthorized', 401);
  }
}

module.exports = authenticate;
