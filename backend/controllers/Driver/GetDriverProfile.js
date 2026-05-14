const pool = require("../../db");

const GetDriverProfile = async (req, res) => {
    try {
        const { driverId } = req.params;

        const driverRes = await pool.query(`
            SELECT 
                d.id, 
                d.name, 
                d.phone, 
                d.email, 
                d.address, 
                d.liscence_no,
                d.status,
                (SELECT COUNT(*) FROM trip_history WHERE driver_id = d.id) as total_trips
            FROM drivers d
            WHERE d.id = $1
        `, [driverId]);

        if (driverRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Driver not found" });
        }

        return res.status(200).json({
            success: true,
            data: driverRes.rows[0]
        });

    } catch (err) {
        console.error("GetDriverProfile error:", err);
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

module.exports = GetDriverProfile;
