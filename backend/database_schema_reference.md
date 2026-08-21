# Katalyst Platform - Database Schema Reference (For ML/AI Integrations)

This document contains the structural specifications, fields, and relationships of the MongoDB schemas. Sharing this directly with your ML/AI teammate will allow them to configure their LLM System Prompts, RAG context, or Tool/Function calling parameters correctly.

---

## 1. Schema Specifications

### User Schema
Represents student and administrator profiles.
- `id` / `_id`: `ObjectId` (Unique identifier)
- `name`: `String` (User's full name)
- `email`: `String` (Unique, normalized email address)
- `password`: `String` (AES-256 encrypted password stored in DB)
- `decryptedPassword`: `String` (Virtual field; backend decrypts on query)
- `role`: `String` (Enum: `STUDENT` or `ADMIN`)
- `teamId`: `ObjectId` (Ref: `Team`; null if not in a team)
- `totalXP`: `Number` (Accumulated points balance; updated via transactions only)
- `currentLevel`: `Number` (Calculated as `Math.floor(totalXP / 100) + 1`)
- `currentStreak`: `Number` (Days active consecutively)
- `longestStreak`: `Number` (Record active streak)
- `createdAt` / `updatedAt`: `Date` (Timestamps)

### Activity Schema
Represents workshops, sessions, and mentorship tasks.
- `id` / `_id`: `ObjectId`
- `title`: `String` (Name of activity)
- `description`: `String` (Long description)
- `type`: `String` (e.g. `WORKSHOP`, `SESSION`, `ASSIGNMENT`)
- `category`: `String` (e.g. `TECHNICAL`, `SOFT_SKILLS`, `LEADERSHIP`, `MENTORSHIP`)
- `isMandatory`: `Boolean`
- `isTeamBased`: `Boolean`
- `maxXP`: `Number` (Maximum XP reward achievable)
- `startDate`: `Date`
- `dueDate`: `Date`
- `certificateRequired`: `Boolean`
- `createdBy`: `ObjectId` (Ref: `User` - Admin)
- `status`: `String` (Enum: `DRAFT`, `ACTIVE`, `COMPLETED`, `CANCELLED`)

### Enrollment Schema
Tracks a student's enrollment and progress on an activity.
- `id` / `_id`: `ObjectId`
- `studentId`: `ObjectId` (Ref: `User`)
- `activityId`: `ObjectId` (Ref: `Activity`)
- `status`: `String` (Enum: `ENROLLED`, `IN_PROGRESS`, `SUBMITTED`, `UNDER_REVIEW`, `COMPLETED`, `REJECTED`)
- `progress`: `Number` (Percentage completion: `0` to `100`)
- `enrolledAt`: `Date`
- `submittedAt`: `Date` (Null until submitted)
- `completedAt`: `Date` (Null until completed)

### Submission Schema
Represents code assignments, feedback forms, or certificate uploads.
- `id` / `_id`: `ObjectId`
- `activityId`: `ObjectId` (Ref: `Activity`)
- `studentId`: `ObjectId` (Ref: `User`)
- `teamId`: `ObjectId` (Ref: `Team`; optional)
- `content`: `String` (Student response text or repository links)
- `attachmentUrl`: `String` (S3/Cloudinary upload link)
- `certificateUrl`: `String` (S3 upload link for certificate validations)
- `status`: `String` (Enum: `PENDING`, `APPROVED`, `REJECTED`)
- `score`: `Number` (Graded score: `0` to `100`)
- `xpAwarded`: `Number` (Points awarded on approval)
- `reviewerId`: `ObjectId` (Ref: `User` - Admin reviewer)
- `reviewerFeedback`: `String` (Feedback text)
- `submittedAt`: `Date`
- `reviewedAt`: `Date`

### XPTransaction Schema
Immutable financial-ledger-style tracking of user XP changes.
- `id` / `_id`: `ObjectId`
- `studentId`: `ObjectId` (Ref: `User`)
- `activityId`: `ObjectId` (Ref: `Activity`; optional)
- `submissionId`: `ObjectId` (Ref: `Submission`; optional)
- `xp`: `Number` (Positive or negative XP change)
- `reason`: `String` (Short explanation of award/deduction)
- `type`: `String` (Enum: `ADD`, `SUBTRACT`)
- `awardedBy`: `ObjectId` (Ref: `User` - system or Admin ID)
- `createdAt`: `Date`

### Team Schema
Represents a gamified student squad.
- `id` / `_id`: `ObjectId`
- `name`: `String` (Unique team name)
- `description`: `String`
- `createdBy`: `ObjectId` (Ref: `User`)
- `memberIds`: `Array[ObjectId]` (Refs: `User` - array of student members)
- `totalXP`: `Number` (Aggregate sum of team member XP)
- `createdAt` / `updatedAt`: `Date`

### Achievement Schema
Global list of unlockable awards.
- `id` / `_id`: `ObjectId`
- `name`: `String` (Unique name, e.g. "Streak Starter")
- `description`: `String` (Unlock text, e.g. "Unlock by maintaining a 3-day activity streak")
- `icon`: `String` (Icon identifier class)
- `criteria`: `String` (Condition check string)
- `xpReward`: `Number` (Bonus points given on unlock)
- `type`: `String` (e.g. `STREAK`, `XP_MILESTONE`, `ACTIVITY_COUNT`)

### StudentAchievement Schema
Intersection model mapping user unlocks.
- `id` / `_id`: `ObjectId`
- `studentId`: `ObjectId` (Ref: `User`)
- `achievementId`: `ObjectId` (Ref: `Achievement`)
- `unlockedAt`: `Date`
- `progress`: `Number` (Unlock progress percentage)

### Notification Schema
Alert logs for push updates or dashboard feeds.
- `id` / `_id`: `ObjectId`
- `userId`: `ObjectId` (Ref: `User`)
- `type`: `String` (e.g. `SYSTEM`, `ACHIEVEMENT`, `XP`, `ASSIGNMENT`)
- `title`: `String`
- `message`: `String`
- `relatedActivityId`: `ObjectId` (Ref: `Activity`; optional)
- `isRead`: `Boolean`
- `createdAt`: `Date`
- `expiresAt`: `Date`

### Certificate Schema
Tracks physical certificates that were uploaded and reviewed.
- `id` / `_id`: `ObjectId`
- `studentId`: `ObjectId` (Ref: `User`)
- `activityId`: `ObjectId` (Ref: `Activity`)
- `certificateUrl`: `String`
- `certificateName`: `String`
- `issuer`: `String`
- `issueDate`: `Date`
- `status`: `String` (Enum: `VALID`, `INVALID`, `REVOKED`, `UNDER_REVIEW`)
- `validationScore`: `Number`
- `reviewerId`: `ObjectId` (Ref: `User`)
- `reviewerFeedback`: `String`
- `xpAwarded`: `Number`

### Quiz Schema
Quiz assessments belonging to an activity.
- `id` / `_id`: `ObjectId`
- `activityId`: `ObjectId` (Ref: `Activity`)
- `title`: `String`
- `questions`: `Array[ObjectId]` (Refs: `Question`)
- `maxScore`: `Number`
- `xp`: `Number` (Reward for passing)
- `passingScore`: `Number`

### Question Schema
Standalone question items within quizzes.
- `id` / `_id`: `ObjectId`
- `question`: `String` (Question text)
- `options`: `Array[String]` (Answer options)
- `correctAnswer`: `String` (The correct answer string matching one of the options)
- `points`: `Number` (Score value)
- `explanation`: `String` (Why the correct option is right)

---

## 2. Core Enums and Status Mappings

Share this with the ML team so their chatbot can classify parameters correctly when invoking backend functions:
* **Roles**: `STUDENT`, `ADMIN`
* **Enrollment Statuses**: `ENROLLED`, `IN_PROGRESS`, `SUBMITTED`, `UNDER_REVIEW`, `COMPLETED`, `REJECTED`
* **Submission Statuses**: `PENDING`, `APPROVED`, `REJECTED`
* **Certificate Statuses**: `VALID`, `INVALID`, `REVOKED`, `UNDER_REVIEW`
* **Activity Statuses**: `DRAFT`, `ACTIVE`, `COMPLETED`, `CANCELLED`
* **XP Transaction Types**: `ADD`, `SUBTRACT`
