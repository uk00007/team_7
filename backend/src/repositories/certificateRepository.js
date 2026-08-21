const Certificate = require("../models/Certificate");
const { applyIfAvailable, executeQuery, hasModelMethod, isValidObjectId, normalizeArray } = require("./modelUtils");

async function getCertificates(studentId) {
    if (!studentId || !isValidObjectId(studentId) || !hasModelMethod(Certificate, "find")) {
        // TODO: Replace the placeholder Certificate model with a Mongoose model to enable certificate context.
        return [];
    }

    try {
        let query = Certificate.find({ studentId });
        query = applyIfAvailable(query, "sort", { issueDate: -1 });

        return normalizeArray(await executeQuery(query));
    } catch (error) {
        throw new Error(`Unable to fetch certificates: ${error.message}`);
    }
}

module.exports = {
    getCertificates
};
