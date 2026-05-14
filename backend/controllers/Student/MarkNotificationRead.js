const pool = require("../../db");

const MarkNotificationRead = async (req, res) => {
    try {
        const { studentId, alertId } = req.body;

        if (!studentId || !alertId) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        await pool.query(
            `INSERT INTO alert_reads (alert_id, user_id, user_type, is_read)
             VALUES ($1, $2, 'student', TRUE)
             ON CONFLICT (alert_id, user_id, user_type)
             DO UPDATE SET is_read = TRUE, read_at = NOW()`,
            [alertId, studentId]
        );

        res.status(200).json({
            success: true,
            message: "Notification marked as read"
        });
    } catch (err) {
        console.error("MarkNotificationRead error:", err);
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

module.exports = MarkNotificationRead;
