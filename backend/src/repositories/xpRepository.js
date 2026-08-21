const XPTransaction = require("../models/XPTransaction");
const { applyIfAvailable, executeQuery, hasModelMethod, isValidObjectId, normalizeArray } = require("./modelUtils");

async function getXPTransactions(studentId) {
    if (!studentId || !isValidObjectId(studentId) || !hasModelMethod(XPTransaction, "find")) {
        // TODO: Replace the placeholder XPTransaction model with a Mongoose model to enable XP history.
        return [];
    }

    try {
        let query = XPTransaction.find({ studentId });
        query = applyIfAvailable(query, "sort", { createdAt: -1 });

        return normalizeArray(await executeQuery(query));
    } catch (error) {
        throw new Error(`Unable to fetch XP transactions: ${error.message}`);
    }
}

module.exports = {
    getXPTransactions
};
