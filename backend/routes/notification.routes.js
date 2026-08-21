const express = require('express');
const router = express.Router();
const notifController = require('../controllers/notification.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/', protect, notifController.getNotifications);
router.put('/read-all', protect, notifController.markAllRead);
router.put('/:id/read', protect, notifController.markRead);

module.exports = router;
