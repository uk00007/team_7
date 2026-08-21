const { GoogleGenerativeAI } = require("@google/generative-ai");
const env = require("./env");

if (!env.geminiApiKey) {
    throw new Error("Missing GEMINI_API_KEY");
}

const genAI = new GoogleGenerativeAI(env.geminiApiKey);

const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || "gemini-3.5-flash"
});

module.exports = {
    model
};
