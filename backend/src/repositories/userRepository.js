const User = require("../models/User");
const { applyIfAvailable, executeQuery, hasModelMethod, isValidObjectId } = require("./modelUtils");

async function getStudent(studentId) {
    if (!studentId || !isValidObjectId(studentId) || !hasModelMethod(User, "findById")) {
        // TODO: Replace the placeholder User model with a Mongoose model to enable student personalization.
        return null;
    }

    try {
        let query = User.findById(studentId);
        query = applyIfAvailable(
            query,
            "select",
            "name email role teamId totalXP currentLevel currentStreak longestStreak"
        );

        return executeQuery(query);
    } catch (error) {
        throw new Error(`Unable to fetch student profile: ${error.message}`);
    }
}

module.exports = {
    getStudent
};
