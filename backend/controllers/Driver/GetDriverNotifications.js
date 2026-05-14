const pool = require("../../db");

const GetDriverNotifications = async (req, res) => {
    try {
        const { driverId } = req.params;

        // Get driver's bus from trips
        const driverRes = await pool.query(
            `SELECT bus_id FROM trips WHERE driver_id = $1`,
            [driverId]
        );

        const busId = driverRes.rows.length > 0 ? driverRes.rows[0].bus_id : null;

        // Fetch alerts targeting 'All', 'Drivers Only', or their specific bus
        const alertsRes = await pool.query(
            `SELECT a.*, 
                    COALESCE(ar.is_read, FALSE) as is_read
             FROM alerts a
             LEFT JOIN alert_reads ar ON ar.alert_id = a.id AND ar.user_id = $1 AND ar.user_type = 'driver'
             WHERE a.target = 'All' 
                OR a.target = 'Drivers Only'
                OR (a.target = 'Specific Bus' AND a.target_id = $2)
             ORDER BY a.created_at DESC`,
            [driverId, busId ? String(busId) : null]
        );

        res.status(200).json({
            success: true,
            data: alertsRes.rows
        });
    } catch (err) {
        console.error("GetDriverNotifications error:", err);
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

module.exports = GetDriverNotifications;
