const Activity = require("../models/Activity");
const { applyIfAvailable, executeQuery, hasModelMethod, isValidObjectId, normalizeArray } = require("./modelUtils");

async function getActivities(activityIds) {
    const uniqueIds = [...new Set(normalizeArray(activityIds).filter(Boolean).map(String))]
        .filter(isValidObjectId);

    if (uniqueIds.length === 0 || !hasModelMethod(Activity, "find")) {
        // TODO: Replace the placeholder Activity model with a Mongoose model to enable activity details.
        return [];
    }

    try {
        let query = Activity.find({ _id: { $in: uniqueIds } });
        query = applyIfAvailable(
            query,
            "select",
            "title description type category isMandatory isTeamBased maxXP startDate dueDate certificateRequired status"
        );

        return normalizeArray(await executeQuery(query));
    } catch (error) {
        throw new Error(`Unable to fetch activities: ${error.message}`);
    }
}

module.exports = {
    getActivities
};
