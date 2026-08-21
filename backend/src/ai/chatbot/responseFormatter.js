function normalizeReply(reply) {
    const fallback = "I could not generate a coach response right now. Please try again in a moment.";
    return String(reply || fallback).trim();
}

function formatChatbotResponse({ reply, intent, confidence }) {
    return {
        reply: normalizeReply(reply),
        intent,
        generatedAt: new Date().toISOString(),
        confidence
    };
}

module.exports = {
    formatChatbotResponse
};
