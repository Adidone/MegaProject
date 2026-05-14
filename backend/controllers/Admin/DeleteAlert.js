const pool = require("../../db");

const DeleteAlert = async (req, res) => {
    try {
        const { id } = req.params;

        await pool.query("DELETE FROM alerts WHERE id = $1", [id]);

        res.status(200).json({
            success: true,
            message: "Alert deleted successfully"
        });
    } catch (err) {
        console.error("DeleteAlert error:", err);
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

module.exports = DeleteAlert;
