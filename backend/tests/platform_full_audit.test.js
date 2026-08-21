const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../server');

const PORT = 5088;
let server;

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
const BASE = `http://localhost:${PORT}`;

async function runFullPlatformAudit() {
  console.log('🧪 Starting Comprehensive Full-Stack Platform Audit (A through W)...\n');

  server = app.listen(PORT);

  if (mongoose.connection.readyState !== 1) {
    await new Promise((resolve) => mongoose.connection.once('open', resolve));
  }

  const User = require('../models/User');
  const Team = require('../models/Team');
  const Activity = require('../models/Activity');
  const Submission = require('../models/Submission');
  const Enrollment = require('../models/Enrollment');
  const Quiz = require('../models/Quiz');
  const Question = require('../models/Question');
  const Certificate = require('../models/Certificate');
  const Notification = require('../models/Notification');
  const XPTransaction = require('../models/XPTransaction');
  const Achievement = require('../models/Achievement');
  const StudentAchievement = require('../models/StudentAchievement');
  const Milestone = require('../models/Milestone');
  const StudentMilestone = require('../models/StudentMilestone');
  const XPSettings = require('../models/XPSettings');
  const LevelDefinition = require('../models/LevelDefinition');
  const AuditLog = require('../models/AuditLog');

  // Clear test DB
  await Promise.all([
    User.deleteMany({}),
    Team.deleteMany({}),
    Activity.deleteMany({}),
    Submission.deleteMany({}),
    Enrollment.deleteMany({}),
    Quiz.deleteMany({}),
    Question.deleteMany({}),
    Certificate.deleteMany({}),
    Notification.deleteMany({}),
    XPTransaction.deleteMany({}),
    Achievement.deleteMany({}),
    StudentAchievement.deleteMany({}),
    Milestone.deleteMany({}),
    StudentMilestone.deleteMany({}),
    XPSettings.deleteMany({}),
    LevelDefinition.deleteMany({}),
    AuditLog.deleteMany({}),
  ]);

  let passCount = 0;
  let testIndex = 0;

  function assert(cond, msg) {
    testIndex++;
    if (!cond) {
      console.error(`❌ FAIL [${testIndex}]: ${msg}`);
      throw new Error(`${testIndex}. ${msg}`);
    }
    passCount++;
    console.log(`✅ PASS [${testIndex}]: ${msg}`);
  }

  try {
    // =========================================================================
    // SECTION A: AUTHENTICATION & ROLE AUTHORIZATION
    // =========================================================================
    // 1. Student Registration
    const regRes = await fetch(`${BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Aarav Student', email: 'aarav@test.com', password: 'password123', role: 'student' }),
    });
    const regData = await regRes.json();
    assert(regRes.status === 201 && regData.success && regData.data.token, 'A1. Student registered successfully');
    const studentToken = regData.data.token;
    const studentId = regData.data.user.id;

    // 2. Admin Registration
    const adminRegRes = await fetch(`${BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Admin User', email: 'admin@test.com', password: 'password123', role: 'admin' }),
    });
    const adminRegData = await adminRegRes.json();
    assert(adminRegRes.status === 201 && adminRegData.success && adminRegData.data.token, 'A2. Admin registered successfully');
    const adminToken = adminRegData.data.token;
    const adminId = adminRegData.data.user.id;

    // 3. Login
    const loginRes = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'aarav@test.com', password: 'password123' }),
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200 && loginData.success && loginData.data.token, 'A3. Student login successful');

    // 4. Current User (GET /auth/me)
    const meRes = await fetch(`${BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const meData = await meRes.json();
    assert(meRes.status === 200 && meData.data.email === 'aarav@test.com', 'A4. GET /auth/me returns authenticated user');

    // 5. Invalid / Unauthorized token handling
    const badTokenRes = await fetch(`${BASE}/api/admin/gamification/xp-settings`, {
      headers: { Authorization: 'Bearer invalid_token_xyz' },
    });
    assert(badTokenRes.status === 401, 'A5. Invalid token returns 401 Unauthorized');

    const forbiddenRes = await fetch(`${BASE}/api/admin/gamification/xp-settings`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(forbiddenRes.status === 403, 'A6. Student accessing admin route returns 403 Forbidden');

    // =========================================================================
    // SECTION B: ACTIVITY / COURSE MANAGEMENT
    // =========================================================================
    // 6. Admin creates activities of various types
    const actRes = await fetch(`${BASE}/api/activities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        title: 'Full Stack Node.js Masterclass',
        description: 'Learn backend development',
        type: 'COURSE',
        category: 'ENGINEERING',
        isMandatory: true,
        maxXP: 100,
        status: 'PUBLISHED',
      }),
    });
    const actData = await actRes.json();
    assert(actRes.status === 201 && actData.data._id, 'B1. Admin creates COURSE activity');
    const courseActivityId = actData.data._id;

    const quizActRes = await fetch(`${BASE}/api/activities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        title: 'JavaScript Fundamentals Quiz',
        description: 'Test your JS knowledge',
        type: 'QUIZ',
        maxXP: 50,
        status: 'PUBLISHED',
      }),
    });
    const quizActData = await quizActRes.json();
    assert(quizActRes.status === 201 && quizActData.data._id, 'B2. Admin creates QUIZ activity');
    const quizActivityId = quizActData.data._id;

    // 7. Student lists activities
    const listActRes = await fetch(`${BASE}/api/activities`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const listActData = await listActRes.json();
    assert(listActRes.status === 200 && listActData.data.activities.length >= 2, 'B3. Student lists available activities');

    // =========================================================================
    // SECTION C & D: STUDENT ENROLLMENT, SUBMISSION & ADMIN REVIEW FLOW
    // =========================================================================
    // 8. Student Enrolls in Course
    const enrollRes = await fetch(`${BASE}/api/enrollments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({ activityId: courseActivityId }),
    });
    const enrollData = await enrollRes.json();
    assert(enrollRes.status === 201 && enrollData.data.status === 'ENROLLED', 'C1. Student enrolls in activity');

    // 9. Student Submits Work
    const submitRes = await fetch(`${BASE}/api/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        activityId: courseActivityId,
        content: 'https://github.com/student/my-project',
      }),
    });
    const submitData = await submitRes.json();
    assert(submitRes.status === 201 && submitData.data.status === 'PENDING', 'C2. Student submits work in PENDING state');
    const submissionId = submitData.data._id;

    // 10. Admin Views Pending Submissions
    const pendingRes = await fetch(`${BASE}/api/admin/reviews?status=PENDING`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const pendingData = await pendingRes.json();
    assert(pendingRes.status === 200 && pendingData.data.submissions.length >= 1, 'D1. Admin views pending submission list');

    // 11. Admin Reviews & Calculates XP Preview (Step 1)
    const reviewRes = await fetch(`${BASE}/api/admin/reviews/${submissionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ score: 95, reviewerFeedback: 'Excellent project architecture!' }),
    });
    const reviewData = await reviewRes.json();
    assert(
      reviewRes.status === 200 &&
      reviewData.data.submission.reviewStep === 'CALCULATED' &&
      reviewData.data.preview.individualXP > 0,
      'D2. Admin reviews and calculates XP preview (No official XP awarded yet)'
    );

    // Verify User.totalXP is still 0 before confirmation
    const userPreConfirm = await User.findById(studentId);
    assert(userPreConfirm.totalXP === 0, 'D3. User.totalXP is 0 prior to confirmation');

    // 12. Admin Confirms Review & Awards XP (Step 2)
    const confirmRes = await fetch(`${BASE}/api/admin/reviews/${submissionId}/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ notes: 'Approved' }),
    });
    const confirmData = await confirmRes.json();
    assert(confirmRes.status === 200 && confirmData.data.submission.status === 'APPROVED', 'D4. Admin confirms review and triggers official XP award');

    // 13. Duplicate Confirmation Safely Blocked
    const dupConfirmRes = await fetch(`${BASE}/api/admin/reviews/${submissionId}/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ notes: 'Duplicate try' }),
    });
    assert(dupConfirmRes.status >= 400, 'D5. Duplicate review confirmation safely blocked');

    // 14. Verify XPTransaction and User.totalXP
    const userPostConfirm = await User.findById(studentId);
    const txCount = await XPTransaction.countDocuments({ studentId });
    assert(userPostConfirm.totalXP > 0 && txCount >= 1, `E1. XPTransaction recorded (${txCount} txs) and User.totalXP updated (${userPostConfirm.totalXP} XP)`);

    // =========================================================================
    // SECTION E, F, G, H, I, J, K: GAMIFICATION ENGINE
    // =========================================================================
    // 15. Admin XP Settings CRUD
    const xpSetRes = await fetch(`${BASE}/api/admin/gamification/xp-settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ activityType: 'TRAINING', baseXP: 50, maxXP: 100, passingScore: 60 }),
    });
    const xpSetData = await xpSetRes.json();
    assert(xpSetRes.status === 201 && xpSetData.data.activityType === 'TRAINING', 'F1. Admin creates XP Setting');

    // 16. Admin Level Definition CRUD
    const levelRes = await fetch(`${BASE}/api/admin/gamification/levels`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ level: 2, title: 'Scholar', minXP: 100, maxXP: 250, badge: 'scholar.png' }),
    });
    const levelData = await levelRes.json();
    assert(levelRes.status === 201 && levelData.data.level === 2, 'G1. Admin creates Level Definition');

    // 17. Admin Milestone CRUD
    const milestoneRes = await fetch(`${BASE}/api/admin/gamification/milestones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: 'First Milestone',
        description: 'Complete 1 activity',
        criteria: { type: 'ACTIVITY_COUNT', value: 1 },
        xpReward: 30,
      }),
    });
    const milestoneData = await milestoneRes.json();
    assert(milestoneRes.status === 201 && milestoneData.data.name === 'First Milestone', 'H1. Admin creates Milestone');

    // 18. Admin Achievement CRUD
    const achRes = await fetch(`${BASE}/api/admin/gamification/achievements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: 'Master Starter',
        description: 'Reach Level 2',
        criteria: { type: 'LEVEL_REACHED', value: 2 },
        xpReward: 40,
      }),
    });
    const achData = await achRes.json();
    assert(achRes.status === 201 && achData.data.name === 'Master Starter', 'I1. Admin creates Achievement');

    // 19. Leaderboard Queries
    const lbRes = await fetch(`${BASE}/api/xp/leaderboard`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const lbData = await lbRes.json();
    assert(lbRes.status === 200 && lbData.data.leaderboard.length >= 1, 'K1. Individual leaderboard returns ranking');

    // =========================================================================
    // SECTION L: TEAMS
    // =========================================================================
    // 20. Team Management
    const teamRes = await fetch(`${BASE}/api/teams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({ name: 'Alpha Innovators', description: 'Hackathon team' }),
    });
    const teamData = await teamRes.json();
    assert(teamRes.status === 201 && teamData.data.name === 'Alpha Innovators', 'L1. Student creates team');
    const teamId = teamData.data._id;

    const myTeamRes = await fetch(`${BASE}/api/teams/my-team`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const myTeamData = await myTeamRes.json();
    assert(myTeamRes.status === 200 && myTeamData.data._id.toString() === teamId.toString(), 'L2. Student retrieves my-team');

    // =========================================================================
    // SECTION R: QUIZ ENGINE
    // =========================================================================
    // 21. Quiz Engine with Scoring and XP Award
    const quizCreateRes = await fetch(`${BASE}/api/quizzes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        activityId: quizActivityId,
        title: 'JS Basics Quiz',
        maxScore: 100,
        xp: 40,
        passingScore: 50,
        questions: [
          { question: 'What is 2+2?', options: ['3', '4', '5'], correctAnswer: '4', points: 1 },
          { question: 'Is JS single threaded?', options: ['Yes', 'No'], correctAnswer: 'Yes', points: 1 },
        ],
      }),
    });
    const quizCreateData = await quizCreateRes.json();
    assert(quizCreateRes.status === 201 && quizCreateData.data._id, 'R1. Admin creates Quiz with questions');
    const quizId = quizCreateData.data._id;

    // Student Submits Quiz
    const quizSubmitRes = await fetch(`${BASE}/api/quizzes/${quizId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        answers: [
          { questionId: quizCreateData.data.questions[0], answer: '4' },
          { questionId: quizCreateData.data.questions[1], answer: 'Yes' },
        ],
      }),
    });
    const quizSubmitData = await quizSubmitRes.json();
    assert(quizSubmitRes.status === 200 && quizSubmitData.data.passed && quizSubmitData.data.score === 100, 'R2. Student passes quiz with score 100% and receives XP');

    // =========================================================================
    // SECTION T: CERTIFICATES
    // =========================================================================
    // 22. Certificate Upload & Validation
    const certUploadRes = await fetch(`${BASE}/api/certificates/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        activityId: courseActivityId,
        certificateUrl: 'https://cdn.katalyst.org/certs/sample.pdf',
        certificateName: 'Node.js Certified Developer',
      }),
    });
    const certUploadData = await certUploadRes.json();
    assert(certUploadRes.status === 201 && certUploadData.data.status === 'PENDING', 'T1. Student uploads certificate');
    const certId = certUploadData.data._id;

    const certValRes = await fetch(`${BASE}/api/certificates/${certId}/validate`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'VALIDATED', validationScore: 100, xpAwarded: 50 }),
    });
    const certValData = await certValRes.json();
    assert(certValRes.status === 200 && certValData.data.status === 'VALIDATED', 'T2. Admin validates certificate and awards XP');

    // =========================================================================
    // SECTION Q: NOTIFICATIONS
    // =========================================================================
    // 23. Notification Listing & Mark Read
    const notifRes = await fetch(`${BASE}/api/notifications`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const notifData = await notifRes.json();
    assert(notifRes.status === 200 && notifData.data.notifications !== undefined, 'Q1. Student lists notifications');

    // =========================================================================
    // SECTION U: AI COACH
    // =========================================================================
    // 24. AI Coach Recommendations
    const coachRes = await fetch(`${BASE}/api/coach/recommendation`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const coachData = await coachRes.json();
    assert(coachRes.status === 200 && coachData.data.recommendedActivities !== undefined, 'U1. Student receives AI Coach recommendations');

    // =========================================================================
    // SECTION M, N, P: ANALYTICS & REPORTS
    // =========================================================================
    // 25. Student Dashboard Analytics
    const analyticsRes = await fetch(`${BASE}/api/analytics/student/${studentId}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const analyticsData = await analyticsRes.json();
    assert(analyticsRes.status === 200 && analyticsData.data.metrics !== undefined, 'M1. Student analytics dashboard returns real metrics');

    // 26. Admin Management Analytics
    const adminAnalyticsRes = await fetch(`${BASE}/api/analytics/admin`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminAnalyticsData = await adminAnalyticsRes.json();
    assert(adminAnalyticsRes.status === 200 && adminAnalyticsData.data.summary !== undefined, 'M2. Admin analytics returns comprehensive platform summary');

    // 27. Reports Generation
    const reportRes = await fetch(`${BASE}/api/reports/student/${studentId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const reportData = await reportRes.json();
    assert(reportRes.status === 200 && reportData.data.student !== undefined, 'P1. Structured Student Report generated');

    console.log(`\n======================================================`);
    console.log(`🎉 ALL ${passCount}/${testIndex} PLATFORM INTEGRATION AUDIT TESTS PASSED!`);
    console.log(`======================================================\n`);

  } catch (err) {
    console.error('Audit crashed:', err);
    process.exitCode = 1;
  } finally {
    if (server) server.close();
  }
}

runFullPlatformAudit();
