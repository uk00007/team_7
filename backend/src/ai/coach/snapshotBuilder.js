const { buildContext } = require("../chatbot/contextBuilder");
const { INTENTS } = require("../chatbot/intentDetector");

async function buildStudentSnapshot(studentId) {
    const context = await buildContext(studentId, INTENTS.PERFORMANCE);

    return {
        student: context.student,
        progress: context.progress,
        strengths: context.performance.strongAreas || [],
        weakAreas: context.performance.weakAreas || [],
        achievements: []
    };
}

module.exports = {
    buildStudentSnapshot
};
