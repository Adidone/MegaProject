const pool = require("../../db");

const GetLiveLocations = async (req, res) => {
    try {
        const { driverId } = req.params;

        const result = await pool.query(
            "SELECT driver_id, latitude, longitude, updated_at FROM driver_live_location WHERE driver_id = $1",
            [driverId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: "No location found for this driver" 
            });
        }

        return res.json({
            success: true,
            location: result.rows[0]
        });

    } catch (err) {
        console.error("GetLiveLocations error:", err);
        return res.status(500).json({ 
            success: false,
            message: err.message 
        });
    }
};

module.exports = GetLiveLocations;