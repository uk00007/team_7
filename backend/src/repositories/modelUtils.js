const mongoose = require("mongoose");

function hasModelMethod(model, methodName) {
    return Boolean(model && typeof model[methodName] === "function");
}

async function executeQuery(query) {
    if (!query) {
        return null;
    }

    if (typeof query.lean === "function") {
        const leanQuery = query.lean();
        return typeof leanQuery.exec === "function" ? leanQuery.exec() : leanQuery;
    }

    if (typeof query.exec === "function") {
        return query.exec();
    }

    return query;
}

function applyIfAvailable(query, methodName, ...args) {
    if (query && typeof query[methodName] === "function") {
        return query[methodName](...args);
    }

    return query;
}

function normalizeArray(value) {
    return Array.isArray(value) ? value : [];
}

function isValidObjectId(value) {
    return Boolean(value && mongoose.Types.ObjectId.isValid(String(value)));
}

module.exports = {
    applyIfAvailable,
    executeQuery,
    hasModelMethod,
    isValidObjectId,
    normalizeArray
};
