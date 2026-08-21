const Activity = require('../models/Activity');
const { success, error } = require('../utils/response');

const getAll = async (req, res) => {
  try {
    const { type, status = 'PUBLISHED', isMandatory, search, page = 1, limit = 50 } = req.query;
    const query = {};
    if (type) query.type = type.toUpperCase();
    if (status) query.status = status.toUpperCase();
    if (isMandatory !== undefined) query.isMandatory = isMandatory === 'true';
    if (search) query.title = { $regex: search, $options: 'i' };

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const [activities, total] = await Promise.all([
      Activity.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit, 10)),
      Activity.countDocuments(query),
    ]);

    return success(res, {
      activities,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        totalPages: Math.ceil(total / parseInt(limit, 10)),
      },
    });
  } catch (err) {
    return error(res, err.message, 'SERVER_ERROR', 500);
  }
};

const getById = async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) return error(res, 'Activity not found', 'NOT_FOUND', 404);
    return success(res, activity);
  } catch (err) {
    return error(res, err.message, 'SERVER_ERROR', 500);
  }
};

const create = async (req, res) => {
  try {
    const {
      title,
      description = '',
      type,
      category = 'GENERAL',
      isMandatory = false,
      isTeamBased = false,
      maxXP = 100,
      startDate = null,
      dueDate = null,
      certificateRequired = false,
      status = 'PUBLISHED',
    } = req.body;

    if (!title || !type) {
      return error(res, 'Title and type are required', 'VALIDATION_ERROR', 400);
    }

    const activity = await Activity.create({
      title,
      description,
      type: type.toUpperCase(),
      category,
      isMandatory,
      isTeamBased,
      maxXP: Number(maxXP),
      startDate,
      dueDate,
      certificateRequired,
      status: status.toUpperCase(),
      createdBy: req.user?.id || req.user?._id,
    });

    return success(res, activity, 'Activity created successfully', 201);
  } catch (err) {
    return error(res, err.message, 'SERVER_ERROR', 500);
  }
};

const update = async (req, res) => {
  try {
    const activity = await Activity.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!activity) return error(res, 'Activity not found', 'NOT_FOUND', 404);
    return success(res, activity, 'Activity updated successfully');
  } catch (err) {
    return error(res, err.message, 'SERVER_ERROR', 500);
  }
};

const remove = async (req, res) => {
  try {
    const activity = await Activity.findByIdAndDelete(req.params.id);
    if (!activity) return error(res, 'Activity not found', 'NOT_FOUND', 404);
    return success(res, { id: req.params.id }, 'Activity deleted successfully');
  } catch (err) {
    return error(res, err.message, 'SERVER_ERROR', 500);
  }
};

module.exports = { getAll, getById, create, update, remove };
