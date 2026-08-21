const Submission = require("../models/Submission");
const { applyIfAvailable, executeQuery, hasModelMethod, isValidObjectId, normalizeArray } = require("./modelUtils");

async function getStudentSubmissions(studentId) {
    if (!studentId || !isValidObjectId(studentId) || !hasModelMethod(Submission, "find")) {
        // TODO: Replace the placeholder Submission model with a Mongoose model to enable performance context.
        return [];
    }

    try {
        let query = Submission.find({ studentId });
        query = applyIfAvailable(query, "sort", { submittedAt: -1, reviewedAt: -1 });

        return normalizeArray(await executeQuery(query));
    } catch (error) {
        throw new Error(`Unable to fetch student submissions: ${error.message}`);
    }
}

module.exports = {
    getStudentSubmissions
};
