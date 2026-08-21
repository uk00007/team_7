const express = require("express");
const router = express.Router();

const { chat } = require("../controllers/coachController");

const authenticate = require("../middleware/authMiddleware");

router.post("/chat", authenticate, chat);
router.get("/recommendation", authenticate, async (req, res, next) => {
    try {
        const { getProactiveRecommendation } = require("../services/coachService");
        const rec = await getProactiveRecommendation(req.user.id);
        res.success(rec, "Recommendation generated");
    } catch (err) { next(err); }
});

module.exports = router;