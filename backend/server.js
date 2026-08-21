require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const morgan    = require('morgan');
const connectDB = require('./config/db');
const levelService = require('./services/levelService');
const xpSettingsSvc = require('./services/xpSettingsService');
const { errorHandler, notFoundHandler } = require('./middleware/error.middleware');

const app = express();

// ── Database ──────────────────────────────────────────────────────────────────
connectDB().then(async () => {
  await levelService.getAllLevelsAsync();
  await xpSettingsSvc.getSettingsForType('COURSE');
}).catch((err) => console.error('Startup preload failed:', err.message));

// ── CORS Configuration for React + Vite Frontend ──────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
];
if (process.env.CLIENT_URL) allowedOrigins.push(process.env.CLIENT_URL);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    return callback(new Error('CORS not allowed from this origin'));
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) =>
  res.json({
    success:   true,
    message:   'Katalyst Gamification Engine is running',
    timestamp: new Date(),
    env:       process.env.NODE_ENV || 'development',
  })
);

// ── Platform Routes ─────────────────────────────────────────────────────────
app.use('/api/auth',          require('./routes/auth.routes'));
app.use('/api/activities',    require('./routes/activity.routes'));
app.use('/api/enrollments',   require('./routes/enrollment.routes'));
app.use('/api/submissions',   require('./routes/submission.routes'));
app.use('/api/teams',         require('./routes/team.routes'));
app.use('/api/quizzes',       require('./routes/quiz.routes'));
app.use('/api/certificates',  require('./routes/certificate.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/coach',         require('./routes/coach.routes'));
app.use('/api/users',         require('./routes/user.routes'));
app.use('/api/analytics',     require('./src/routes/analyticsRoutes'));
app.use('/api/reports',       require('./src/routes/reportRoutes'));

// ── Gamification Routes ───────────────────────────────────────────────────────
app.use('/api/xp',            require('./routes/xp.routes'));
app.use('/api/gamification',  require('./routes/gamification.routes'));
app.use('/api/admin',         require('./routes/admin.routes'));

// ── 404 & Error Handlers ──────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n🚀 Katalyst Gamification Engine  →  http://localhost:${PORT}`);
    console.log(`❤️  Health check               →  http://localhost:${PORT}/health`);
    console.log(`🎮 XP APIs                     →  http://localhost:${PORT}/api/xp`);
    console.log(`🏆 Gamification APIs           →  http://localhost:${PORT}/api/gamification`);
    console.log(`⚙️  Admin APIs                 →  http://localhost:${PORT}/api/admin`);
    console.log(`\n[Dev mode] JWT optional — use Authorization: Bearer <token> or x-dev-user-role: admin\n`);
  });
}

module.exports = app;
