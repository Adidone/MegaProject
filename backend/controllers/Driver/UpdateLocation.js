const pool = require("../../db");

const UpdateLocation = async (req, res) => {
    try {
        const { driver_id, latitude, longitude } = req.body;

        if (!driver_id || !latitude || !longitude) {
            return res.status(400).json({
                message: "driver_id, latitude, longitude are required",
                success: false
            });
        }

        // Get io from request object
        const io = req.io;

        // 1️⃣ Update driver location
        await pool.query(
            `INSERT INTO driver_live_location (driver_id, latitude, longitude, updated_at)
             VALUES ($1, $2, $3, NOW())
             ON CONFLICT (driver_id)
             DO UPDATE SET latitude = EXCLUDED.latitude,
                           longitude = EXCLUDED.longitude,
                           updated_at = NOW();`,
            [driver_id, latitude, longitude]
        );

        // Emit location update to subscribed students
        // Emit location update to subscribed students
        if (io) {
            io.to(`driver-${driver_id}`).emit('location-update', {
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                updated_at: new Date()
            });
            console.log(`📡 Emitted location update for driver ${driver_id}`);
        }

        const routeRes = await pool.query(  
            "SELECT route_id FROM trips WHERE driver_id=$1",
            [driver_id]
        );

        // 2️⃣ Get all incomplete stops for route 4
        const stopsRes = await pool.query(
            `SELECT s.id, s.name, s.latitude, s.longitude, rs.stop_order
             FROM route_stops rs
             JOIN stops s ON rs.stop_id = s.id
             LEFT JOIN completed_stops cs ON cs.stop_id = s.id AND cs.driver_id = $1
             WHERE rs.route_id = $2 AND cs.stop_id IS NULL
             ORDER BY rs.stop_order ASC`,
            [driver_id, routeRes.rows[0].route_id]
        );

        // 3️⃣ Check proximity to each incomplete stop
        const PROXIMITY_THRESHOLD = 0.0005; // ~200 meters
        let completedStops = [];

        for (let stop of stopsRes.rows) {
            const latDiff = stop.latitude - latitude;
            const lngDiff = stop.longitude - longitude;
            const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);

            // If driver is within 200m of this stop, mark as completed
            if (distance <= PROXIMITY_THRESHOLD) {
                await pool.query(
                    `INSERT INTO completed_stops (driver_id, stop_id, completed_at)
                     VALUES ($1, $2, NOW())
                     ON CONFLICT (driver_id, stop_id) DO NOTHING`,
                    [driver_id, stop.id]
                );
                completedStops.push(stop.name);
                console.log(`✅ Stop "${stop.name}" completed by driver ${driver_id}`);
            }
        }

        // Check if all stops completed
        const totalStops = await pool.query(
            "SELECT COUNT(*) FROM route_stops WHERE route_id = $1",
            [routeRes.rows[0].route_id]
        );

        const completedStopss = await pool.query(
            "SELECT COUNT(*) FROM completed_stops WHERE driver_id = $1",
            [driver_id]
        );

        if (parseInt(completedStopss.rows[0].count) === parseInt(totalStops.rows[0].count)) {

            console.log("🚀 Trip Completed Automatically!");

            // Fetch attendance summary
            const attendanceSummary = await pool.query(`
        SELECT 
            COUNT(*) AS total_students,
            COUNT(*) FILTER (WHERE is_coming = TRUE) AS present_students,
            COUNT(*) FILTER (WHERE is_coming = FALSE) AS absent_students
        FROM student_attendance
        WHERE date = CURRENT_DATE;
    `);

            const summary = attendanceSummary.rows[0];

            // Save trip report
            await pool.query(`
        INSERT INTO trip_history 
        (driver_id, route_id, shift, total_students, present_students, absent_students, completed_stops)
        VALUES ($1, $2, $3, $4, $5, $6, $7);
    `, [
                driver_id,
                routeRes.rows[0].route_id,
                'Morning',
                summary.total_students,
                summary.present_students,
                summary.absent_students,
                completedStopss.rows[0].count
            ]);

            // Clear attendance + completed stops
            await pool.query("DELETE FROM todays_attendance;");
            await pool.query("DELETE FROM student_attendance;");
            await pool.query("DELETE FROM completed_stops WHERE driver_id = $1;", [driver_id]);
            
            // Get the bus_id before deleting the trip
            const tripInfo = await pool.query("SELECT bus_id FROM trips WHERE driver_id = $1", [driver_id]);
            const bus_id = tripInfo.rows[0]?.bus_id;

            // Delete the trip from the database
            await pool.query("DELETE FROM trips WHERE driver_id = $1;", [driver_id]);

            // Update bus and driver status back to available
            if (bus_id) {
                await pool.query("UPDATE buses SET status = 'available' WHERE id = $1", [bus_id]);
            }
            await pool.query("UPDATE drivers SET status = 'available' WHERE id = $1", [driver_id]);

            console.log("🧹 Auto-cleared all tables and released resources after trip completion!");
        }

        return res.status(200).json({
            message: "Location updated",
            success: true,
            completed_stops: completedStops,
            trip_completed: parseInt(completedStopss.rows[0].count) === parseInt(totalStops.rows[0].count)
        });

    } catch (err) {
        console.error("UpdateLocation error:", err);
        return res.status(500).json({
            message: err.message,
            success: false
        });
    }
};

module.exports = UpdateLocation;