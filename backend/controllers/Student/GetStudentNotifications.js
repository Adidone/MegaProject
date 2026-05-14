const pool = require("../../db");

const GetStudentNotifications = async (req, res) => {
    try {
        const { studentId } = req.params;

        // Get student's route and bus to filter notifications
        const studentRes = await pool.query(
            `SELECT morning_route_id, evening_route_id FROM students WHERE id = $1`,
            [studentId]
        );

        if (studentRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }

        const student = studentRes.rows[0];
        const morningRouteId = student.morning_route_id;
        const eveningRouteId = student.evening_route_id;

        // Fetch alerts targeting 'All', or student's specific routes
        // We'll also check if they've been read
        const alertsRes = await pool.query(
            `SELECT a.*, 
                    COALESCE(ar.is_read, FALSE) as is_read
             FROM alerts a
             LEFT JOIN alert_reads ar ON ar.alert_id = a.id AND ar.user_id = $1 AND ar.user_type = 'student'
             WHERE (a.target = 'All' 
                OR (a.target = 'Specific Route' AND (a.target_id = $2 OR a.target_id = $3)))
                AND (ar.is_deleted IS NULL OR ar.is_deleted = FALSE)
             ORDER BY a.created_at DESC`,
            [studentId, String(morningRouteId), String(eveningRouteId)]
        );

        res.status(200).json({
            success: true,
            data: alertsRes.rows
        });
    } catch (err) {
        console.error("GetStudentNotifications error:", err);
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

module.exports = GetStudentNotifications;
