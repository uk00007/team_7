const nodemailer = require('nodemailer');

// Sends through a Gmail account via an App Password (requires 2-Step Verification on the account:
// https://myaccount.google.com/apppasswords). Falls back to a console-log mock when unconfigured.
function buildTransport() {
  const { EMAIL_USER, EMAIL_APP_PASSWORD } = process.env;
  if (!EMAIL_USER || !EMAIL_APP_PASSWORD) return null;

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: EMAIL_USER, pass: EMAIL_APP_PASSWORD },
  });
}

const transporter = buildTransport();

async function sendEmail({ to, subject, body }) {
  if (!transporter) {
    console.log(`[email:mock] to=${to} subject="${subject}" body="${body}"`);
    return { mocked: true };
  }

  return transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    html: body,
  });
}

// No SMS provider is configured for the hackathon; mocked behind the same interface so swapping in
// a real provider (e.g. Twilio) later only touches this function.
async function sendSMS({ to, message }) {
  console.log(`[sms:mock] to=${to} message="${message}"`);
  return { mocked: true };
}

module.exports = { sendEmail, sendSMS };
