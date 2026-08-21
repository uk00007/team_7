const Enrollment = require("../models/Enrollment");
const { applyIfAvailable, executeQuery, hasModelMethod, isValidObjectId, normalizeArray } = require("./modelUtils");

async function getStudentEnrollments(studentId) {
    if (!studentId || !isValidObjectId(studentId) || !hasModelMethod(Enrollment, "find")) {
        // TODO: Replace the placeholder Enrollment model with a Mongoose model to enable progress context.
        return [];
    }

    try {
        let query = Enrollment.find({ studentId });
        query = applyIfAvailable(query, "sort", { enrolledAt: -1 });

        return normalizeArray(await executeQuery(query));
    } catch (error) {
        throw new Error(`Unable to fetch student enrollments: ${error.message}`);
    }
}

module.exports = {
    getStudentEnrollments
};
