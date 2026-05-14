const pool = require("../../db");

const GetDriverDashboard = async (req, res) => {
    try {
        const { driverId } = req.params;

        if (!driverId) {
            return res.status(400).json({ success: false, message: "Driver ID is required" });
        }

        // 1. Get Trip Info (Route, Bus, Shift)
        const tripRes = await pool.query(`
            SELECT 
                t.id as trip_id,
                t.shift,
                r.name as route_name,
                r.id as route_id,
                b.bus_number,
                b.id as bus_id
            FROM trips t
            JOIN routes r ON t.route_id = r.id
            JOIN buses b ON t.bus_id = b.id
            WHERE t.driver_id = $1
        `, [driverId]);

        if (tripRes.rows.length === 0) {
            return res.status(200).json({
                success: true,
                activeTrip: false,
                message: "No active trip assigned"
            });
        }

        const trip = tripRes.rows[0];

        // 2. Get Route Stats (Stops count, total distance)
        const statsRes = await pool.query(`
            SELECT 
                COUNT(*) as total_stops,
                SUM(distance_from_previous_stop) as total_distance
            FROM route_stops
            WHERE route_id = $1
        `, [trip.route_id]);

        // 3. Get Student Stats for this route/shift
        const studentsRes = await pool.query(`
            SELECT COUNT(*) as total_students
            FROM students
            WHERE (morning_route_id = $1 AND $2 = 'Morning')
               OR (evening_route_id = $1 AND $2 = 'Evening')
        `, [trip.route_id, trip.shift]);

        return res.status(200).json({
            success: true,
            activeTrip: true,
            data: {
                trip_id: trip.trip_id,
                route_name: trip.route_name,
                bus_number: trip.bus_number,
                shift: trip.shift,
                total_stops: parseInt(statsRes.rows[0].total_stops) || 0,
                total_distance: parseFloat(statsRes.rows[0].total_distance) || 0,
                total_students: parseInt(studentsRes.rows[0].total_students) || 0
            }
        });

    } catch (err) {
        console.error("GetDriverDashboard error:", err);
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

module.exports = GetDriverDashboard;
