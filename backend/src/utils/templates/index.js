// Plain functions returning { subject, body }. Callers pass `body` straight through as the SMS
// message when using providerService.sendSMS.

function welcome({ name } = {}) {
  return {
    subject: 'Welcome to Katalyst!',
    body: `Hi ${name || 'there'}, welcome to Katalyst. Let's start learning and earning XP!`,
  };
}

function activityAssigned({ name, activityTitle } = {}) {
  return {
    subject: 'New activity assigned',
    body: `Hi ${name || 'there'}, a new activity "${activityTitle}" has been assigned to you.`,
  };
}

function dueDateReminder({ name, activityTitle, dueDate } = {}) {
  return {
    subject: 'Activity due soon',
    body: `Hi ${name || 'there'}, your activity "${activityTitle}" is due on ${dueDate}.`,
  };
}

function overdueActivity({ name, activityTitle } = {}) {
  return {
    subject: 'Activity overdue',
    body: `Hi ${name || 'there'}, your activity "${activityTitle}" is now overdue. Please complete it as soon as possible.`,
  };
}

function achievementUnlocked({ name, achievementTitle } = {}) {
  return {
    subject: 'Achievement unlocked!',
    body: `Congrats ${name || 'there'}! You unlocked the achievement "${achievementTitle}".`,
  };
}

function levelUp({ name, level } = {}) {
  return {
    subject: 'You leveled up!',
    body: `Nice work ${name || 'there'}! You reached level ${level}.`,
  };
}

function certificateApproved({ name, courseTitle } = {}) {
  return {
    subject: 'Certificate approved',
    body: `Hi ${name || 'there'}, your certificate for "${courseTitle}" has been approved.`,
  };
}

function streakReminder({ name, streakCount } = {}) {
  return {
    subject: 'Keep your streak alive!',
    body: `Hi ${name || 'there'}, you're on a ${streakCount}-day streak. Don't break it today!`,
  };
}

module.exports = {
  welcome,
  activityAssigned,
  dueDateReminder,
  overdueActivity,
  achievementUnlocked,
  levelUp,
  certificateApproved,
  streakReminder,
};
