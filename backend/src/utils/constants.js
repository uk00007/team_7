// Shared constants — status values and enums
// All modules must use these instead of hardcoding strings

const ENROLLMENT_STATUS = {
  ENROLLED: 'ENROLLED',
  IN_PROGRESS: 'IN_PROGRESS',
  SUBMITTED: 'SUBMITTED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  COMPLETED: 'COMPLETED',
  REJECTED: 'REJECTED',
};

const SUBMISSION_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
};

const CERTIFICATE_STATUS = {
  PENDING: 'PENDING',
  UNDER_REVIEW: 'UNDER_REVIEW',
  VALIDATED: 'VALIDATED',
  REJECTED: 'REJECTED',
};

const ACTIVITY_TYPES = [
  'TRAINING',
  'COURSE',
  'MENTORING',
  'PROJECT',
  'ASSIGNMENT',
  'QUIZ',
  'PUZZLE',
  'CERTIFICATE',
  'MILESTONE',
];

const USER_ROLES = {
  STUDENT: 'STUDENT',
  ADMIN: 'ADMIN',
};

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

module.exports = {
  ENROLLMENT_STATUS,
  SUBMISSION_STATUS,
  CERTIFICATE_STATUS,
  ACTIVITY_TYPES,
  USER_ROLES,
  MONTH_LABELS,
};
