const pool = require("../../db");

const GetDriverInfo = async (req, res) => {
    try {
        const { studentId } = req.params;

        // Get student's route
        const studentRes = await pool.query(
            "SELECT route_id FROM students WHERE id = $1",
            [studentId]
        );

        if (studentRes.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        const route_id = studentRes.rows[0].route_id;

        // Get driver assigned to this route
        const driverRes = await pool.query(
            `SELECT driver_id, bus_id 
             FROM trips 
             WHERE route_id = $1 
             LIMIT 1`,
            [route_id]
        );

        if (driverRes.rows.length === 0) {
            return res.json({
                success: false,
                message: "No driver assigned to this route"
            });
        }

        return res.json({
            success: true,
            driver_id: driverRes.rows[0].driver_id,
            bus_id: driverRes.rows[0].bus_id
        });

    } catch (err) {
        console.error("GetDriverInfo error:", err);
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

module.exports = GetDriverInfo;