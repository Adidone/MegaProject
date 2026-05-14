const pool = require("../../db");


const AddStop = async (req, res) => { 
    const client = await pool.connect();  
    try {
        const {name,latitude,longitude} = req.body;
        if (!name || !latitude || !longitude) {
            await client.query('ROLLBACK');
            return res.status(400).json({ 
                message: 'All fields are required',
                sucess:false 
            });
        }

        const stop = await client.query(
            "SELECT * FROM stops WHERE name = $1",
            [name]  
        )
        if (stop.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ 
                message: 'Stop with this name already exists',
                success: false 
            });
        }

        const addStopQuery = `
            INSERT INTO stops (name, latitude, longitude) 
            VALUES ($1, $2, $3) 
            RETURNING *;
        `;

        const result = await client.query(addStopQuery, [name, latitude, longitude]);
        const newStop = result.rows[0];
        await client.query('COMMIT')

        return res.status(201).json({
            message: 'Stop added successfully',
            success: true,
            data: newStop
        });
    }
    catch (error) {
        console.error(error);
        await client.query('ROLLBACK');
        res.status(500).json({ message: 'Server Error' });
    } finally {
        client.release();
    }
};

module.exports = AddStop;
        