const pool = require("../../db.js");

const StudentLogin = async (req, res) => {
    try {
        const { roll_no, password } = req.body;

        if (!roll_no || !password) {
            return res.status(400).json({
                success: false,
                message: "Roll number and password are required"
            });
        }

        const result = await pool.query(
            `SELECT 
                s.*, 
                st.name as stop_name,
                r1.name as morning_route_name,
                r2.name as evening_route_name
             FROM students s
             LEFT JOIN stops st ON s.stop_id = st.id
             LEFT JOIN routes r1 ON s.morning_route_id = r1.id
             LEFT JOIN routes r2 ON s.evening_route_id = r2.id
             WHERE s.roll_no = $1 AND s.password = $2`,
            [roll_no, password]
        );

        if (result.rows.length > 0) {
            const student = result.rows[0];
            // Remove password from response
            delete student.password;

            return res.status(200).json({
                success: true,
                message: "Logged in successfully",
                data: student
            });
        } else {
            return res.status(401).json({
                success: false,
                message: "Invalid roll number or password"
            });
        }
    } catch (err) {
        console.error("Student login error:", err);
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

module.exports = StudentLogin;
