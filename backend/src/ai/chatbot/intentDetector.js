const INTENTS = Object.freeze({
    GENERAL: "GENERAL",
    PERFORMANCE: "PERFORMANCE",
    XP: "XP",
    WEAK_AREAS: "WEAK_AREAS",
    NEXT_ACTIVITY: "NEXT_ACTIVITY",
    STREAK: "STREAK",
    ACHIEVEMENTS: "ACHIEVEMENTS",
    LEARNING: "LEARNING",
    ASSIGNMENT: "ASSIGNMENT",
    QUIZ: "QUIZ",
    UNKNOWN: "UNKNOWN"
});

const intentRules = [
    {
        intent: INTENTS.PERFORMANCE,
        keywords: ["performing", "performance", "progress", "doing", "improve", "growth", "status", "report"]
    },
    {
        intent: INTENTS.XP,
        keywords: ["xp", "points", "earned", "month", "level", "next level", "score"]
    },
    {
        intent: INTENTS.WEAK_AREAS,
        keywords: ["weak", "weakness", "struggling", "struggle", "hard", "difficult", "mistakes", "improve on"]
    },
    {
        intent: INTENTS.NEXT_ACTIVITY,
        keywords: ["today", "next", "complete", "pending", "activity", "activities", "due", "deadline", "recommended"]
    },
    {
        intent: INTENTS.STREAK,
        keywords: ["streak", "daily", "consistent", "consistency", "longest streak"]
    },
    {
        intent: INTENTS.ACHIEVEMENTS,
        keywords: ["achievement", "badge", "unlock", "milestone", "close to", "reward"]
    },
    {
        intent: INTENTS.ASSIGNMENT,
        keywords: ["assignment", "submission", "submit", "project", "task", "feedback", "review"]
    },
    {
        intent: INTENTS.QUIZ,
        keywords: ["quiz", "question", "answer", "mcq", "option", "explain this question"]
    },
    {
        intent: INTENTS.LEARNING,
        keywords: ["explain", "teach", "learn", "understand", "concept", "recursion", "example", "help me learn"]
    },
    {
        intent: INTENTS.GENERAL,
        keywords: ["hi", "hello", "hey", "thanks", "thank you", "coach", "help"]
    }
];

function countKeywordHits(message, keywords) {
    return keywords.reduce((count, keyword) => {
        return message.includes(keyword) ? count + 1 : count;
    }, 0);
}

function detectIntent(message) {
    const normalizedMessage = String(message || "").trim().toLowerCase();

    if (!normalizedMessage) {
        return {
            intent: INTENTS.UNKNOWN,
            confidence: 0
        };
    }

    const rankedMatches = intentRules
        .map((rule) => {
            const hits = countKeywordHits(normalizedMessage, rule.keywords);
            return {
                intent: rule.intent,
                hits,
                confidence: hits === 0 ? 0 : Math.min(0.95, 0.45 + hits * 0.2)
            };
        })
        .filter((match) => match.hits > 0)
        .sort((a, b) => b.confidence - a.confidence);

    if (rankedMatches.length === 0) {
        return {
            intent: INTENTS.UNKNOWN,
            confidence: 0.2
        };
    }

    return {
        intent: rankedMatches[0].intent,
        confidence: Number(rankedMatches[0].confidence.toFixed(2))
    };
}

module.exports = {
    INTENTS,
    detectIntent
};
