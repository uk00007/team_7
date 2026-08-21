/**
 * Email & SMS Template Infrastructure & Notification Abstraction Service
 */

const getWelcomeEmail = (name) => ({
  subject: 'Welcome to Katalyst Gamified Learning Platform!',
  html: `<h1>Welcome, ${name}!</h1><p>We are thrilled to have you join Katalyst. Start taking learning modules, earn XP, and unlock achievements!</p>`,
  sms: `Welcome to Katalyst, ${name}! Log in now to explore your activities and start earning XP.`
});

const getAssignmentReminder = (name, activityTitle, dueDate) => ({
  subject: `Reminder: ${activityTitle} is waiting for you`,
  html: `<h2>Hello ${name},</h2><p>You have an active activity: <strong>${activityTitle}</strong> due on <strong>${new Date(dueDate).toLocaleDateString()}</strong>.</p>`,
  sms: `Hi ${name}, reminder: ${activityTitle} is due on ${new Date(dueDate).toLocaleDateString()}. Complete it to earn your XP!`
});

const getDueTodayNotice = (name, activityTitle) => ({
  subject: `URGENT: ${activityTitle} is due today!`,
  html: `<h2>Attention ${name},</h2><p>Your assignment <strong>${activityTitle}</strong> is due today. Don't lose your streak!</p>`,
  sms: `Attention ${name}: ${activityTitle} is due today! Complete it now to keep your active streak.`
});

const getOverdueNotice = (name, activityTitle) => ({
  subject: `Overdue Assignment: ${activityTitle}`,
  html: `<h2>Hello ${name},</h2><p>Your assignment <strong>${activityTitle}</strong> is past its due date. Please submit it as soon as possible.</p>`,
  sms: `Hi ${name}, ${activityTitle} is overdue. Submit it soon to maintain your progress.`
});

const getXPEarnedNotice = (name, xpAmount, reason) => ({
  subject: `You earned +${xpAmount} XP!`,
  html: `<h2>Awesome job, ${name}!</h2><p>You were awarded <strong>+${xpAmount} XP</strong> for: ${reason}. Keep up the great momentum!</p>`,
  sms: `Awesome ${name}! You earned +${xpAmount} XP for ${reason}.`
});

const getLevelUpNotice = (name, newLevel) => ({
  subject: `LEVEL UP! You are now Level ${newLevel}!`,
  html: `<h1>Congratulations ${name}!</h1><p>Your hard work paid off! You leveled up to <strong>Level ${newLevel}</strong>.</p>`,
  sms: `LEVEL UP! Congrats ${name}, you reached Level ${newLevel} on Katalyst!`
});

const getTeamInvitationNotice = (name, teamName) => ({
  subject: `Team Invitation: Joined ${teamName}`,
  html: `<h2>Hello ${name},</h2><p>You have been added to <strong>${teamName}</strong>. Collaborate with your teammates to earn squad XP!</p>`,
  sms: `Hi ${name}, you've been added to ${teamName}! Work together to top the leaderboards.`
});

/**
 * Notification Abstraction Provider
 * Simulates sending Email or SMS notifications.
 * Can be connected to SendGrid, Twilio, or AWS SES later.
 */
const sendEmail = async ({ to, subject, html, text }) => {
  console.log(`[Email Service] Sending email to ${to}: ${subject}`);
  return { success: true, message: `Email sent to ${to}` };
};

const sendSMS = async ({ to, message }) => {
  console.log(`[SMS Service] Sending SMS to ${to}: ${message}`);
  return { success: true, message: `SMS sent to ${to}` };
};

const sendNotification = async ({ recipientEmail, recipientPhone, channel = 'email', template }) => {
  console.log(`[Notification Service] Sending via channel '${channel}' to ${recipientEmail || recipientPhone}:`);
  console.log(`[Subject/Text]: ${template.subject || template.sms}`);
  if (channel === 'sms' && recipientPhone) {
    return sendSMS({ to: recipientPhone, message: template.sms || template.subject });
  }
  return sendEmail({ to: recipientEmail, subject: template.subject, html: template.html, text: template.sms });
};

module.exports = {
  getWelcomeEmail,
  getAssignmentReminder,
  getDueTodayNotice,
  getOverdueNotice,
  getXPEarnedNotice,
  getLevelUpNotice,
  getTeamInvitationNotice,
  sendEmail,
  sendSMS,
  sendNotification
};
