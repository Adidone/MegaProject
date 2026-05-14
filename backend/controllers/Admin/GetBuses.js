const pool = require("../../db.js");

const GetBuses = async (req, res) => {
    try {
        // Self-healing: Reset buses that are 'not available' but have no active trip
        await pool.query(`
            UPDATE buses 
            SET status = 'available' 
            WHERE status = 'not available' 
            AND id NOT IN (SELECT bus_id FROM trips WHERE bus_id IS NOT NULL)
        `);

        const { search, status } = req.query;
        let query = `
            SELECT 
                b.*, 
                d.name as driver_name, 
                r.name as route_name,
                (SELECT COUNT(*) FROM students s WHERE s.morning_route_id = r.id OR s.evening_route_id = r.id) as occupancy
            FROM buses b
            LEFT JOIN trips t ON b.id = t.bus_id
            LEFT JOIN drivers d ON t.driver_id = d.id
            LEFT JOIN routes r ON t.route_id = r.id
            WHERE 1=1
        `;
        const params = [];

        if (search) {
            params.push(`%${search}%`);
            query += ` AND (b.bus_number ILIKE $${params.length} OR d.name ILIKE $${params.length})`;
        }

        if (status && status !== 'All') {
            params.push(status);
            query += ` AND b.status ILIKE $${params.length}`;
        }

        query += ` ORDER BY b.id DESC`;

        const result = await pool.query(query, params);
        return res.status(200).json({
            success: true,
            data: result.rows
        });
    } catch (err) {
        console.error("Error fetching buses:", err);
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

module.exports = GetBuses;
