const pool = require("../../db");

const GetStopStudentCount = async (req, res) => {
    try {
        let { driver_id, shift } = req.query;

        if (!shift) {
            const hour = new Date().getHours();
            shift = hour < 14 ? 'Morning' : 'Evening';
        }

        // Ensure proper casing for the DB if needed
        shift = shift.charAt(0).toUpperCase() + shift.slice(1).toLowerCase();

        if (!driver_id) {
            return res.status(400).json({
                success: false,
                message: "driver_id is required"
            });
        }

        // Get driver's route and name
        const driverRoute = await pool.query(
            `SELECT t.route_id, r.name as route_name 
             FROM trips t 
             JOIN routes r ON t.route_id = r.id 
             WHERE t.driver_id = $1 AND LOWER(t.shift::text) = LOWER($2)`,
            [driver_id, shift]
        );

        if (driverRoute.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No active trip found for this driver today.",
                shift: shift
            });
        }

        const { route_id, route_name } = driverRoute.rows[0];

        // Get all stops with student counts for today
        const stopsWithCounts = await pool.query(
            `SELECT 
                st.id as stop_id,
                st.name as stop_name,
                st.latitude,
                st.longitude,
                rs.stop_order,
                COUNT(DISTINCT s.id) as total_students,
                COUNT(DISTINCT CASE 
                    WHEN sa.is_coming = TRUE OR sa.is_coming IS NULL 
                    THEN s.id 
                END) as coming_today,
                COUNT(DISTINCT CASE 
                    WHEN sa.is_coming = FALSE 
                    THEN s.id 
                END) as not_coming_today
            FROM route_stops rs
            JOIN stops st ON rs.stop_id = st.id
            LEFT JOIN students s ON s.stop_id = st.id AND (
                (LOWER($2) = 'morning' AND s.morning_route_id = $1) OR
                (LOWER($2) = 'evening' AND s.evening_route_id = $1)
            )
            LEFT JOIN student_attendance sa ON sa.student_id = s.id 
                AND sa.date = CURRENT_DATE 
                AND LOWER(sa.shift::text) = LOWER($2)
            WHERE rs.route_id = $1
            GROUP BY st.id, st.name, st.latitude, st.longitude, rs.stop_order
            ORDER BY rs.stop_order ASC`,
            [route_id, shift]
        );

        return res.status(200).json({
            success: true,
            data: stopsWithCounts.rows,
            route_name: route_name,
            shift: shift
        });

    } catch (err) {
        console.error("Error in GetStopStudentCount:", err);
        return res.status(500).json({
            success: false,
            message: err.message || "Internal Server Error"
        });
    }
};

module.exports = GetStopStudentCount;