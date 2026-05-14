const pool = require("../../db");

const ResetRoute = async (req, res) => {
    try {
        const { driver_id } = req.body;

        if (!driver_id) {
            return res.status(400).json({
                success: false,
                message: "driver_id is required"
            });
        }

        // Clear all completed stops for this driver
        await pool.query(
            "DELETE FROM completed_stops WHERE driver_id = $1",
            [driver_id]
        );

        return res.json({
            success: true,
            message: "Route reset successfully. All stops cleared."
        });

    } catch (err) {
        console.error("ResetRoute error:", err);
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

module.exports = ResetRoute;