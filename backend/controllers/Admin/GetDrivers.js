const pool = require("../../db.js");

const GetDrivers = async (req, res) => {
    try {
        // Self-healing: Reset drivers that are 'not available' but have no active trip
        await pool.query(`
            UPDATE drivers 
            SET status = 'available' 
            WHERE status = 'not available' 
            AND id NOT IN (SELECT driver_id FROM trips WHERE driver_id IS NOT NULL)
        `);

        const { search, status } = req.query;
        let query = `
            SELECT 
                d.id, 
                d.name, 
                d.phone, 
                d.email, 
                d.address, 
                d.liscence_no,
                d.status,
                r.name as assigned_route,
                b.bus_number as assigned_bus
            FROM drivers d
            LEFT JOIN trips t ON d.id = t.driver_id
            LEFT JOIN routes r ON t.route_id = r.id
            LEFT JOIN buses b ON t.bus_id = b.id
            WHERE 1=1
        `;
        const params = [];

        if (search) {
            params.push(`%${search}%`);
            query += ` AND (d.name ILIKE $${params.length} OR d.liscence_no ILIKE $${params.length})`;
        }

        if (status && status !== 'All') {
            params.push(status);
            query += ` AND d.status ILIKE $${params.length}`;
        }

        query += ` ORDER BY d.id DESC`;

        const result = await pool.query(query, params);
        return res.status(200).json({
            success: true,
            data: result.rows
        });
    } catch (err) {
        console.error("Error fetching drivers:", err);
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

module.exports = GetDrivers;
