
const pool = require("../../db.js");

const AddDriver = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { name, phone, email, address, password, liscence_no } = req.body;
        console.log("Received data:", { name, phone, email, address, password, liscence_no });

        // Validate required fields
        if (!name || !email || !phone || !address || !password || !liscence_no) {
            if (client) await client.query('ROLLBACK');
            return res.status(400).json({
                message: "Missing required fields: name, email, phone, address, password, liscence_no",
                success: false
            });
        }

        const checkEmailQuery = 'SELECT * FROM drivers WHERE email = $1';
        const emailResult = await client.query(checkEmailQuery, [email]);

        if (emailResult.rows.length > 0) {
            if (client) await client.query('ROLLBACK');
            return res.status(400).json({
                message: "Email already exists.",
                success: false
            });
        }

        const addDriverQuery = `
        INSERT INTO drivers (name, phone, email, address, password, liscence_no) 
        VALUES ($1, $2, $3, $4, $5, $6) 
        RETURNING *;
        `;

        const result = await client.query(addDriverQuery, [
            name,
            phone,
            email,
            address,
            password,
            liscence_no,
        ]);
        const newDriver = result.rows[0];
        await client.query('COMMIT');
        return res.status(201).json({
            message: "Driver added successfully.",
            success: true,
            data: newDriver
        });
    }
    catch (err) {
        if (client) await client.query('ROLLBACK');
        console.log("error", err)
        return res.status(500).json({
            message: err.message,
            success: false
        })
    } finally {
        client.release();
    }
}

module.exports = AddDriver; 