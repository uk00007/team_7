const express = require('express');
const Joi = require('joi');
const router = express.Router();

const { authenticate, authorize, validateRequest } = require('../middleware');
const notificationController = require('../controllers/notificationController');

const createNotificationSchema = Joi.object({
  userId: Joi.string().required(),
  type: Joi.string()
    .valid(
      'ACTIVITY_ASSIGNED',
      'DUE_SOON',
      'OVERDUE',
      'XP_AWARDED',
      'LEVEL_UP',
      'ACHIEVEMENT',
      'STREAK',
      'CERTIFICATE',
      'TEAM',
      'SYSTEM'
    )
    .required(),
  title: Joi.string().allow('', null),
  message: Joi.string().allow('', null),
  relatedActivityId: Joi.string().allow(null),
  expiresAt: Joi.date().allow(null),
});

router.get('/', authenticate, notificationController.getNotifications);
router.put('/read-all', authenticate, notificationController.markAllRead);
router.put('/:id/read', authenticate, notificationController.markRead);
router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  validateRequest(createNotificationSchema),
  notificationController.createNotification
);

module.exports = router;
