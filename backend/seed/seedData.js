// Seed Data for Analytics & Reporting Demo
// Run: node backend/seed/seedData.js
// This populates the database with realistic demo data

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Activity = require('../src/models/Activity');
const Enrollment = require('../src/models/Enrollment');
const Submission = require('../src/models/Submission');
const XPTransaction = require('../src/models/XPTransaction');
const Team = require('../src/models/Team');
const Certificate = require('../src/models/Certificate');
const Achievement = require('../src/models/Achievement');
const StudentAchievement = require('../src/models/StudentAchievement');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/katalyst';

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB for seeding...');

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Activity.deleteMany({}),
    Enrollment.deleteMany({}),
    Submission.deleteMany({}),
    XPTransaction.deleteMany({}),
    Team.deleteMany({}),
    Certificate.deleteMany({}),
    Achievement.deleteMany({}),
    StudentAchievement.deleteMany({}),
  ]);
  console.log('Cleared existing data');

  // ---- Create Admin ----
  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@katalyst.com',
    password: 'hashed_password_placeholder',
    role: 'ADMIN',
    totalXP: 0,
    currentLevel: 1,
    currentStreak: 0,
    longestStreak: 0,
  });

  // ---- Create Teams ----
  const team1 = await Team.create({ name: 'Team Alpha', description: 'First team', createdBy: admin._id, memberIds: [], totalXP: 0 });
  const team2 = await Team.create({ name: 'Team Beta', description: 'Second team', createdBy: admin._id, memberIds: [], totalXP: 0 });

  // ---- Create Students ----
  const studentsData = [
    { name: 'Aarav Sharma', email: 'aarav@katalyst.com', teamId: team1._id, totalXP: 1250, currentLevel: 5, currentStreak: 7, longestStreak: 14 },
    { name: 'Priya Patel', email: 'priya@katalyst.com', teamId: team1._id, totalXP: 980, currentLevel: 4, currentStreak: 3, longestStreak: 10 },
    { name: 'Rohan Gupta', email: 'rohan@katalyst.com', teamId: team1._id, totalXP: 750, currentLevel: 3, currentStreak: 5, longestStreak: 12 },
    { name: 'Sneha Reddy', email: 'sneha@katalyst.com', teamId: team2._id, totalXP: 1100, currentLevel: 4, currentStreak: 10, longestStreak: 15 },
    { name: 'Vikram Singh', email: 'vikram@katalyst.com', teamId: team2._id, totalXP: 600, currentLevel: 3, currentStreak: 1, longestStreak: 5 },
    { name: 'Ananya Joshi', email: 'ananya@katalyst.com', teamId: team2._id, totalXP: 400, currentLevel: 2, currentStreak: 0, longestStreak: 3 },
    { name: 'Kiran Mehta', email: 'kiran@katalyst.com', teamId: team1._id, totalXP: 200, currentLevel: 1, currentStreak: 0, longestStreak: 2 },
    { name: 'Deepa Nair', email: 'deepa@katalyst.com', teamId: team2._id, totalXP: 150, currentLevel: 1, currentStreak: 0, longestStreak: 1 },
  ];

  const students = [];
  for (const s of studentsData) {
    const student = await User.create({
      ...s,
      password: 'hashed_password_placeholder',
      role: 'STUDENT',
    });
    students.push(student);
  }

  // Update team memberIds and totalXP
  const team1Members = students.filter(s => s.teamId.toString() === team1._id.toString());
  const team2Members = students.filter(s => s.teamId.toString() === team2._id.toString());
  await Team.findByIdAndUpdate(team1._id, {
    memberIds: team1Members.map(m => m._id),
    totalXP: team1Members.reduce((sum, m) => sum + m.totalXP, 0),
  });
  await Team.findByIdAndUpdate(team2._id, {
    memberIds: team2Members.map(m => m._id),
    totalXP: team2Members.reduce((sum, m) => sum + m.totalXP, 0),
  });

  // ---- Create Activities ----
  const activitiesData = [
    { title: 'JavaScript Fundamentals', type: 'COURSE', category: 'PROGRAMMING', isMandatory: true, maxXP: 200, dueDate: new Date('2026-09-15') },
    { title: 'React Basics', type: 'COURSE', category: 'PROGRAMMING', isMandatory: true, maxXP: 250, dueDate: new Date('2026-09-30') },
    { title: 'Leadership Workshop', type: 'TRAINING', category: 'SOFT_SKILLS', isMandatory: true, maxXP: 150, dueDate: new Date('2026-08-31') },
    { title: 'Database Design Project', type: 'PROJECT', category: 'DATABASES', isMandatory: true, maxXP: 300, isTeamBased: true, dueDate: new Date('2026-10-15') },
    { title: 'Python Assignment 1', type: 'ASSIGNMENT', category: 'PROGRAMMING', isMandatory: true, maxXP: 100, dueDate: new Date('2026-08-10') },
    { title: 'Mentor Session — Career Planning', type: 'MENTORING', category: 'CAREER', isMandatory: false, maxXP: 80 },
    { title: 'JavaScript Quiz', type: 'QUIZ', category: 'PROGRAMMING', isMandatory: true, maxXP: 50, dueDate: new Date('2026-09-01') },
    { title: 'AWS Cloud Practitioner', type: 'CERTIFICATE', category: 'CLOUD', isMandatory: false, maxXP: 200, certificateRequired: true },
    { title: 'Communication Skills', type: 'TRAINING', category: 'SOFT_SKILLS', isMandatory: false, maxXP: 100 },
    { title: 'Agile Methodology', type: 'COURSE', category: 'PROJECT_MANAGEMENT', isMandatory: false, maxXP: 150 },
    { title: 'Data Structures Quiz', type: 'QUIZ', category: 'PROGRAMMING', isMandatory: true, maxXP: 75, dueDate: new Date('2026-09-15') },
    { title: 'Year 1 Milestone', type: 'MILESTONE', category: 'GENERAL', isMandatory: true, maxXP: 500, dueDate: new Date('2026-12-31') },
  ];

  const activities = [];
  for (const a of activitiesData) {
    const activity = await Activity.create({
      ...a,
      description: `Complete ${a.title} to earn XP and advance your learning journey.`,
      createdBy: admin._id,
      status: 'PUBLISHED',
    });
    activities.push(activity);
  }

  // ---- Create Enrollments, Submissions, XP Transactions ----
  const now = new Date();
  const currentYear = now.getFullYear();

  // Helper to create a date N months ago
  function monthsAgo(n) {
    return new Date(currentYear, now.getMonth() - n, Math.floor(Math.random() * 28) + 1);
  }

  for (const student of students) {
    // Enroll each student in a random subset of activities
    const shuffled = [...activities].sort(() => 0.5 - Math.random());
    const enrollCount = Math.floor(Math.random() * 4) + 5; // 5-8 activities
    const enrolledActivities = shuffled.slice(0, enrollCount);

    for (let i = 0; i < enrolledActivities.length; i++) {
      const activity = enrolledActivities[i];
      const isCompleted = Math.random() > 0.3; // 70% chance completed
      const isSubmitted = isCompleted || Math.random() > 0.5;
      const enrolledAt = monthsAgo(Math.floor(Math.random() * 6) + 1);

      let enrollmentStatus = 'ENROLLED';
      let completedAt = null;
      let submittedAt = null;

      if (isCompleted) {
        enrollmentStatus = 'COMPLETED';
        completedAt = new Date(enrolledAt.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000);
        submittedAt = completedAt;
      } else if (isSubmitted) {
        enrollmentStatus = 'SUBMITTED';
        submittedAt = new Date(enrolledAt.getTime() + Math.random() * 20 * 24 * 60 * 60 * 1000);
      } else {
        enrollmentStatus = Math.random() > 0.5 ? 'IN_PROGRESS' : 'ENROLLED';
      }

      const enrollment = await Enrollment.create({
        studentId: student._id,
        activityId: activity._id,
        status: enrollmentStatus,
        progress: isCompleted ? 100 : Math.floor(Math.random() * 80),
        enrolledAt,
        submittedAt,
        completedAt,
      });

      // Create submission for completed/submitted
      if (isSubmitted || isCompleted) {
        const score = isCompleted ? Math.floor(Math.random() * 40) + 60 : Math.floor(Math.random() * 50) + 30;
        const xpAwarded = isCompleted ? Math.floor(activity.maxXP * (score / 100)) : 0;

        const submission = await Submission.create({
          activityId: activity._id,
          studentId: student._id,
          teamId: activity.isTeamBased ? student.teamId : null,
          content: `Submission for ${activity.title}`,
          status: isCompleted ? 'APPROVED' : 'PENDING',
          score: isCompleted ? score : null,
          xpAwarded,
          reviewerId: isCompleted ? admin._id : null,
          reviewerFeedback: isCompleted ? 'Good work!' : '',
          submittedAt: submittedAt || new Date(),
          reviewedAt: isCompleted ? completedAt : null,
        });

        // Create XP transaction for completed activities
        if (isCompleted && xpAwarded > 0) {
          await XPTransaction.create({
            studentId: student._id,
            activityId: activity._id,
            submissionId: submission._id,
            xp: xpAwarded,
            reason: `Completed ${activity.title}`,
            type: 'ACTIVITY',
            awardedBy: admin._id,
            createdAt: completedAt,
          });
        }
      }
    }
  }

  // Spread some XP transactions across different months for graph demo
  const xpReasons = ['Streak Bonus', 'Achievement Bonus', 'Team Contribution', 'Quiz Bonus'];
  for (const student of students.slice(0, 4)) {
    for (let m = 1; m <= 6; m++) {
      const bonusXP = Math.floor(Math.random() * 50) + 10;
      await XPTransaction.create({
        studentId: student._id,
        xp: bonusXP,
        reason: xpReasons[Math.floor(Math.random() * xpReasons.length)],
        type: 'BONUS',
        awardedBy: admin._id,
        createdAt: monthsAgo(m),
      });
    }
  }

  // ---- Create Certificates ----
  const certStatuses = ['VALIDATED', 'PENDING', 'UNDER_REVIEW', 'REJECTED'];
  for (const student of students.slice(0, 5)) {
    const certActivity = activities.find(a => a.type === 'CERTIFICATE');
    if (certActivity) {
      const status = certStatuses[Math.floor(Math.random() * certStatuses.length)];
      await Certificate.create({
        studentId: student._id,
        activityId: certActivity._id,
        certificateUrl: 'https://example.com/cert.pdf',
        certificateName: 'AWS Cloud Practitioner',
        issuer: 'Amazon Web Services',
        issueDate: monthsAgo(2),
        status,
        validationScore: status === 'VALIDATED' ? 85 : null,
        reviewerId: status === 'VALIDATED' ? admin._id : null,
        xpAwarded: status === 'VALIDATED' ? 200 : 0,
      });
    }
  }

  // ---- Create Achievements ----
  const achievementsData = [
    { name: 'First Activity', description: 'Completed your first activity', icon: '🎯', criteria: 'Complete 1 activity', xpReward: 50, type: 'ACTIVITY' },
    { name: '100 XP Club', description: 'Earned 100 XP', icon: '💯', criteria: 'Earn 100 XP', xpReward: 25, type: 'XP' },
    { name: '500 XP Club', description: 'Earned 500 XP', icon: '🔥', criteria: 'Earn 500 XP', xpReward: 50, type: 'XP' },
    { name: '1000 XP Club', description: 'Earned 1000 XP', icon: '⭐', criteria: 'Earn 1000 XP', xpReward: 100, type: 'XP' },
    { name: '7-Day Streak', description: 'Maintained a 7-day streak', icon: '🔥', criteria: '7 day streak', xpReward: 75, type: 'STREAK' },
    { name: 'Course Master', description: 'Completed 5 courses', icon: '📚', criteria: 'Complete 5 courses', xpReward: 100, type: 'COURSE' },
    { name: 'Quiz Master', description: 'Aced 3 quizzes', icon: '🧠', criteria: 'Score 90%+ on 3 quizzes', xpReward: 75, type: 'QUIZ' },
    { name: 'Team Player', description: 'Completed a team activity', icon: '🤝', criteria: 'Complete 1 team activity', xpReward: 50, type: 'TEAM' },
  ];

  const achievements = [];
  for (const a of achievementsData) {
    const ach = await Achievement.create(a);
    achievements.push(ach);
  }

  // Assign some achievements to top students
  for (const student of students.slice(0, 4)) {
    const count = Math.floor(Math.random() * 4) + 2;
    const shuffledAch = [...achievements].sort(() => 0.5 - Math.random());
    for (let i = 0; i < count; i++) {
      await StudentAchievement.create({
        studentId: student._id,
        achievementId: shuffledAch[i]._id,
        unlockedAt: monthsAgo(Math.floor(Math.random() * 3)),
        progress: 100,
      });
    }
  }

  console.log('');
  console.log('=== SEED COMPLETE ===');
  console.log(`Admin: ${admin.email}`);
  console.log(`Students: ${students.length}`);
  console.log(`Teams: 2`);
  console.log(`Activities: ${activities.length}`);
  console.log(`Achievements: ${achievements.length}`);
  console.log('');
  console.log('First student ID (for testing): ' + students[0]._id);
  console.log('Team 1 ID: ' + team1._id);
  console.log('First activity ID: ' + activities[0]._id);
  console.log('');

  await mongoose.disconnect();
  console.log('Disconnected. Seeding done!');
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
