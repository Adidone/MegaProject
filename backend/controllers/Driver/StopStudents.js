const pool = require("../../db");

const StopStudents = async (req, res) => {
    try {
        const { stop_ids } = req.body; // Array of stop IDs

        if (!stop_ids || !Array.isArray(stop_ids) || stop_ids.length === 0) {
            return res.status(400).json({
                message: "stop_ids must be a non-empty array",
                success: false
            });
        }

        const getStudentsQuery = `
            SELECT 
                s.id,
                s.name,
                s.email,
                s.phone,
                s.address,
                st.id as stop_id,
                st.name as stop_name,
                st.latitude,
                st.longitude
            FROM students s
            JOIN stops st ON s.stop_id = st.id
            WHERE s.stop_id = ANY($1::int[])
            ORDER BY st.name, s.name ASC;
        `;

        const result = await pool.query(getStudentsQuery, [stop_ids]);

        // Group students by stop
        const studentsByStop = {};
        result.rows.forEach(student => {
            const stopId = student.stop_id;
            if (!studentsByStop[stopId]) {
                studentsByStop[stopId] = {
                    stop_id: stopId,
                    stop_name: student.stop_name,
                    latitude: student.latitude,
                    longitude: student.longitude,
                    students: []
                };
            }
            studentsByStop[stopId].students.push({
                id: student.id,
                name: student.name,
                email: student.email,
                phone: student.phone,
                address: student.address
            });
        });

        return res.status(200).json({
            message: "Students retrieved successfully",
            success: true,
            total_students: result.rows.length,
            stops_count: Object.keys(studentsByStop).length,
            data: Object.values(studentsByStop)
        });

    } catch (err) {
        console.error("StopStudents error:", err);
        return res.status(500).json({
            message: err.message,
            success: false
        });
    }
};

module.exports = StopStudents;