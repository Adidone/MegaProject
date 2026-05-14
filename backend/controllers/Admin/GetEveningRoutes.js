const pool = require("../../db.js");

const GetEveningRoutes = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, name FROM routes 
            WHERE LOWER(shift::text) = 'evening' 
            ORDER BY name ASC
        `);
        return res.status(200).json({
            success: true,
            data: result.rows
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

module.exports = GetEveningRoutes;
