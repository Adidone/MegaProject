const pool = require("../../db");

const GetAttendanceStatus = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { shift } = req.query;

        const result = await pool.query(
            `SELECT is_coming, reason, marked_at
             FROM student_attendance
             WHERE student_id = $1 AND date = CURRENT_DATE AND shift = $2`,
            [studentId, shift || 'Morning']
        );

        if (result.rows.length === 0) {
            // No attendance marked = coming by default
            return res.json({
                success: true,
                is_coming: null, // null means default (coming)
                message: "No attendance marked (default: coming)"
            });
        }

        return res.json({
            success: true,
            is_coming: result.rows[0].is_coming,
            reason: result.rows[0].reason,
            marked_at: result.rows[0].marked_at
        });

    } catch (err) {
        console.error("GetAttendanceStatus error:", err);
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

module.exports = GetAttendanceStatus;