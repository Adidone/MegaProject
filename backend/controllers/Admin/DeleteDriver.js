const pool = require("../../db");

const DeleteDriver = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if driver is assigned to a trip
        const tripCheck = await pool.query("SELECT * FROM trips WHERE driver_id = $1", [id]);
        if (tripCheck.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Cannot delete driver assigned to an active trip. Please delete the trip first."
            });
        }

        const result = await pool.query("DELETE FROM drivers WHERE id = $1 RETURNING *", [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Driver not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Driver deleted successfully"
        });
    } catch (err) {
        console.error("DeleteDriver error:", err);
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

module.exports = DeleteDriver;
