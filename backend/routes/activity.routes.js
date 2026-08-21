const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activity.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');

router.get('/', protect, activityController.getAll);
router.get('/:id', protect, activityController.getById);
router.post('/', protect, adminOnly, activityController.create);
router.put('/:id', protect, adminOnly, activityController.update);
router.delete('/:id', protect, adminOnly, activityController.remove);

module.exports = router;
