const pool = require("../../db");

const GetAlerts = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM alerts ORDER BY created_at DESC`
        );

        res.status(200).json({
            success: true,
            data: result.rows
        });
    } catch (err) {
        console.error("GetAlerts error:", err);
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

module.exports = GetAlerts;
