const pool = require("../../db.js");

const GetStops = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT DISTINCT s.*, rs.route_id 
            FROM stops s
            JOIN route_stops rs ON s.id = rs.stop_id
            ORDER BY s.name ASC
        `);
        return res.status(200).json({
            success: true,
            data: result.rows
        });
    } catch (err) {
        console.error("Error fetching stops:", err);
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

module.exports = GetStops;
