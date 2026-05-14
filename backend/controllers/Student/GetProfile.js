const pool = require("../../db");

const GetProfile = async (req, res) => {
    try {
        const { id } = req.params;

        // Get student basic info
        const studentResult = await pool.query(
            `SELECT 
                s.id,
                s.name,
                s.roll_no,
                s.phone,
                s.email,
                s.address,
                s.stop_id,
                s.morning_route_id,
                s.evening_route_id,
                st.name as stop_name,
                st.latitude,
                st.longitude,
                rm.name as morning_route_name,
                re.name as evening_route_name
            FROM students s
            LEFT JOIN stops st ON s.stop_id = st.id
            LEFT JOIN routes rm ON s.morning_route_id = rm.id
            LEFT JOIN routes re ON s.evening_route_id = re.id
            WHERE s.id = $1`,
            [id]
        );

        if (studentResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        const student = studentResult.rows[0];

        // Get today's driver for this student's routes
        const currentShift = new Date().getHours() < 14 ? 'Morning' : 'Evening';
        const driverResult = await pool.query(
            `SELECT 
                t.driver_id,
                d.name as driver_name,
                d.phone as driver_phone,
                b.bus_number,
                t.shift
            FROM trips t
            JOIN drivers d ON d.id = t.driver_id
            JOIN buses b ON t.bus_id = b.id
            WHERE t.route_id IN ($1, $2)
            AND LOWER(t.shift::text) = LOWER($3)
            LIMIT 1`,
            [student.morning_route_id || 0, student.evening_route_id || 0, currentShift]
        );

        let driverData = {
            driver_id: null,
            driver_name: 'Not Assigned',
            bus_number: 'N/A'
        };

        if (driverResult.rows.length > 0) {
            driverData = driverResult.rows[0];
        }

        // Combine student and driver data
        const profileData = {
            ...student,
            ...driverData
        };

        return res.status(200).json({
            success: true,
            data: profileData
        });

    } catch (err) {
        console.error("GetProfile error:", err);
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

module.exports = GetProfile;