# Team-7 — Katalyst Gamified Learning Platform

A full-stack gamified learning platform designed to engage students with interactive activities, leaderboards, achievements, quizzes, automated certification, and AI-driven coaching recommendations.

## Project Structure
- `frontend/`: React + Vite client application
- `backend/`: Node.js / Express REST API backend & Gamification Engine
- `ai_service/`: AI Coach Recommendation Service (Python + FastAPI / XGBoost)
- `docs/`: Project architecture, database schemas, and API contracts

---

## Quick Start (Backend)

```bash
cd backend
cp .env.example .env          # Edit MONGODB_URI if needed
npm install
npm run seed                  # Seed demo data
npm run dev                   # Start dev server
```

Server runs at: `http://localhost:5000`

### Demo Credentials
| Role    | Email                  | Password     | XP  | Level |
|---------|------------------------|--------------|-----|-------|
| Admin   | admin@katalyst.com     | password123  | -   | -     |
| Student | aarav@katalyst.com     | password123  | 174 | 2     |
| Student | priya@katalyst.com     | password123  | 315 | 3 ⭐  |
| Student | rohan@katalyst.com     | password123  | 45  | 1 (pending submission for review demo) |
| Student | sanya@katalyst.com     | password123  | 80  | 1     |
| Student | vikram@katalyst.com    | password123  | 30  | 1 (streak at risk) |

---

## Backend Architecture

```
backend/
├── config/
│   ├── db.js                         # MongoDB connection
│   └── levels.js                     # Configurable fallback level thresholds & streak bonuses
├── models/
│   ├── User.js                       # Shared contract model
│   ├── Activity.js                   # Shared contract model (TRAINING, COURSE, MENTORING, COACHING, PROJECT, ASSIGNMENT, QUIZ, PUZZLE, CERTIFICATE, MILESTONE)
│   ├── Submission.js                 # Shared contract model (with review & two-step preview fields)
│   ├── Team.js                       # Shared contract model
│   ├── Notification.js               # Shared contract model
│   ├── XPTransaction.js              # Every XP change tracked atomically
│   ├── XPSettings.js                 # Admin-configured XP rules per activity type
│   ├── LevelDefinition.js            # Admin-managed level definitions in DB
│   ├── Achievement.js                # Achievement definitions
│   ├── StudentAchievement.js         # Per-student achievement unlocks
│   ├── Milestone.js                  # Milestone definitions
│   ├── StudentMilestone.js           # Per-student milestone progress
│   └── AuditLog.js                   # Immutable audit log for sensitive admin actions
├── controllers/
│   ├── adminGamification.controller.js # Admin configuration & monitoring
│   ├── review.controller.js          # Two-step human-in-the-loop review
│   ├── xp.controller.js              # XP queries and manual award
│   ├── gamification.controller.js    # Student gamification profile & progress
│   └── admin.controller.js           # Combined admin facade
├── services/
│   ├── xpService.js                  # Central XP engine (ONLY place User.totalXP is modified)
│   ├── scoringService.js             # Centralized scoring & reward computation
│   ├── xpSettingsService.js          # DB-driven XP rule lookup & caching
│   ├── levelService.js               # Level computation & progression
│   ├── milestoneService.js           # Milestone tracking & bonus triggers
│   ├── achievementService.js         # Achievement criteria evaluation
│   ├── streakService.js              # Streak tracking & milestone bonuses
│   ├── leaderboardService.js         # Individual & team leaderboards (All-time / Monthly / Yearly)
│   ├── participationService.js       # Admin participation monitoring & analytics feed
│   ├── auditService.js               # Immutable audit logging
│   └── notificationService.js        # Notification generation
├── routes/
│   ├── adminGamification.routes.js   # /api/admin/gamification/*
│   ├── admin.routes.js               # /api/admin/*
│   ├── gamification.routes.js        # /api/gamification/*
│   └── xp.routes.js                  # /api/xp/*
├── middleware/
│   ├── auth.middleware.js            # JWT verification & dev passthrough
│   ├── role.middleware.js            # Role-based authorization (adminOnly)
│   └── error.middleware.js           # Centralized error handler & 404
├── validators/
│   └── admin.validators.js           # Joi schemas for input validation
├── utils/
│   └── response.js                   # Standard { success, message, data } API response format
├── seed/
│   └── seed.js                       # Comprehensive hackathon demo seed script
├── tests/
│   └── e2e.test.js                   # 31-point comprehensive end-to-end test suite
└── server.js                         # Express entry point
```

---

## API Reference

### XP APIs (`/api/xp`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/xp/award` | Award XP (creates XPTransaction, cascades side-effects) |
| GET | `/api/xp/student/:studentId` | Student XP summary + monthly/yearly totals |
| GET | `/api/xp/leaderboard` | All-time individual leaderboard |
| GET | `/api/xp/leaderboard/monthly` | Monthly individual leaderboard |
| GET | `/api/xp/leaderboard/yearly` | Yearly individual leaderboard |
| GET | `/api/xp/team/:teamId` | Team XP summary & member breakdown |

### Gamification APIs (`/api/gamification`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/gamification/levels` | Level definitions |
| GET | `/api/gamification/milestones` | Platform milestones (query `?studentId=...` for progress) |
| GET | `/api/gamification/achievements` | Achievements (query `?studentId=...` for unlock status) |
| GET | `/api/gamification/streak/:studentId` | Student streak details & upcoming bonuses |
| GET | `/api/gamification/student/:studentId` | Full gamification profile (XP, level, streak, achievements, chart) |
| GET | `/api/gamification/team-leaderboard` | All-time team leaderboard |
| GET | `/api/gamification/transactions/:studentId` | Paginated student XP transaction history |

### Admin APIs (`/api/admin`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/admin/gamification/xp-settings` | List / Create XP rule per activity type |
| PUT/DELETE | `/api/admin/gamification/xp-settings/:id` | Update / Delete XP rule |
| GET/POST | `/api/admin/gamification/levels` | List / Create level definitions |
| PUT/DELETE | `/api/admin/gamification/levels/:id` | Update / Delete level definition |
| GET/POST | `/api/admin/gamification/milestones` | List / Create milestone definitions |
| PUT/DELETE | `/api/admin/gamification/milestones/:id` | Update / Delete milestone definition |
| GET/POST | `/api/admin/gamification/achievements` | List / Create achievement definitions |
| PUT/DELETE | `/api/admin/gamification/achievements/:id` | Update / Delete achievement definition |
| GET | `/api/admin/reviews` | List submissions pending review (with filters) |
| POST | `/api/admin/reviews/:submissionId` | Step 1: Human review & XP preview calculation |
| POST | `/api/admin/reviews/:submissionId/confirm` | Step 2: Confirm review & officially award XP |
| POST | `/api/admin/gamification/manual-award` | Manual XP award |
| GET | `/api/admin/gamification/participation` | Participation monitoring data |
| GET | `/api/admin/gamification/summary` | Overall gamification platform summary |
| GET | `/api/admin/gamification/xp-transactions` | Filterable XP transaction audit log |
| GET | `/api/admin/gamification/audit` | Admin action audit log |
