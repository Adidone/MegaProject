const pool = require("../../db");

const DeleteStudentNotification = async (req, res) => {
    try {
        const { studentId, alertId } = req.body;

        if (!studentId || !alertId) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        // To "delete" for a specific student, we could have a 'deleted_alerts' table
        // Or for now, we'll just implement a simple mark as read.
        // If the user really wants delete, let's create a table for it.
        // Actually, let's just use the 'alert_reads' table with a 'is_deleted' flag?
        // Or keep it simple for now and just do 'Mark as Read'.
        // Let's add 'is_deleted' column to alert_reads.
        
        await pool.query(
            `INSERT INTO alert_reads (alert_id, user_id, user_type, is_deleted)
             VALUES ($1, $2, 'student', TRUE)
             ON CONFLICT (alert_id, user_id, user_type)
             DO UPDATE SET is_deleted = TRUE`,
            [alertId, studentId]
        );

        res.status(200).json({
            success: true,
            message: "Notification deleted for user"
        });
    } catch (err) {
        console.error("DeleteStudentNotification error:", err);
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

module.exports = DeleteStudentNotification;
