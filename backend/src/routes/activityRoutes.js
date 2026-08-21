const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');
const Activity = require('../models/Activity');

// GET /api/activities — list all published activities (with optional filters)
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { type, isMandatory, search, status } = req.query;
    const filter = { status: status || 'PUBLISHED' };
    if (type) filter.type = type;
    if (isMandatory !== undefined) filter.isMandatory = isMandatory === 'true';
    if (search) filter.title = { $regex: search, $options: 'i' };
    const activities = await Activity.find(filter).sort({ createdAt: -1 }).lean();
    res.success(activities, 'Activities fetched');
  } catch (err) { next(err); }
});

// GET /api/activities/:id
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const activity = await Activity.findById(req.params.id).lean();
    if (!activity) return res.fail('Activity not found', 'NOT_FOUND', 404);
    res.success(activity, 'Activity fetched');
  } catch (err) { next(err); }
});

// POST /api/activities — admin create
router.post('/', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const activity = await Activity.create({ ...req.body, createdBy: req.user.id });
    res.success(activity, 'Activity created', 201);
  } catch (err) { next(err); }
});

// PUT /api/activities/:id — admin update
router.put('/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const activity = await Activity.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!activity) return res.fail('Activity not found', 'NOT_FOUND', 404);
    res.success(activity, 'Activity updated');
  } catch (err) { next(err); }
});

// DELETE /api/activities/:id — admin delete
router.delete('/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const activity = await Activity.findByIdAndDelete(req.params.id);
    if (!activity) return res.fail('Activity not found', 'NOT_FOUND', 404);
    res.success(null, 'Activity deleted');
  } catch (err) { next(err); }
});

module.exports = router;
