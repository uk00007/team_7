const jwt = require('jsonwebtoken');
const User = require('../models/User');

const TOKEN_EXPIRY = '7d';

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

function toPublicUser(user) {
  return { id: user._id, name: user.name, email: user.email, role: user.role };
}

async function register({ name, email, password, role }) {
  const existing = await User.findOne({ email });
  if (existing) {
    throw Object.assign(new Error('Email is already registered'), { statusCode: 409 });
  }

  const user = await User.create({ name, email, password, role });
  return { token: signToken(user), user: toPublicUser(user) };
}

async function login({ email, password }) {
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw Object.assign(new Error('Invalid email or password'), { statusCode: 401 });
  }

  return { token: signToken(user), user: toPublicUser(user) };
}

module.exports = { register, login };
