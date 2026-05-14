const pool = require("../../db");

const MarkAttendance = async (req, res) => {
    try {
        const { student_id, is_coming, shift, reason } = req.body;

        if (!student_id || is_coming === undefined) {
            return res.status(400).json({
                success: false,
                message: "student_id and is_coming are required"
            });
        }

        // Insert or update today's attendance
        const result = await pool.query(
            `INSERT INTO student_attendance (student_id, date, is_coming, shift, reason)
             VALUES ($1, CURRENT_DATE, $2, $3, $4)
             ON CONFLICT (student_id, date, shift)
             DO UPDATE SET 
                is_coming = EXCLUDED.is_coming,
                reason = EXCLUDED.reason,
                marked_at = NOW()
             RETURNING *`,
            [student_id, is_coming, shift || 'Morning', reason]
        );

        return res.json({
            success: true,
            message: is_coming ? "Marked as coming" : "Marked as not coming",
            data: result.rows[0]
        });

    } catch (err) {
        console.error("MarkAttendance error:", err);
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

module.exports = MarkAttendance;