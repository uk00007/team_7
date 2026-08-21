const Notification = require("../models/Notification");
const { applyIfAvailable, executeQuery, hasModelMethod, isValidObjectId, normalizeArray } = require("./modelUtils");

async function getNotifications(studentId) {
    if (!studentId || !isValidObjectId(studentId) || !hasModelMethod(Notification, "find")) {
        // TODO: Replace the placeholder Notification model with a Mongoose model to enable notification context.
        return [];
    }

    try {
        let query = Notification.find({ userId: studentId });
        query = applyIfAvailable(query, "sort", { createdAt: -1 });
        query = applyIfAvailable(query, "limit", 10);

        return normalizeArray(await executeQuery(query));
    } catch (error) {
        throw new Error(`Unable to fetch notifications: ${error.message}`);
    }
}

module.exports = {
    getNotifications
};
