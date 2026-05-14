const pool = require("../../db");

const GetCompletedStops = async (req, res) => {
    try {
        const { driverId } = req.params;

        const result = await pool.query(
            `SELECT s.id, s.name, cs.completed_at, rs.stop_order
             FROM completed_stops cs
             JOIN stops s ON cs.stop_id = s.id
             JOIN route_stops rs ON rs.stop_id = s.id
             WHERE cs.driver_id = $1
             ORDER BY cs.completed_at ASC`,
            [driverId]
        );

        return res.json({
            success: true,
            completed_stops: result.rows,
            total_completed: result.rows.length
        });

    } catch (err) {
        console.error("GetCompletedStops error:", err);
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

module.exports = GetCompletedStops;
