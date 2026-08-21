const Achievement = require("../models/Achievement");
const StudentAchievement = require("../models/StudentAchievement");
const { applyIfAvailable, executeQuery, hasModelMethod, isValidObjectId, normalizeArray } = require("./modelUtils");

async function getAchievements(studentId) {
    if (!studentId || !isValidObjectId(studentId) || !hasModelMethod(StudentAchievement, "find")) {
        // TODO: Replace placeholder achievement models with Mongoose models to enable achievement context.
        return [];
    }

    try {
        let query = StudentAchievement.find({ studentId });
        query = applyIfAvailable(query, "sort", { unlockedAt: -1 });

        if (hasModelMethod(Achievement, "find") && typeof query.populate === "function") {
            query = query.populate("achievementId");
        }

        return normalizeArray(await executeQuery(query));
    } catch (error) {
        throw new Error(`Unable to fetch achievements: ${error.message}`);
    }
}

module.exports = {
    getAchievements
};
