const pool = require("../../db");

const DeleteBus = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if bus is assigned to a trip
        const tripCheck = await pool.query("SELECT * FROM trips WHERE bus_id = $1", [id]);
        if (tripCheck.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Cannot delete bus assigned to an active trip. Please delete the trip first."
            });
        }

        const result = await pool.query("DELETE FROM buses WHERE id = $1 RETURNING *", [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Bus not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Bus deleted successfully"
        });
    } catch (err) {
        console.error("DeleteBus error:", err);
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

module.exports = DeleteBus;
