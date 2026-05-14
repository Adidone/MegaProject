const pool = require("../../db.js");

const GetStudents = async (req, res) => {
    try {
        const { search, status } = req.query;
        let query = `
            SELECT 
                s.id, 
                s.name, 
                s.roll_no, 
                s.phone, 
                s.email, 
                s.address, 
                s.status,
                st.name as stop_name,
                s.stop_id,
                s.morning_route_id,
                r1.name as morning_route_name,
                s.evening_route_id,
                r2.name as evening_route_name
            FROM students s
            LEFT JOIN stops st ON s.stop_id = st.id
            LEFT JOIN routes r1 ON s.morning_route_id = r1.id
            LEFT JOIN routes r2 ON s.evening_route_id = r2.id
            WHERE 1=1
        `;
        const params = [];

        if (search) {
            params.push(`%${search}%`);
            query += ` AND (s.name ILIKE $${params.length} OR s.roll_no ILIKE $${params.length})`;
        }

        if (status && status !== 'All') {
            params.push(status);
            query += ` AND s.status ILIKE $${params.length}`;
        }

        query += ` ORDER BY s.id DESC`;

        const result = await pool.query(query, params);
        return res.status(200).json({
            success: true,
            data: result.rows
        });
    } catch (err) {
        console.error("Error fetching students:", err);
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

module.exports = GetStudents;
