const { detectIntent } = require("./intentDetector");
const { buildContext } = require("./contextBuilder");
const { buildChatbotPrompt } = require("../prompts/chatbot.prompt");
const { generateChatResponse } = require("../gemini/geminiClient");
const { formatChatbotResponse } = require("./responseFormatter");

function validateChatRequest(studentId, message) {
    if (!studentId) {
        const error = new Error("studentId is required");
        error.statusCode = 400;
        throw error;
    }

    if (!message || !String(message).trim()) {
        const error = new Error("message is required");
        error.statusCode = 400;
        throw error;
    }
}

async function generateChatbotReply(studentId, message) {
    try {
        validateChatRequest(studentId, message);

        const intentResult = detectIntent(message);
        const context = await buildContext(studentId, intentResult.intent);
        const prompt = buildChatbotPrompt({
            context,
            message,
            intent: intentResult.intent
        });
        const reply = await generateChatResponse(prompt);

        return formatChatbotResponse({
            reply,
            intent: intentResult.intent,
            confidence: intentResult.confidence
        });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }

        error.message = error.message || "Unable to generate chatbot response";
        throw error;
    }
}

module.exports = {
    generateChatbotReply
};
