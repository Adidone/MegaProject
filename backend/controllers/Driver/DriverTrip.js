const pool = require("../../db");

const DriverTrip = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params; // driver_id
    if (!id) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        message: "Please provide driver id",
        success: false
      });
    }

    // Step 1: Find the trip for this driver
    const tripResult = await client.query(
      "SELECT * FROM trips WHERE driver_id = $1",
      [id]
    );

    if (tripResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        message: "No trip found for this driver",
        success: false
      });
    }

    const route_id = tripResult.rows[0].route_id;
    console.log("🚚 Driver Trip Route ID:", route_id);

    // Step 2: Fetch stops for that route with their distance & coordinates
    const routeStops = await client.query(`
      SELECT 
        rs.stop_order,
        rs.distance_from_previous_stop,
        s.name AS stop_name,
        s.latitude,
        s.longitude
      FROM route_stops rs
      JOIN stops s ON rs.stop_id = s.id
      WHERE rs.route_id = $1
      ORDER BY rs.stop_order ASC
    `, [route_id]);

    if (routeStops.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        message: "No stops found for this route",
        success: false
      });
    }

    // Step 3: Format response data
    const stops = routeStops.rows.map(stop => ({
      order: stop.stop_order,
      name: stop.stop_name,
      latitude: stop.latitude,
      longitude: stop.longitude,
      distance_from_prev_km: stop.distance_from_previous_stop || 0
    }));

    await client.query('COMMIT');
    // Step 4: Send response
    return res.status(200).json({
      message: "Driver trip route data fetched successfully",
      success: true,
      route_id,
      stops
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error in DriverTrip:", error);
    return res.status(500).json({
      message: error.message,
      success: false
    });
  } finally {
    client.release();
  }
};

module.exports = DriverTrip;
