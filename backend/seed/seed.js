/**
 * seed/seed.js
 * Hackathon demo seed data for the Gamification Engine.
 * Run: npm run seed
 *
 * NOTE: Passwords are set to a fixed bcrypt hash of "password123".
 * Authentication is Nidhi's module — this seed only creates the User
 * records needed for gamification data to be queryable.
 *
 * Creates:
 *  - 1 admin
 *  - 5 students
 *  - 2 teams
 *  - 10 activities (various types)
 *  - 8 achievements
 *  - 6 milestones
 *  - Sample submissions + XP transactions for a realistic demo
 */
require('dotenv').config();
const mongoose  = require('mongoose');
const connectDB = require('../config/db');

// Pre-hashed bcrypt hash of "password123" (cost 10) — avoids bcryptjs dependency in gamification module
const PLACEHOLDER_PASSWORD = 'helloteam7';

const User             = require('../models/User');
const Team             = require('../models/Team');
const Activity         = require('../models/Activity');
const Submission       = require('../models/Submission');
const XPTransaction    = require('../models/XPTransaction');
const Achievement      = require('../models/Achievement');
const StudentAchievement = require('../models/StudentAchievement');
const Milestone        = require('../models/Milestone');
const StudentMilestone = require('../models/StudentMilestone');
const Notification     = require('../models/Notification');
const XPSettings       = require('../models/XPSettings');
const LevelDefinition  = require('../models/LevelDefinition');
const AuditLog         = require('../models/AuditLog');

const seed = async () => {
  await connectDB();
  console.log('🌱 Starting seed...');

  // ── Wipe existing data ──────────────────────────────────────────────────────
  await Promise.all([
    User.deleteMany({}),
    Team.deleteMany({}),
    Activity.deleteMany({}),
    Submission.deleteMany({}),
    XPTransaction.deleteMany({}),
    Achievement.deleteMany({}),
    StudentAchievement.deleteMany({}),
    Milestone.deleteMany({}),
    StudentMilestone.deleteMany({}),
    Notification.deleteMany({}),
    XPSettings.deleteMany({}),
    LevelDefinition.deleteMany({}),
    AuditLog.deleteMany({}),
  ]);
  console.log('✅ Cleared existing data');

  // Passwords use a pre-computed bcrypt hash (auth is Nidhi's module)

  // ── Admin ───────────────────────────────────────────────────────────────────
  const admin = await User.create({
    name:     'Admin Katalyst',
    email:    'admin@katalyst.com',
    password: PLACEHOLDER_PASSWORD,
    role:     'admin',
    totalXP:  0,
  });

  // ── Students ────────────────────────────────────────────────────────────────
  const studentData = [
    { name: 'Aarav Sharma',    email: 'aarav@katalyst.com'  },
    { name: 'Priya Patel',     email: 'priya@katalyst.com'  },
    { name: 'Rohan Mehta',     email: 'rohan@katalyst.com'  },
    { name: 'Sanya Gupta',     email: 'sanya@katalyst.com'  },
    { name: 'Vikram Nair',     email: 'vikram@katalyst.com' },
  ];

  const students = await User.insertMany(
    studentData.map((s) => ({ ...s, password: PLACEHOLDER_PASSWORD, role: 'student' }))
  );
  console.log(`✅ Created ${students.length} students`);

  // ── Teams ───────────────────────────────────────────────────────────────────
  const [teamA, teamB] = await Team.insertMany([
    {
      name:      'Team Alpha',
      description: 'The high-performers',
      createdBy: admin._id,
      memberIds: [students[0]._id, students[1]._id, students[2]._id],
      totalXP:   0,
    },
    {
      name:      'Team Beta',
      description: 'The challengers',
      createdBy: admin._id,
      memberIds: [students[3]._id, students[4]._id],
      totalXP:   0,
    },
  ]);

  // Assign teams to students
  await User.findByIdAndUpdate(students[0]._id, { teamId: teamA._id });
  await User.findByIdAndUpdate(students[1]._id, { teamId: teamA._id });
  await User.findByIdAndUpdate(students[2]._id, { teamId: teamA._id });
  await User.findByIdAndUpdate(students[3]._id, { teamId: teamB._id });
  await User.findByIdAndUpdate(students[4]._id, { teamId: teamB._id });
  console.log('✅ Created 2 teams');

  // ── Activities ──────────────────────────────────────────────────────────────
  const activities = await Activity.insertMany([
    { title: 'Python Fundamentals',      description: 'Core Python programming course',      type: 'COURSE',     isMandatory: true,  isTeamBased: false, maxXP: 100, createdBy: admin._id, dueDate: new Date(Date.now() + 7  * 86400000) },
    { title: 'Data Science Workshop',    description: 'Hands-on data science training',      type: 'TRAINING',   isMandatory: true,  isTeamBased: false, maxXP: 80,  createdBy: admin._id, dueDate: new Date(Date.now() + 14 * 86400000) },
    { title: 'Career Mentoring Q1',      description: 'One-on-one career guidance session',  type: 'MENTORING',  isMandatory: false, isTeamBased: false, maxXP: 60,  createdBy: admin._id },
    { title: 'Team Project: Analytics',  description: 'Build an analytics dashboard',        type: 'PROJECT',    isMandatory: true,  isTeamBased: true,  maxXP: 150, createdBy: admin._id, dueDate: new Date(Date.now() + 21 * 86400000) },
    { title: 'Python Quiz',              description: 'Test your Python knowledge',           type: 'QUIZ',       isMandatory: false, isTeamBased: false, maxXP: 50,  createdBy: admin._id },
    { title: 'AWS Cloud Practitioner',   description: 'AWS certification upload',             type: 'CERTIFICATE',isMandatory: false, isTeamBased: false, maxXP: 200, createdBy: admin._id, certificateRequired: true },
    { title: 'Case Study Assignment',    description: 'Business case analysis submission',   type: 'ASSIGNMENT', isMandatory: true,  isTeamBased: false, maxXP: 120, createdBy: admin._id, dueDate: new Date(Date.now() + 5  * 86400000) },
    { title: 'Logic Puzzle Challenge',   description: 'Weekly brain teaser puzzle',          type: 'PUZZLE',     isMandatory: false, isTeamBased: false, maxXP: 40,  createdBy: admin._id },
    { title: 'Programme Orientation',    description: 'Year 1 orientation milestone',        type: 'MILESTONE',  isMandatory: true,  isTeamBased: false, maxXP: 50,  createdBy: admin._id },
    { title: 'Leadership Workshop',      description: 'Leadership skills training',           type: 'TRAINING',   isMandatory: false, isTeamBased: false, maxXP: 70,  createdBy: admin._id },
  ]);
  console.log(`✅ Created ${activities.length} activities`);

  // ── Achievements ────────────────────────────────────────────────────────────
  const achievements = await Achievement.insertMany([
    { name: 'First Steps',      description: 'Complete your first activity',         icon: '👣', criteria: { type: 'FIRST_SUBMISSION', value: 1 },                      xpReward: 10,  type: 'BRONZE' },
    { name: '100 XP Club',      description: 'Earn 100 XP total',                   icon: '💯', criteria: { type: 'XP_TOTAL',         value: 100 },                     xpReward: 15,  type: 'BRONZE' },
    { name: '500 XP Achiever',  description: 'Earn 500 XP total',                   icon: '🚀', criteria: { type: 'XP_TOTAL',         value: 500 },                     xpReward: 50,  type: 'SILVER' },
    { name: '1000 XP Legend',   description: 'Earn 1000 XP total',                  icon: '⭐', criteria: { type: 'XP_TOTAL',         value: 1000 },                    xpReward: 100, type: 'GOLD'   },
    { name: '7-Day Streak',     description: 'Maintain a 7-day activity streak',    icon: '🔥', criteria: { type: 'STREAK_DAYS',      value: 7 },                       xpReward: 50,  type: 'SILVER' },
    { name: 'Course Master',    description: 'Complete 3 courses',                  icon: '📚', criteria: { type: 'ACTIVITY_TYPE',    value: 3, subtype: 'COURSE' },    xpReward: 75,  type: 'GOLD'   },
    { name: 'Level 3 Reached',  description: 'Reach Apprentice level',              icon: '⚡', criteria: { type: 'LEVEL_REACHED',    value: 3 },                       xpReward: 30,  type: 'SILVER' },
    { name: 'Activity Starter', description: 'Complete 5 activities',               icon: '🎯', criteria: { type: 'ACTIVITY_COUNT',   value: 5 },                       xpReward: 40,  type: 'BRONZE' },
  ]);
  console.log(`✅ Created ${achievements.length} achievements`);

  // ── Milestones ───────────────────────────────────────────────────────────────
  await Milestone.insertMany([
    { name: 'First Completion',    description: 'Complete your first activity',         icon: '🌱', criteria: { type: 'ACTIVITY_COUNT', value: 1  }, xpReward: 20,  order: 1 },
    { name: '5 Activities Done',   description: 'Complete 5 activities',                icon: '🎯', criteria: { type: 'ACTIVITY_COUNT', value: 5  }, xpReward: 50,  order: 2 },
    { name: 'XP Milestone: 250',   description: 'Reach 250 XP',                         icon: '💫', criteria: { type: 'XP_TOTAL',       value: 250}, xpReward: 0,   order: 3 },
    { name: 'XP Milestone: 1000',  description: 'Reach 1000 XP',                        icon: '🏆', criteria: { type: 'XP_TOTAL',       value: 1000},xpReward: 0,   order: 4 },
    { name: 'Course Finisher',     description: 'Complete 2 courses',                   icon: '📘', criteria: { type: 'COURSE_COUNT',   value: 2  }, xpReward: 60,  order: 5 },
    { name: 'Week Warrior',        description: 'Maintain a 7-day streak',              icon: '🔥', criteria: { type: 'STREAK_DAYS',    value: 7  }, xpReward: 40,  order: 6 },
  ]);
  console.log('✅ Created milestones');

  // ── Seeded XP/Submissions for demo ──────────────────────────────────────────
  // Student 0 (Aarav) — high performer with level 3 reached
  const aarav = students[0];
  const priya = students[1];
  const rohan = students[2];

  // Aarav: approved submission for Python course (90/100 score → 90 XP)
  const sub1 = await Submission.create({
    activityId: activities[0]._id, studentId: aarav._id, teamId: teamA._id,
    content: 'Completed all Python modules', status: 'APPROVED',
    score: 90, xpAwarded: 90, reviewerId: admin._id,
    reviewerFeedback: 'Excellent work!', reviewedAt: new Date(Date.now() - 2 * 86400000),
  });
  await XPTransaction.create({ studentId: aarav._id, activityId: activities[0]._id, submissionId: sub1._id, xp: 90,  reason: 'Activity completed: Python Fundamentals',  type: 'ACTIVITY', awardedBy: admin._id, createdAt: new Date(Date.now() - 2 * 86400000) });

  // Aarav: approved submission for Data Science training (80/100 → 64 XP)
  const sub2 = await Submission.create({
    activityId: activities[1]._id, studentId: aarav._id,
    content: 'Data science workshop completed', status: 'APPROVED',
    score: 80, xpAwarded: 64, reviewerId: admin._id,
    reviewerFeedback: 'Great insights!', reviewedAt: new Date(Date.now() - 1 * 86400000),
  });
  await XPTransaction.create({ studentId: aarav._id, activityId: activities[1]._id, submissionId: sub2._id, xp: 64,  reason: 'Activity completed: Data Science Workshop', type: 'ACTIVITY', awardedBy: admin._id, createdAt: new Date(Date.now() - 1 * 86400000) });

  // Aarav: streak bonus (3-day)
  await XPTransaction.create({ studentId: aarav._id, xp: 10, reason: '3-day streak bonus', type: 'STREAK', createdAt: new Date(Date.now() - 1 * 86400000) });

  // Aarav: achievement bonus — First Steps
  await XPTransaction.create({ studentId: aarav._id, xp: 10, reason: 'Achievement unlocked: First Steps', type: 'BONUS', createdAt: new Date(Date.now() - 2 * 86400000) });

  // Aarav total XP = 90 + 64 + 10 + 10 = 174 → Level 2
  await User.findByIdAndUpdate(aarav._id, {
    totalXP: 174, currentLevel: 2, currentStreak: 3, longestStreak: 3,
    lastActivityDate: new Date(),
  });
  await Team.findByIdAndUpdate(teamA._id, { $inc: { totalXP: 174 } });

  // Achievement unlock for Aarav
  await StudentAchievement.create({ studentId: aarav._id, achievementId: achievements[0]._id, progress: 100 }); // First Steps
  console.log('✅ Aarav seeded');

  // Priya: completed case study (100 score) + 500 XP milestone
  const sub3 = await Submission.create({
    activityId: activities[6]._id, studentId: priya._id,
    content: 'Detailed business case analysis', status: 'APPROVED',
    score: 100, xpAwarded: 120, reviewerId: admin._id,
    reviewerFeedback: 'Outstanding analysis!', reviewedAt: new Date(Date.now() - 3 * 86400000),
  });
  await XPTransaction.create({ studentId: priya._id, activityId: activities[6]._id, submissionId: sub3._id, xp: 120, reason: 'Activity completed: Case Study Assignment', type: 'ACTIVITY', awardedBy: admin._id, createdAt: new Date(Date.now() - 3 * 86400000) });

  // Priya: Python course approval
  const sub4 = await Submission.create({
    activityId: activities[0]._id, studentId: priya._id,
    content: 'Python course completion', status: 'APPROVED',
    score: 95, xpAwarded: 95, reviewerId: admin._id,
    reviewerFeedback: 'Excellent!', reviewedAt: new Date(Date.now() - 5 * 86400000),
  });
  await XPTransaction.create({ studentId: priya._id, activityId: activities[0]._id, submissionId: sub4._id, xp: 95, reason: 'Activity completed: Python Fundamentals', type: 'ACTIVITY', awardedBy: admin._id, createdAt: new Date(Date.now() - 5 * 86400000) });

  // Priya: manual bonus
  await XPTransaction.create({ studentId: priya._id, xp: 50, reason: 'Exceptional contribution to team project', type: 'MANUAL', awardedBy: admin._id, createdAt: new Date(Date.now() - 1 * 86400000) });

  // Priya: streak
  await XPTransaction.create({ studentId: priya._id, xp: 25, reason: '7-day streak bonus', type: 'STREAK', createdAt: new Date(Date.now() - 4 * 86400000) });

  // Priya: achievements
  await XPTransaction.create({ studentId: priya._id, xp: 10, reason: 'Achievement unlocked: First Steps', type: 'BONUS' });
  await XPTransaction.create({ studentId: priya._id, xp: 15, reason: 'Achievement unlocked: 100 XP Club',  type: 'BONUS' });

  // Priya total = 120 + 95 + 50 + 25 + 10 + 15 = 315 → Level 3
  await User.findByIdAndUpdate(priya._id, {
    totalXP: 315, currentLevel: 3, currentStreak: 7, longestStreak: 7,
    lastActivityDate: new Date(),
  });
  await Team.findByIdAndUpdate(teamA._id, { $inc: { totalXP: 315 } });

  await StudentAchievement.create([
    { studentId: priya._id, achievementId: achievements[0]._id, progress: 100 }, // First Steps
    { studentId: priya._id, achievementId: achievements[1]._id, progress: 100 }, // 100 XP Club
    { studentId: priya._id, achievementId: achievements[4]._id, progress: 100 }, // 7-Day Streak
    { studentId: priya._id, achievementId: achievements[6]._id, progress: 100 }, // Level 3
  ]);
  console.log('✅ Priya seeded');

  // Rohan: pending submission (awaiting review — good for demo)
  await Submission.create({
    activityId: activities[3]._id, studentId: rohan._id, teamId: teamA._id,
    content: 'Team analytics dashboard submission', status: 'PENDING',
    submittedAt: new Date(),
  });
  await User.findByIdAndUpdate(rohan._id, {
    totalXP: 45, currentLevel: 1, currentStreak: 1, longestStreak: 2,
    lastActivityDate: new Date(),
  });
  await XPTransaction.create({ studentId: rohan._id, xp: 45, reason: 'Activity completed: Programme Orientation', type: 'ACTIVITY', awardedBy: admin._id });
  await Team.findByIdAndUpdate(teamA._id, { $inc: { totalXP: 45 } });
  console.log('✅ Rohan seeded (pending submission for demo)');

  // Sanya (Team Beta): moderate performer
  await XPTransaction.create({ studentId: students[3]._id, xp: 80, reason: 'Activity completed: Leadership Workshop', type: 'ACTIVITY', awardedBy: admin._id });
  await User.findByIdAndUpdate(students[3]._id, { totalXP: 80, currentLevel: 1, currentStreak: 2, longestStreak: 4, lastActivityDate: new Date() });
  await Team.findByIdAndUpdate(teamB._id, { $inc: { totalXP: 80 } });

  // Vikram (Team Beta): lower performer
  await XPTransaction.create({ studentId: students[4]._id, xp: 30, reason: 'Activity completed: Logic Puzzle Challenge', type: 'ACTIVITY', awardedBy: admin._id });
  await User.findByIdAndUpdate(students[4]._id, { totalXP: 30, currentLevel: 1, currentStreak: 0, longestStreak: 1, lastActivityDate: new Date(Date.now() - 3 * 86400000) });
  await Team.findByIdAndUpdate(teamB._id, { $inc: { totalXP: 30 } });
  console.log('✅ Beta team seeded');

  // ── Notifications ────────────────────────────────────────────────────────────
  await Notification.insertMany([
    { userId: aarav._id,       type: 'XP_AWARDED',          title: '+90 XP Earned!',              message: 'You earned 90 XP for completing Python Fundamentals.',     isRead: false },
    { userId: aarav._id,       type: 'ACHIEVEMENT_UNLOCKED',title: '🏆 Achievement: First Steps', message: 'You unlocked the First Steps achievement!',                  isRead: false },
    { userId: priya._id,       type: 'LEVEL_UP',            title: '🎉 Level Up! Level 3',        message: "You've reached Level 3 — Apprentice. Keep going!",           isRead: false },
    { userId: priya._id,       type: 'STREAK_MAINTAINED',   title: '🔥 7-Day Streak!',            message: 'Amazing! You\'re on a 7-day streak.',                        isRead: true  },
    { userId: rohan._id,       type: 'ACTIVITY_ASSIGNED',   title: 'New Activity Available',      message: 'Team Project: Analytics is now available for submission.',   isRead: false },
    { userId: students[4]._id, type: 'STREAK_AT_RISK',      title: '⚠️ Streak at Risk!',         message: 'Complete an activity today to maintain your streak!',        isRead: false },
  ]);
  console.log('✅ Notifications seeded');

  // ── XP Settings (Admin-configurable per activity type) ──────────────────────
  await XPSettings.insertMany([
    { activityType: 'COURSE',      baseXP: 100, maxXP: 200, passingScore: 60, minScoreForXP: 30, bonusXP: 10,  teamBonusXP: 0,  streakEligible: true,  rewardEligible: true,  allowMultipleXP: false, createdBy: admin._id, updatedBy: admin._id },
    { activityType: 'TRAINING',    baseXP: 50,  maxXP: 100, passingScore: 60, minScoreForXP: 0,  bonusXP: 5,   teamBonusXP: 0,  streakEligible: true,  rewardEligible: true,  allowMultipleXP: false, createdBy: admin._id, updatedBy: admin._id },
    { activityType: 'ASSIGNMENT',  baseXP: 80,  maxXP: 120, passingScore: 60, minScoreForXP: 40, bonusXP: 0,   teamBonusXP: 0,  streakEligible: true,  rewardEligible: true,  allowMultipleXP: false, createdBy: admin._id, updatedBy: admin._id },
    { activityType: 'PROJECT',     baseXP: 150, maxXP: 300, passingScore: 70, minScoreForXP: 50, bonusXP: 20,  teamBonusXP: 25, streakEligible: true,  rewardEligible: true,  allowMultipleXP: false, createdBy: admin._id, updatedBy: admin._id },
    { activityType: 'QUIZ',        baseXP: 30,  maxXP: 50,  passingScore: 70, minScoreForXP: 0,  bonusXP: 10,  teamBonusXP: 0,  streakEligible: true,  rewardEligible: true,  allowMultipleXP: true,  createdBy: admin._id, updatedBy: admin._id },
    { activityType: 'MENTORING',   baseXP: 40,  maxXP: 60,  passingScore: 0,  minScoreForXP: 0,  bonusXP: 0,   teamBonusXP: 0,  streakEligible: true,  rewardEligible: true,  allowMultipleXP: false, createdBy: admin._id, updatedBy: admin._id },
    { activityType: 'COACHING',    baseXP: 40,  maxXP: 60,  passingScore: 0,  minScoreForXP: 0,  bonusXP: 0,   teamBonusXP: 0,  streakEligible: true,  rewardEligible: true,  allowMultipleXP: false, createdBy: admin._id, updatedBy: admin._id },
    { activityType: 'CERTIFICATE', baseXP: 100, maxXP: 200, passingScore: 0,  minScoreForXP: 0,  bonusXP: 50,  teamBonusXP: 0,  streakEligible: false, rewardEligible: true,  allowMultipleXP: false, createdBy: admin._id, updatedBy: admin._id },
    { activityType: 'PUZZLE',      baseXP: 20,  maxXP: 40,  passingScore: 80, minScoreForXP: 0,  bonusXP: 5,   teamBonusXP: 0,  streakEligible: true,  rewardEligible: false, allowMultipleXP: true,  createdBy: admin._id, updatedBy: admin._id },
    { activityType: 'MILESTONE',   baseXP: 30,  maxXP: 50,  passingScore: 0,  minScoreForXP: 0,  bonusXP: 0,   teamBonusXP: 0,  streakEligible: false, rewardEligible: true,  allowMultipleXP: false, createdBy: admin._id, updatedBy: admin._id },
  ]);
  console.log('✅ XP Settings seeded (10 activity types)');

  // ── Level Definitions (DB-driven, admin-configurable) ──────────────────────
  await LevelDefinition.insertMany([
    { level: 1, title: 'Novice',       minXP: 0,     maxXP: 99,    icon: '🌱', badge: 'novice',       xpReward: 0,   createdBy: admin._id, updatedBy: admin._id },
    { level: 2, title: 'Explorer',     minXP: 100,   maxXP: 249,   icon: '🔍', badge: 'explorer',     xpReward: 10,  createdBy: admin._id, updatedBy: admin._id },
    { level: 3, title: 'Apprentice',   minXP: 250,   maxXP: 499,   icon: '⚡', badge: 'apprentice',   xpReward: 20,  createdBy: admin._id, updatedBy: admin._id },
    { level: 4, title: 'Practitioner', minXP: 500,   maxXP: 999,   icon: '🏅', badge: 'practitioner', xpReward: 30,  createdBy: admin._id, updatedBy: admin._id },
    { level: 5, title: 'Expert',       minXP: 1000,  maxXP: 1999,  icon: '🥇', badge: 'expert',       xpReward: 50,  createdBy: admin._id, updatedBy: admin._id },
    { level: 6, title: 'Champion',     minXP: 2000,  maxXP: 3499,  icon: '🏆', badge: 'champion',     xpReward: 75,  createdBy: admin._id, updatedBy: admin._id },
    { level: 7, title: 'Master',       minXP: 3500,  maxXP: 5999,  icon: '⭐', badge: 'master',       xpReward: 100, createdBy: admin._id, updatedBy: admin._id },
    { level: 8, title: 'Grandmaster',  minXP: 6000,  maxXP: 9999,  icon: '💎', badge: 'grandmaster',  xpReward: 150, createdBy: admin._id, updatedBy: admin._id },
    { level: 9, title: 'Legend',       minXP: 10000, maxXP: null,  icon: '🌟', badge: 'legend',       xpReward: 250, createdBy: admin._id, updatedBy: admin._id },
  ]);
  console.log('✅ Level Definitions seeded (9 levels)');

  // ── Sample Audit Log records ──────────────────────────────────────────────────
  await AuditLog.insertMany([
    { adminId: admin._id, action: 'XP_SETTINGS_CREATED',  newValue: { activityType: 'COURSE', maxXP: 200 },    reason: 'Initial configuration' },
    { adminId: admin._id, action: 'LEVEL_CREATED',         newValue: { level: 1, title: 'Novice' },             reason: 'Initial level setup'   },
  ]);
  console.log('✅ Audit log seeded');

  console.log('\n🎉 Seed complete! Demo credentials:');
  console.log('   Admin:   admin@katalyst.com    / password123');
  console.log('   Student: aarav@katalyst.com    / password123  (Level 2, 174 XP)');
  console.log('   Student: priya@katalyst.com    / password123  (Level 3, 315 XP, 7-day streak)');
  console.log('   Student: rohan@katalyst.com    / password123  (Level 1, pending submission for review demo)');
  console.log('   Student: sanya@katalyst.com    / password123  (Level 1, 80 XP)');
  console.log('   Student: vikram@katalyst.com   / password123  (Level 1, streak at risk)');
  console.log('\nℹ️  Admin APIs: http://localhost:5000/api/admin/gamification');

  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
