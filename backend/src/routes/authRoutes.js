const express = require('express');
const Joi = require('joi');
const router = express.Router();

const { validateRequest } = require('../middleware');
const authController = require('../controllers/authController');

const registerSchema = Joi.object({
  name: Joi.string().min(2).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('STUDENT', 'ADMIN').default('STUDENT'),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

router.post('/register', validateRequest(registerSchema), authController.register);
router.post('/login', validateRequest(loginSchema), authController.login);

const authenticate = require('../middleware/authMiddleware');
const User = require('../models/User');

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) return res.fail('User not found', 'NOT_FOUND', 404);
    res.success({ id: user._id, name: user.name, email: user.email, role: user.role }, 'Current user fetched');
  } catch (err) { next(err); }
});

router.post('/logout', authenticate, (req, res) => {
  res.success(null, 'Logged out successfully');
});

module.exports = router;
