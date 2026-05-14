const pool = require("../../db.js");
const { geoApi } = require("../../geoapi.js");
const NearestStop = require("./NearestStop.js");

const AddStudent = async (req, res) => {
    const client = await pool.connect();
    try {
        let { name, roll_no, phone, email, address, password, stop_id, morning_route_id, evening_route_id } = req.body;

        // Validate required fields
        if (!name || !roll_no || !address || !password) {
            return res.status(400).json({
                message: "Missing required fields: name, roll_no, address, password",
                success: false
            });
        }

        const addStudentQuery = `
        INSERT INTO students (name, roll_no, phone, email, address, password, stop_id, morning_route_id, evening_route_id) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
        RETURNING *;
        `;

        const result = await client.query(addStudentQuery, [
            name,
            roll_no,
            phone,
            email,
            address,
            password,
            stop_id,
            morning_route_id,
            evening_route_id
        ]);
        const newStudent = result.rows[0];
        // console.log("New student added:", newStudent     
        // const newStudent = result.rows[0];
        await client.query('COMMIT');

        return res.status(201).json({
            message: "Student added successfully.",
            success: true,
            data: newStudent
        });
    }
    catch (err) {
        await client.query('ROLLBACK');

        console.log("error", err)
        return res.status(500).json({
            message: err.message,
            sucess: false
        })
    } finally {
        client.release();
    }
}

module.exports = AddStudent;