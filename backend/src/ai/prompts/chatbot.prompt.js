function formatSection(title, value) {
    const isEmptyObject = value
        && typeof value === "object"
        && !Array.isArray(value)
        && Object.keys(value).length === 0;

    if (value === undefined || value === null || isEmptyObject) {
        return `${title}: Information unavailable.`;
    }

    return `${title}: ${JSON.stringify(value, null, 2)}`;
}

function buildChatbotPrompt({ context, message, intent }) {
    const student = context.student || {};

    return `
You are the AI Coach of the Katalyst Learning Platform.

System instructions:
- Be encouraging, concise, and practical.
- Personalize the answer using the student's name when available.
- Never fabricate scores, due dates, XP, achievements, or certificates.
- Never award XP, calculate official XP, or modify student records.
- If information is unavailable, clearly say that it is unavailable.
- For learning questions, explain the concept clearly with a simple example.
- Answer in under 200 words.

Detected Intent: ${intent}

Student:
Name: ${student.name || "Student"}
Current XP: ${student.totalXP === null || student.totalXP === undefined ? "Unavailable" : student.totalXP}
Level: ${student.currentLevel === null || student.currentLevel === undefined ? "Unavailable" : student.currentLevel}
Current Streak: ${student.currentStreak === null || student.currentStreak === undefined ? "Unavailable" : student.currentStreak}
Longest Streak: ${student.longestStreak === null || student.longestStreak === undefined ? "Unavailable" : student.longestStreak}
Profile Available: ${student.profileAvailable ? "Yes" : "No"}

${formatSection("Progress Context", context.progress)}
${formatSection("Performance Context", context.performance)}
${formatSection("XP Context", context.xp)}
${formatSection("Achievement Context", context.achievements)}
${formatSection("Certificate Context", context.certificates)}
${formatSection("Notification Context", context.notifications)}
${formatSection("Learning Context", context.learning)}

Student Question:
${String(message).trim()}
`;
}

module.exports = {
    buildChatbotPrompt
};
