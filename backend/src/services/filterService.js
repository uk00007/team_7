// Reusable functions turning query params into MongoDB filter objects, so Analytics/Reports/Admin
// routes can compose filters instead of hand-rolling find() queries.

function buildStudentFilter({ studentId, userId } = {}) {
  const filter = {};
  const id = studentId || userId;
  if (id) filter.userId = id;
  return filter;
}

function buildTeamFilter({ teamId } = {}) {
  const filter = {};
  if (teamId) filter.teamId = teamId;
  return filter;
}

function buildActivityFilter({ activityId } = {}) {
  const filter = {};
  if (activityId) filter.activityId = activityId;
  return filter;
}

function buildActivityTypeFilter({ activityType } = {}) {
  const filter = {};
  if (activityType) filter.type = activityType;
  return filter;
}

function buildStatusFilter({ status } = {}) {
  const filter = {};
  if (status) filter.status = status;
  return filter;
}

function buildDateRangeFilter({ startDate, endDate } = {}, field = 'createdAt') {
  const filter = {};
  if (startDate || endDate) {
    filter[field] = {};
    if (startDate) filter[field].$gte = new Date(startDate);
    if (endDate) filter[field].$lte = new Date(endDate);
  }
  return filter;
}

function buildScoreFilter({ minScore, maxScore } = {}, field = 'score') {
  const filter = {};
  if (minScore !== undefined || maxScore !== undefined) {
    filter[field] = {};
    if (minScore !== undefined) filter[field].$gte = Number(minScore);
    if (maxScore !== undefined) filter[field].$lte = Number(maxScore);
  }
  return filter;
}

function buildXPFilter({ minXP, maxXP } = {}, field = 'xp') {
  const filter = {};
  if (minXP !== undefined || maxXP !== undefined) {
    filter[field] = {};
    if (minXP !== undefined) filter[field].$gte = Number(minXP);
    if (maxXP !== undefined) filter[field].$lte = Number(maxXP);
  }
  return filter;
}

function mergeFilters(...filters) {
  return Object.assign({}, ...filters);
}

module.exports = {
  buildStudentFilter,
  buildTeamFilter,
  buildActivityFilter,
  buildActivityTypeFilter,
  buildStatusFilter,
  buildDateRangeFilter,
  buildScoreFilter,
  buildXPFilter,
  mergeFilters,
};
