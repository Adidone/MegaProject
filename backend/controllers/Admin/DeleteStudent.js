const pool = require("../../db");

const DeleteStudent = async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query("DELETE FROM students WHERE id = $1 RETURNING *", [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Student deleted successfully"
        });
    } catch (err) {
        console.error("DeleteStudent error:", err);
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

module.exports = DeleteStudent;
