const { GoogleGenerativeAI } = require("@google/generative-ai");
const env = require("../../config/env");

let modelInstance = null;

function getModel() {
    if (!env.geminiApiKey) {
        const error = new Error("Missing GEMINI_API_KEY. Add it to the backend .env file to enable AI coach replies.");
        error.statusCode = 503;
        throw error;
    }

    if (!modelInstance) {
        const genAI = new GoogleGenerativeAI(env.geminiApiKey);
        modelInstance = genAI.getGenerativeModel({
            model: env.geminiModel
        });
    }

    return modelInstance;
}

async function generateChatResponse(prompt) {
    if (!prompt || !String(prompt).trim()) {
        const error = new Error("Prompt is required to generate a chat response.");
        error.statusCode = 400;
        throw error;
    }

    try {
        const result = await getModel().generateContent(prompt);
        const text = result && result.response && typeof result.response.text === "function"
            ? result.response.text()
            : "";

        if (!text) {
            throw new Error("Gemini returned an empty response.");
        }

        return text;
    } catch (error) {
        if (error.statusCode) {
            throw error;
        }

        const wrappedError = new Error(`Unable to generate Gemini response: ${error.message}`);
        wrappedError.statusCode = 502;
        throw wrappedError;
    }
}

module.exports = {
    generateChatResponse
};
