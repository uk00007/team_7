const { generateCoachReply } = require("../services/coachService");

const chat = async (req, res) => {
    try {

        const { studentId, message } = req.body;

        if (!studentId || !message) {
            return res.status(400).json({
                success: false,
                message: "studentId and message are required"
            });
        }

        const data = await generateCoachReply(studentId, message);

        res.json({
            success: true,
            message: "Coach response generated.",
            data
        });

    } catch (err) {
        console.error(err);

        res.status(err.statusCode || 500).json({
            success: false,
            message: err.message
        });
    }
};

module.exports = {
    chat
};
