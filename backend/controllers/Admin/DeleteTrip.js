const pool = require("../../db");

const DeleteTrip = async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get the trip info to release the bus and driver
    const tripRes = await client.query("SELECT bus_id, driver_id FROM trips WHERE id = $1", [id]);
    
    if (tripRes.rows.length === 0) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    const { bus_id, driver_id } = tripRes.rows[0];

    // Delete the trip
    await client.query("DELETE FROM trips WHERE id = $1", [id]);

    // Update bus and driver status back to available
    // Note: This is simplified. In a real system you'd check if they have other scheduled trips.
    await client.query("UPDATE buses SET status = 'available' WHERE id = $1", [bus_id]);
    await client.query("UPDATE drivers SET status = 'available' WHERE id = $1", [driver_id]);

    await client.query('COMMIT');
    return res.status(200).json({
      success: true,
      message: "Trip deleted and resources released successfully"
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Delete trip error:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  } finally {
    client.release();
  }
};

module.exports = DeleteTrip;
