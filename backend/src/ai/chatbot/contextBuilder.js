const userRepository = require("../../repositories/userRepository");
const enrollmentRepository = require("../../repositories/enrollmentRepository");
const activityRepository = require("../../repositories/activityRepository");
const submissionRepository = require("../../repositories/submissionRepository");
const xpRepository = require("../../repositories/xpRepository");
const achievementRepository = require("../../repositories/achievementRepository");
const certificateRepository = require("../../repositories/certificateRepository");
const notificationRepository = require("../../repositories/notificationRepository");
const { INTENTS } = require("./intentDetector");
const { ENROLLMENT_STATUS } = require("../../utils/constants");

function getValue(source, key, fallback = null) {
    return source && source[key] !== undefined && source[key] !== null ? source[key] : fallback;
}

function toId(value) {
    if (!value) {
        return null;
    }

    if (typeof value === "object" && value._id) {
        return String(value._id);
    }

    return String(value);
}

function uniqueValues(values) {
    return [...new Set(values.filter(Boolean))];
}

function buildActivityMap(activities) {
    return activities.reduce((map, activity) => {
        map.set(String(activity._id), activity);
        return map;
    }, new Map());
}

function normalizeStatus(status) {
    return String(status || "").trim().toUpperCase();
}

function summarizeStudent(student, studentId) {
    if (!student) {
        return {
            id: studentId,
            name: "Student",
            email: null,
            teamId: null,
            totalXP: null,
            currentLevel: null,
            currentStreak: null,
            longestStreak: null,
            profileAvailable: false
        };
    }

    return {
        id: String(getValue(student, "_id", studentId)),
        name: getValue(student, "name", "Student"),
        email: getValue(student, "email"),
        teamId: getValue(student, "teamId"),
        totalXP: getValue(student, "totalXP"),
        currentLevel: getValue(student, "currentLevel"),
        currentStreak: getValue(student, "currentStreak"),
        longestStreak: getValue(student, "longestStreak"),
        profileAvailable: true
    };
}

function summarizeProgress(enrollments, activityMap) {
    const completed = enrollments.filter((enrollment) => normalizeStatus(enrollment.status) === ENROLLMENT_STATUS.COMPLETED);
    const pending = enrollments.filter((enrollment) => normalizeStatus(enrollment.status) !== ENROLLMENT_STATUS.COMPLETED);

    const pendingActivities = pending.slice(0, 5).map((enrollment) => {
        const activity = activityMap.get(toId(enrollment.activityId)) || {};
        return {
            id: toId(enrollment.activityId),
            title: getValue(activity, "title", "Untitled activity"),
            type: getValue(activity, "type"),
            category: getValue(activity, "category"),
            dueDate: getValue(activity, "dueDate"),
            progress: getValue(enrollment, "progress", 0),
            status: getValue(enrollment, "status", "PENDING"),
            maxXP: getValue(activity, "maxXP")
        };
    });

    const completionRate = enrollments.length === 0
        ? null
        : Math.round((completed.length / enrollments.length) * 100);

    return {
        totalEnrollments: enrollments.length,
        completedActivities: completed.length,
        pendingActivitiesCount: pending.length,
        completionRate,
        pendingActivities,
        nextActivity: pendingActivities[0] || null
    };
}

function summarizePerformance(submissions, activityMap) {
    const reviewed = submissions.filter((submission) => typeof submission.score === "number");
    const averageScore = reviewed.length === 0
        ? null
        : Math.round(reviewed.reduce((sum, submission) => sum + submission.score, 0) / reviewed.length);

    const categoryStats = reviewed.reduce((stats, submission) => {
        const activity = activityMap.get(toId(submission.activityId)) || {};
        const category = getValue(activity, "category", "Uncategorized");

        if (!stats[category]) {
            stats[category] = { total: 0, count: 0 };
        }

        stats[category].total += submission.score;
        stats[category].count += 1;
        return stats;
    }, {});

    const categoryAverages = Object.entries(categoryStats).map(([category, stat]) => ({
        category,
        averageScore: Math.round(stat.total / stat.count)
    }));

    const weakAreas = categoryAverages
        .filter((item) => item.averageScore < 70)
        .sort((a, b) => a.averageScore - b.averageScore)
        .map((item) => item.category);

    const strongAreas = categoryAverages
        .filter((item) => item.averageScore >= 80)
        .sort((a, b) => b.averageScore - a.averageScore)
        .map((item) => item.category);

    return {
        submissionsReviewed: reviewed.length,
        averageScore,
        strongAreas,
        weakAreas,
        recentFeedback: submissions
            .filter((submission) => submission.reviewerFeedback)
            .slice(0, 3)
            .map((submission) => ({
                activityId: toId(submission.activityId),
                status: getValue(submission, "status"),
                score: getValue(submission, "score"),
                feedback: getValue(submission, "reviewerFeedback")
            }))
    };
}

function summarizeXP(student, transactions) {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();

    const currentMonthXP = transactions
        .filter((transaction) => {
            const createdAt = transaction.createdAt ? new Date(transaction.createdAt) : null;
            return createdAt
                && createdAt.getMonth() === month
                && createdAt.getFullYear() === year
                && typeof transaction.xp === "number";
        })
        .reduce((total, transaction) => total + transaction.xp, 0);

    return {
        totalXP: getValue(student, "totalXP"),
        currentLevel: getValue(student, "currentLevel"),
        currentMonthXP,
        recentTransactions: transactions.slice(0, 5).map((transaction) => ({
            xp: getValue(transaction, "xp"),
            reason: getValue(transaction, "reason"),
            type: getValue(transaction, "type"),
            createdAt: getValue(transaction, "createdAt")
        })),
        nextLevelNote: "Official next-level thresholds are not available to the AI coach."
    };
}

function summarizeAchievements(achievements) {
    const normalized = achievements.map((studentAchievement) => {
        const achievement = studentAchievement.achievementId || {};
        return {
            name: getValue(achievement, "name", getValue(studentAchievement, "name", "Achievement")),
            description: getValue(achievement, "description"),
            type: getValue(achievement, "type"),
            unlockedAt: getValue(studentAchievement, "unlockedAt"),
            progress: getValue(studentAchievement, "progress")
        };
    });

    return {
        unlocked: normalized.filter((achievement) => achievement.unlockedAt).slice(0, 5),
        inProgress: normalized.filter((achievement) => !achievement.unlockedAt).slice(0, 5),
        closeToUnlocking: normalized
            .filter((achievement) => typeof achievement.progress === "number" && achievement.progress >= 75 && !achievement.unlockedAt)
            .slice(0, 5)
    };
}

function summarizeNotifications(notifications) {
    return {
        unread: notifications
            .filter((notification) => notification.isRead === false)
            .slice(0, 5)
            .map((notification) => ({
                type: getValue(notification, "type"),
                title: getValue(notification, "title"),
                message: getValue(notification, "message"),
                relatedActivityId: toId(notification.relatedActivityId),
                createdAt: getValue(notification, "createdAt")
            })),
        recentCount: notifications.length
    };
}

function summarizeCertificates(certificates) {
    return {
        total: certificates.length,
        recent: certificates.slice(0, 3).map((certificate) => ({
            certificateName: getValue(certificate, "certificateName"),
            issuer: getValue(certificate, "issuer"),
            issueDate: getValue(certificate, "issueDate"),
            status: getValue(certificate, "status"),
            validationScore: getValue(certificate, "validationScore")
        }))
    };
}

function getActivityIds(enrollments, submissions) {
    return uniqueValues([
        ...enrollments.map((enrollment) => toId(enrollment.activityId)),
        ...submissions.map((submission) => toId(submission.activityId))
    ]);
}

async function fetchStudentIfNeeded(studentId, shouldFetch) {
    return shouldFetch ? userRepository.getStudent(studentId) : null;
}

async function buildContext(studentId, intent) {
    const needsStudent = ![INTENTS.LEARNING].includes(intent);
    const needsEnrollments = [
        INTENTS.PERFORMANCE,
        INTENTS.WEAK_AREAS,
        INTENTS.NEXT_ACTIVITY,
        INTENTS.ASSIGNMENT,
        INTENTS.QUIZ
    ].includes(intent);
    const needsSubmissions = [
        INTENTS.PERFORMANCE,
        INTENTS.WEAK_AREAS,
        INTENTS.ASSIGNMENT,
        INTENTS.QUIZ
    ].includes(intent);
    const needsXP = intent === INTENTS.XP;
    const needsAchievements = intent === INTENTS.ACHIEVEMENTS;
    const needsCertificates = intent === INTENTS.PERFORMANCE;
    const needsNotifications = [INTENTS.GENERAL, INTENTS.NEXT_ACTIVITY].includes(intent);

    const [student, enrollments, submissions, xpTransactions, achievements, certificates, notifications] = await Promise.all([
        fetchStudentIfNeeded(studentId, needsStudent),
        needsEnrollments ? enrollmentRepository.getStudentEnrollments(studentId) : [],
        needsSubmissions ? submissionRepository.getStudentSubmissions(studentId) : [],
        needsXP ? xpRepository.getXPTransactions(studentId) : [],
        needsAchievements ? achievementRepository.getAchievements(studentId) : [],
        needsCertificates ? certificateRepository.getCertificates(studentId) : [],
        needsNotifications ? notificationRepository.getNotifications(studentId) : []
    ]);

    const activityIds = getActivityIds(enrollments, submissions);
    const activities = activityIds.length > 0 ? await activityRepository.getActivities(activityIds) : [];
    const activityMap = buildActivityMap(activities);
    const normalizedStudent = summarizeStudent(student, studentId);

    return {
        intent,
        student: normalizedStudent,
        progress: needsEnrollments ? summarizeProgress(enrollments, activityMap) : {},
        performance: needsSubmissions ? summarizePerformance(submissions, activityMap) : {},
        xp: needsXP ? summarizeXP(student, xpTransactions) : {},
        achievements: needsAchievements ? summarizeAchievements(achievements) : {},
        certificates: needsCertificates ? summarizeCertificates(certificates) : {},
        notifications: needsNotifications ? summarizeNotifications(notifications) : {},
        learning: intent === INTENTS.LEARNING
            ? { databaseContextUsed: false, note: "This is a general learning question." }
            : {}
    };
}

module.exports = {
    buildContext
};
