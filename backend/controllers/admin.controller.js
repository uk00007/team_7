const adminGamificationCtrl = require('./adminGamification.controller');
const reviewCtrl = require('./review.controller');

module.exports = {
  ...adminGamificationCtrl,
  ...reviewCtrl,
};
