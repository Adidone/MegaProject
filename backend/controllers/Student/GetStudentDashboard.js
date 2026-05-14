const pool = require("../../db");

const GetStudentDashboard = async (req, res) => {
    try {
        const { studentId } = req.params;

        // 1. Get student info and assigned route
        const studentRes = await pool.query(`
            SELECT 
                s.id, s.name, s.stop_id, st.name as stop_name,
                s.morning_route_id, s.evening_route_id
            FROM students s
            LEFT JOIN stops st ON s.stop_id = st.id
            WHERE s.id = $1
        `, [studentId]);

        if (studentRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }

        const student = studentRes.rows[0];
        const currentHour = new Date().getHours();
        const shift = currentHour < 14 ? 'Morning' : 'Evening';
        const route_id = shift === 'Morning' ? student.morning_route_id : student.evening_route_id;

        if (!route_id) {
            return res.status(200).json({
                success: true,
                message: "No route assigned for current shift",
                data: { activeTrip: false }
            });
        }

        // 2. Get active trip info (Driver, Bus)
        const tripRes = await pool.query(`
            SELECT 
                t.id as trip_id,
                d.name as driver_name,
                d.phone as driver_phone,
                b.bus_number,
                t.status as trip_status,
                t.driver_id
            FROM trips t
            JOIN drivers d ON t.driver_id = d.id
            JOIN buses b ON t.bus_id = b.id
            WHERE t.route_id = $1 AND LOWER(t.shift::text) = LOWER($2)
        `, [route_id, shift]);

        if (tripRes.rows.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No active trip for your route right now",
                data: { activeTrip: false }
            });
        }

        const trip = tripRes.rows[0];

        // 3. Get timeline / progress
        // Find which stops are completed by this driver
        const completedStopsRes = await pool.query(`
            SELECT stop_id FROM completed_stops 
            WHERE driver_id = $1
        `, [trip.driver_id]);
        
        const completedStopIds = completedStopsRes.rows.map(r => r.stop_id);

        // Get all stops for this route to build timeline
        const routeStopsRes = await pool.query(`
            SELECT st.id, st.name, rs.stop_order
            FROM route_stops rs
            JOIN stops st ON rs.stop_id = st.id
            WHERE rs.route_id = $1
            ORDER BY rs.stop_order ASC
        `, [route_id]);

        const timeline = routeStopsRes.rows.map(stop => ({
            name: stop.name,
            isCompleted: completedStopIds.includes(stop.id),
            isStudentStop: stop.id === student.stop_id
        }));

        // Find current position in timeline
        let currentStatus = "Trip Started";
        if (completedStopIds.length > 0) {
            const lastCompletedIdx = routeStopsRes.rows.findIndex(s => s.id === completedStopIds[completedStopIds.length - 1]);
            if (lastCompletedIdx < routeStopsRes.rows.length - 1) {
                currentStatus = `Approaching ${routeStopsRes.rows[lastCompletedIdx + 1].name}`;
            } else {
                currentStatus = "Arriving at Terminal";
            }
        }

        return res.status(200).json({
            success: true,
            data: {
                activeTrip: true,
                bus_number: trip.bus_number,
                driver_name: trip.driver_name,
                driver_phone: trip.driver_phone,
                driver_id: trip.driver_id,
                stop_name: student.stop_name,
                currentStatus,
                timeline,
                shift
            }
        });

    } catch (err) {
        console.error("GetStudentDashboard error:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = GetStudentDashboard;
