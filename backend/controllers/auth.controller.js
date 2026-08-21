const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { success, error } = require('../utils/response');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

const register = async (req, res) => {
  try {
    const { name, email, password, role = 'student' } = req.body;
    if (!name || !email || !password) {
      return error(res, 'Name, email, and password are required', 'VALIDATION_ERROR', 400);
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return error(res, 'Email already in use', 'CONFLICT', 409);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: role.toLowerCase() === 'admin' ? 'admin' : 'student',
      totalXP: 0,
      currentLevel: 1,
      currentStreak: 0,
      longestStreak: 0,
    });

    const token = jwt.sign(
      { id: user._id.toString(), email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return success(res, {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        totalXP: user.totalXP,
        currentLevel: user.currentLevel,
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
      },
    }, 'User registered successfully', 201);
  } catch (err) {
    return error(res, err.message, 'SERVER_ERROR', 500);
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return error(res, 'Email and password are required', 'VALIDATION_ERROR', 400);
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) {
      return error(res, 'Invalid credentials', 'UNAUTHORIZED', 401);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return error(res, 'Invalid credentials', 'UNAUTHORIZED', 401);
    }

    const token = jwt.sign(
      { id: user._id.toString(), email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return success(res, {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        totalXP: user.totalXP,
        currentLevel: user.currentLevel,
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        teamId: user.teamId,
      },
    }, 'Login successful');
  } catch (err) {
    return error(res, err.message, 'SERVER_ERROR', 500);
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return error(res, 'User not found', 'NOT_FOUND', 404);

    return success(res, {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      totalXP: user.totalXP,
      currentLevel: user.currentLevel,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      teamId: user.teamId,
    });
  } catch (err) {
    return error(res, err.message, 'SERVER_ERROR', 500);
  }
};

const logout = async (_req, res) => {
  return success(res, null, 'Logged out successfully');
};

module.exports = { register, login, getCurrentUser, logout };
