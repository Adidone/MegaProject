const pool = require("../../db");

const SwapBus = async (req, res) => {
    const client = await pool.connect();
    try {
        const { trip_id, new_bus_id } = req.body;
        
        if (!trip_id || !new_bus_id) {
            return res.status(400).json({
                success: false,
                message: "Missing trip_id or new_bus_id"
            });
        }

        await client.query('BEGIN');

        // 1. Get current trip info
        const tripRes = await client.query("SELECT bus_id FROM trips WHERE id = $1", [trip_id]);
        if (tripRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: "Trip not found" });
        }
        const oldBusId = tripRes.rows[0].bus_id;

        // 2. Check if new bus is available
        const busCheck = await client.query("SELECT status FROM buses WHERE id = $1", [new_bus_id]);
        if (busCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: "New bus not found" });
        }
        if (busCheck.rows[0].status !== 'available') {
            await client.query('ROLLBACK');
            return res.status(400).json({ success: false, message: "New bus is not available" });
        }

        // 3. Update trip with new bus
        await client.query("UPDATE trips SET bus_id = $1 WHERE id = $2", [new_bus_id, trip_id]);

        // 4. Swap statuses
        await client.query("UPDATE buses SET status = 'available' WHERE id = $1", [oldBusId]);
        await client.query("UPDATE buses SET status = 'not available' WHERE id = $1", [new_bus_id]);

        await client.query('COMMIT');
        
        return res.status(200).json({
            success: true,
            message: "Bus swapped successfully"
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error("SwapBus error:", err);
        return res.status(500).json({
            success: false,
            message: err.message
        });
    } finally {
        client.release();
    }
};

module.exports = SwapBus;
