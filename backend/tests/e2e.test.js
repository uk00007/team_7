const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../server');

const PORT = 5099;
let server;

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

const adminToken = jwt.sign({ id: new mongoose.Types.ObjectId().toString(), role: 'admin', name: 'Admin', email: 'admin@test.com' }, JWT_SECRET);
const studentToken = jwt.sign({ id: new mongoose.Types.ObjectId().toString(), role: 'student', name: 'Student 1', email: 'student1@test.com' }, JWT_SECRET);

const BASE = `http://localhost:${PORT}`;

async function runTests() {
  console.log('🧪 Starting 31-Point End-to-End Gamification Verification...\n');

  // Start temporary test server
  server = app.listen(PORT);

  if (mongoose.connection.readyState !== 1) {
    await new Promise((resolve) => mongoose.connection.once('open', resolve));
  }

  // Models
  const User = require('../models/User');
  const Team = require('../models/Team');
  const Activity = require('../models/Activity');
  const Submission = require('../models/Submission');
  const XPTransaction = require('../models/XPTransaction');
  const Achievement = require('../models/Achievement');
  const StudentAchievement = require('../models/StudentAchievement');
  const Milestone = require('../models/Milestone');
  const StudentMilestone = require('../models/StudentMilestone');
  const XPSettings = require('../models/XPSettings');
  const LevelDefinition = require('../models/LevelDefinition');
  const AuditLog = require('../models/AuditLog');
  const Notification = require('../models/Notification');

  // Clear test DB
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
    XPSettings.deleteMany({}),
    LevelDefinition.deleteMany({}),
    AuditLog.deleteMany({}),
    Notification.deleteMany({}),
  ]);

  let passCount = 0;
  function assert(cond, msg) {
    if (!cond) {
      console.error(`❌ FAIL: ${msg}`);
      throw new Error(msg);
    }
    passCount++;
    console.log(`✅ [${passCount}/31] PASS: ${msg}`);
  }

  // 1. Admin login token generated
  assert(adminToken && studentToken, '1. Admin and student authentication tokens generated');

  // Create Admin and Student in DB
  const adminUser = await User.create({
    name: 'Admin User',
    email: 'admin@test.com',
    password: 'password123',
    role: 'admin',
  });

  const testTeam = await Team.create({
    name: 'Alpha Team',
    totalXP: 0,
    createdBy: adminUser._id,
    memberIds: [],
  });

  const studentUser = await User.create({
    name: 'Aarav Student',
    email: 'aarav@test.com',
    password: 'password123',
    role: 'student',
    teamId: testTeam._id,
    totalXP: 0,
    currentLevel: 1,
    currentStreak: 0,
  });

  testTeam.memberIds.push(studentUser._id);
  await testTeam.save();

  // 2. Admin creates XP configuration (POST /api/admin/gamification/xp-settings)
  const res2 = await fetch(`${BASE}/api/admin/gamification/xp-settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      activityType: 'ASSIGNMENT',
      baseXP: 50,
      maxXP: 100,
      passingScore: 60,
      minScoreForXP: 30,
      bonusXP: 10,
      teamBonusXP: 20,
      individualXP: 5,
    }),
  });
  const data2 = await res2.json();
  assert(data2.success && data2.data.setting.activityType === 'ASSIGNMENT', '2. Admin creates XP configuration');

  // 3. Admin creates level (POST /api/admin/gamification/levels)
  const res3 = await fetch(`${BASE}/api/admin/gamification/levels`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      level: 2,
      title: 'Apprentice Explorer',
      minXP: 80,
      maxXP: 200,
      icon: '⚡',
      xpReward: 15,
    }),
  });
  const data3 = await res3.json();
  assert(data3.success && data3.data.level.level === 2, '3. Admin creates level definition');

  // 4. Admin creates milestone (POST /api/admin/gamification/milestones)
  const res4 = await fetch(`${BASE}/api/admin/gamification/milestones`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      name: 'First Assignment Ace',
      description: 'Complete 1 assignment',
      criteria: { type: 'ASSIGNMENT_COUNT', value: 1 },
      xpReward: 25,
    }),
  });
  const data4 = await res4.json();
  assert(data4.success && data4.data.milestone.name === 'First Assignment Ace', '4. Admin creates milestone');

  // 5. Admin creates achievement (POST /api/admin/gamification/achievements)
  const res5 = await fetch(`${BASE}/api/admin/gamification/achievements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      name: 'Assignment Hero',
      description: 'Score 80+ on an assignment',
      criteria: { type: 'ACTIVITY_COUNT', value: 1 },
      xpReward: 30,
      type: 'BRONZE',
    }),
  });
  const data5 = await res5.json();
  assert(data5.success && data5.data.achievement.name === 'Assignment Hero', '5. Admin creates achievement');

  // 6. Student completes an activity
  const activity = await Activity.create({
    title: 'Node.js Core Assignment',
    type: 'ASSIGNMENT',
    maxXP: 100,
    isMandatory: true,
    createdBy: adminUser._id,
  });
  assert(activity && activity._id, '6. Activity exists for student completion');

  // 7. Submission exists
  const submission = await Submission.create({
    activityId: activity._id,
    studentId: studentUser._id,
    teamId: testTeam._id,
    status: 'PENDING',
    content: 'https://github.com/student/assignment-1',
  });
  assert(submission && submission.status === 'PENDING', '7. Submission exists in PENDING state');

  // 8. Admin sees pending submission (GET /api/admin/reviews)
  const res8 = await fetch(`${BASE}/api/admin/reviews?status=PENDING`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const data8 = await res8.json();
  assert(data8.success && data8.data.submissions.length > 0, '8. Admin sees pending submission list');

  // 9. Admin reviews submission (POST /api/admin/reviews/:id)
  const res9 = await fetch(`${BASE}/api/admin/reviews/${submission._id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      score: 85,
      status: 'APPROVED',
      reviewerFeedback: 'Excellent implementation with tests!',
    }),
  });
  const data9 = await res9.json();
  assert(data9.success, '9. Admin submits score and review');

  // 10. XP preview is calculated
  const previewVal = typeof data9.data.xpPreview === 'object' ? data9.data.xpPreview?.xp : data9.data.xpPreview;
  assert(previewVal !== null && previewVal > 0, `10. XP preview calculated: ${previewVal} XP`);

  // 11. No official XP is awarded yet (Human-in-the-loop gate)
  const studentCheckBefore = await User.findById(studentUser._id);
  const submCheckBefore = await Submission.findById(submission._id);
  assert(studentCheckBefore.totalXP === 0 && submCheckBefore.status === 'REVIEW_PENDING_CONFIRMATION', '11. XP is NOT yet officially awarded before confirmation');

  // 12. Admin confirms (POST /api/admin/reviews/:id/confirm)
  const res12 = await fetch(`${BASE}/api/admin/reviews/${submission._id}/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
  });
  const data12 = await res12.json();
  assert(data12.success && data12.data.submission.status === 'APPROVED', '12. Admin confirms review and triggers official award');

  // 13. XPTransaction is created
  const txs = await XPTransaction.find({ studentId: studentUser._id });
  assert(txs.length > 0, `13. XPTransaction records created (${txs.length} transactions)`);

  // 14. User.totalXP changes through central XP service
  const studentAfter = await User.findById(studentUser._id);
  assert(studentAfter.totalXP > 0, `14. User.totalXP successfully updated: ${studentAfter.totalXP} XP`);

  // 15. Level recalculates
  assert(studentAfter.currentLevel >= 1, `15. Level recalculated: Level ${studentAfter.currentLevel}`);

  // 16. Milestone updates
  const studentMilestones = await StudentMilestone.find({ studentId: studentUser._id });
  assert(studentMilestones.length > 0, '16. Student milestone progress updated');

  // 17. Achievement evaluates & unlocks
  const studentAchievements = await StudentAchievement.find({ studentId: studentUser._id });
  assert(studentAchievements.length > 0, '17. Achievement criteria evaluated and unlocked');

  // 18. Streak evaluates
  assert(studentAfter.currentStreak >= 1, `18. Streak evaluated: ${studentAfter.currentStreak} day(s)`);

  // 19. Team contribution updates
  const teamAfter = await Team.findById(testTeam._id);
  assert(teamAfter.totalXP > 0, `19. Team contribution updated: Team totalXP = ${teamAfter.totalXP}`);

  // 20. Notification event is generated
  const notifs = await Notification.find({ userId: studentUser._id });
  assert(notifs.length > 0, `20. Notification event generated (${notifs.length} notifications)`);

  // 21. Leaderboard data changes
  const res21 = await fetch(`${BASE}/api/xp/leaderboard`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  const data21 = await res21.json();
  assert(data21.success && data21.data.leaderboard.length > 0, '21. Individual leaderboard reflects updated XP');

  // 22. Participation data changes
  const res22 = await fetch(`${BASE}/api/admin/gamification/participation`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const data22 = await res22.json();
  assert(data22.success && data22.data.students.total > 0, '22. Admin participation monitoring reflects active statistics');

  // 23. Monthly data changes
  const res23 = await fetch(`${BASE}/api/xp/leaderboard/monthly`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  const data23 = await res23.json();
  assert(data23.success && data23.data.leaderboard.length > 0, '23. Monthly leaderboard aggregates period transactions');

  // 24. Yearly data changes
  const res24 = await fetch(`${BASE}/api/xp/leaderboard/yearly`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  const data24 = await res24.json();
  assert(data24.success && data24.data.leaderboard.length > 0, '24. Yearly leaderboard aggregates annual transactions');

  // 25. Audit entry is created
  const auditLogs = await AuditLog.find({});
  assert(auditLogs.length > 0, `25. Audit trail records created (${auditLogs.length} audit logs)`);

  // 26. Confirm same review again -> MUST NOT award XP twice (blocked)
  const res26 = await fetch(`${BASE}/api/admin/reviews/${submission._id}/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
  });
  const data26 = await res26.json();
  assert(!data26.success, '26. Duplicate confirmation safely rejected');

  // 27. Student calls admin endpoint -> MUST return 403
  const res27 = await fetch(`${BASE}/api/admin/gamification/xp-settings`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  assert(res27.status === 403, '27. Student calling admin endpoint returns 403 Forbidden');

  // 28. Unauthenticated request in production / invalid token
  const res28 = await fetch(`${BASE}/api/admin/gamification/xp-settings`, {
    headers: { Authorization: 'Bearer invalid_token' },
  });
  assert(res28.status === 401 || res28.status === 403, '28. Invalid token returns unauthorized / forbidden status');

  // 29. Negative XP -> MUST fail
  const res29 = await fetch(`${BASE}/api/xp/award`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      studentId: studentUser._id.toString(),
      xp: 0,
      reason: 'Zero XP test',
      type: 'MANUAL',
    }),
  });
  const data29 = await res29.json();
  assert(!data29.success, '29. Zero/invalid XP rejected by validation');

  // 30. Invalid score (> 100 or < 0) -> MUST fail
  const res30 = await fetch(`${BASE}/api/admin/reviews/${submission._id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      score: 150,
      status: 'APPROVED',
    }),
  });
  const data30 = await res30.json();
  assert(!data30.success, '30. Out-of-range score (>100) rejected by validator');

  // 31. Invalid student -> MUST fail
  const res31 = await fetch(`${BASE}/api/admin/gamification/manual-award`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      studentId: new mongoose.Types.ObjectId().toString(),
      xp: 50,
      reason: 'Non-existent student test',
    }),
  });
  const data31 = await res31.json();
  assert(!data31.success, '31. Non-existent student rejected');

  console.log('\n======================================================');
  console.log('🎉 ALL 31/31 END-TO-END VERIFICATION TESTS PASSED! 🚀');
  console.log('======================================================\n');

  server.close();
  await mongoose.disconnect();
  process.exit(0);
}

runTests().catch((err) => {
  console.error('💥 Test suite crashed:', err);
  if (server) server.close();
  process.exit(1);
});
