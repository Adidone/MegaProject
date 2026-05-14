const pool = require("../../db");

const GetStudentInfo = async (req, res) => {
    try {
        const { studentId } = req.params;

        const result = await pool.query(
            `SELECT 
                s.id,
                s.name,
                s.roll_no,
                s.email,
                s.phone,
                s.stop_id,
                s.stop_name,
                st.latitude as stop_lat,
                st.longitude as stop_lng,
                s.route_id
            FROM students s
            JOIN stops st ON s.stop_id = st.id
            WHERE s.id = $1`,
            [studentId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        return res.json({
            success: true,
            student: result.rows[0]
        });

    } catch (err) {
        console.error("GetStudentInfo error:", err);
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

module.exports = GetStudentInfo;