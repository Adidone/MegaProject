

const pool = require("../../db.js");

const AddTrip = async (req, res) => {
    const client = await pool.connect();
    try {

        let { route_id, bus_id, driver_id, shift } = req.body;
        
        // Fix for shift_time enum: capitalize first letter (e.g., 'morning' -> 'Morning')
        if (shift) {
            shift = shift.charAt(0).toUpperCase() + shift.slice(1).toLowerCase();
        }

        if (!route_id || !bus_id || !driver_id || !shift) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                message: "Missing required fields: route_id, bus_id, driver_id, shift",
                success: false
            });
        }

        const trip = await client.query(
            "SELECT * FROM trips WHERE route_id = $1 AND shift = $2",
            [route_id, shift]
        );
        if (trip.rows.length > 0) {
            return res.status(400).json({
                message: `A ${shift} trip for this route already exists.`,
                success: false
            });
        }

        const routeCheck = await client.query("SELECT * FROM routes WHERE id = $1", [route_id]);
        if (routeCheck.rows.length === 0) {
            return res.status(404).json({ message: "Route not found", success: false });
        }

        const busCheck = await client.query("SELECT * FROM buses WHERE id = $1", [bus_id]);
        if (busCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: "Bus not found", success: false });
        }

        const driverCheck = await client.query("SELECT * FROM drivers WHERE id = $1", [driver_id]);
        if (driverCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: "Driver not found", success: false });
        }

        const busStatus = busCheck.rows[0].status;
        console.log(busStatus)
        if (busStatus != 'available') {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: "Bus is already scheduled for another trip", success: false });
        }

        const driverStatus = driverCheck.rows[0].status;
        if (driverStatus != 'available') {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: "Driver is already scheduled for another trip", success: false });
        }


        await client.query("UPDATE buses SET status = 'not available' WHERE id = $1", [bus_id]);
        await client.query("UPDATE drivers SET status = 'not available' WHERE id = $1", [driver_id]);


        const addTripQuery = `
        INSERT INTO trips (route_id, bus_id, driver_id, shift) 
        VALUES ($1, $2, $3, $4) 
        RETURNING *;
        `;

        const result = await client.query(addTripQuery, [
            route_id,
            bus_id,
            driver_id,
            shift
        ]);
        const newTrip = result.rows[0];

        await client.query('COMMIT')

        return res.status(201).json({
            message: "Trip Scheduled successfully.",
            success: true,
            data: newTrip
        });
    }
    catch (err) {
        await client.query('ROLLBACK');
        console.log("error", err)
        return res.status(500).json({
            message: err.message,
            success: false
        })
    } finally {
        client.release();
    }
}

module.exports = AddTrip; 