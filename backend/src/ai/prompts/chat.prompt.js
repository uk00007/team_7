const { buildChatbotPrompt } = require("./chatbot.prompt");

function buildChatPrompt(snapshot, message) {
    return buildChatbotPrompt({
        context: {
            student: snapshot.student,
            progress: snapshot.progress,
            performance: {
                strongAreas: snapshot.strengths,
                weakAreas: snapshot.weakAreas
            },
            achievements: snapshot.achievements
        },
        message,
        intent: "GENERAL"
    });
}

module.exports = {
    buildChatPrompt,
    buildChatbotPrompt
};
