const pool = require("../../db");

const ClearLocation = async (req, res) => {
    try {
        const { driver_id } = req.body;

        if (!driver_id) {
            return res.status(400).json({
                success: false,
                message: "driver_id is required"
            });
        }

        // Delete driver's live location
        await pool.query(
            "DELETE FROM driver_live_location WHERE driver_id = $1",
            [driver_id]
        );

        return res.json({
            success: true,
            message: "Location data cleared"
        });

    } catch (err) {
        console.error("ClearLocation error:", err);
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

module.exports = ClearLocation;