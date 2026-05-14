const pool = require("../../db");

const CreateAlert = async (req, res) => {
    try {
        const { title, message, type, category, target, targetId } = req.body;

        if (!title || !type || !category || !target) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields (Title, Type, Category, and Target are mandatory)"
            });
        }

        const result = await pool.query(
            `INSERT INTO alerts (title, message, type, category, target, target_id)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [title, message, type, category, target, targetId || null]
        );

        res.status(201).json({
            success: true,
            message: "Alert created successfully",
            data: result.rows[0]
        });
    } catch (err) {
        console.error("CreateAlert error:", err);
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

module.exports = CreateAlert;
