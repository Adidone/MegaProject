const pool = require("../../db");

const GetDriverHistory = async (req, res) => {
    try {
        const { driverId } = req.params;
        const { range } = req.query;

        let dateFilter = "CURRENT_DATE - INTERVAL '30 days'";
        if (range === 'Today') dateFilter = "CURRENT_DATE";
        else if (range === 'Yesterday') dateFilter = "CURRENT_DATE - INTERVAL '1 day'";
        else if (range === 'Last 7 Days') dateFilter = "CURRENT_DATE - INTERVAL '7 days'";

        const historyRes = await pool.query(`
            SELECT 
                th.id,
                r.name as route,
                'FLEET-1' as "busNumber", -- bus_id missing in history schema, using placeholder
                TO_CHAR(th.created_at, 'Mon DD, YYYY') as date,
                TO_CHAR(th.created_at - INTERVAL '1 hour', 'HH:MI AM') as "startTime",
                TO_CHAR(th.created_at, 'HH:MI AM') as "endTime",
                th.total_students as "studentsBoarded",
                '12.4 KM' as distance,
                '4.2 L' as "fuelConsumed",
                'Completed' as status
            FROM trip_history th
            JOIN routes r ON th.route_id = r.id
            WHERE th.driver_id = $1
            AND th.created_at >= ${dateFilter}
            ORDER BY th.created_at DESC
        `, [driverId]);

        // Calculate summary stats
        const statsRes = await pool.query(`
            SELECT 
                COUNT(*) as total_trips,
                SUM(total_students) as total_students,
                AVG(total_students) as avg_students
            FROM trip_history
            WHERE driver_id = $1
        `, [driverId]);

        return res.status(200).json({
            success: true,
            data: historyRes.rows,
            summary: {
                totalTrips: statsRes.rows[0].total_trips || 0,
                totalStudents: statsRes.rows[0].total_students || 0,
                avgStudents: parseFloat(statsRes.rows[0].avg_students || 0).toFixed(1),
                totalDistance: (statsRes.rows[0].total_trips * 12.4).toFixed(1) + ' KM' // Simulated
            }
        });

    } catch (err) {
        console.error("GetDriverHistory error:", err);
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

module.exports = GetDriverHistory;
