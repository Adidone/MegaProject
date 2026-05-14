const pool = require("../../db");

const GetRouteStops = async (req, res) => {
    try {
        const { route_id } = req.params;

        // Get all stops for this route
        const stopsResult = await pool.query(
            `SELECT 
                s.id,
                s.name,
                s.latitude,
                s.longitude,
                rs.stop_order
            FROM route_stops rs
            JOIN stops s ON rs.stop_id = s.id
            WHERE rs.route_id = $1
            ORDER BY rs.stop_order ASC`,
            [route_id]
        );

        // Get driver_id for this route
        const driverResult = await pool.query(
            `SELECT driver_id 
            FROM trips 
            WHERE route_id = $1 
            AND shift = 'Morning'
            LIMIT 1`,
            [route_id]
        );

        let completedStops = [];

        if (driverResult.rows.length > 0) {
            const driver_id = driverResult.rows[0].driver_id;

            // Get completed stops for this driver
            const completedResult = await pool.query(
                `SELECT stop_id 
                FROM completed_stops 
                WHERE driver_id = $1`,
                [driver_id]
            );

            completedStops = completedResult.rows.map(row => row.stop_id);
        }

        return res.status(200).json({
            success: true,
            data: {
                stops: stopsResult.rows,
                completed_stops: completedStops
            }
        });

    } catch (err) {
        console.error("GetRouteStops error:", err);
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

module.exports = GetRouteStops;