const axios = require("axios");
const pool = require("../../db");
const { getToken } = require("../../GetToken");
require("dotenv").config();

const MMI_API_KEY = process.env.MMI_API_KEY;

const AddRouteStop = async (req, res) => {
  const client = await pool.connect();
  try {
    const { route_id, stop_id, stop_order } = req.body;
    
    if (!route_id || !stop_id || !stop_order) {
      return res.status(400).json({
        message: "Missing required fields: route_id, stop_id, stop_order",
        success: false,
      });
    }

    await client.query('BEGIN');

    const route = await client.query("SELECT * FROM routes WHERE id = $1", [route_id]);
    const stop = await client.query("SELECT * FROM stops WHERE id = $1", [stop_id]);
    if (route.rows.length === 0 || stop.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: "Route or Stop not found", success: false });
    }

    let distance = 0;

    
    if (stop_order > 1) {
      const prevStopQuery = await client.query(
        `SELECT s.latitude, s.longitude 
         FROM route_stops rs
         JOIN stops s ON rs.stop_id = s.id
         WHERE rs.route_id = $1 AND rs.stop_order = $2`,
        [route_id, stop_order - 1]
      );

      if (prevStopQuery.rows.length > 0) {
        const prevStop = prevStopQuery.rows[0];
        const currentStop = stop.rows[0];

        const token = await getToken();
        const startCoords = `${prevStop.longitude},${prevStop.latitude}`;
        const endCoords = `${currentStop.longitude},${currentStop.latitude}`;

        
        const url = `https://apis.mapmyindia.com/advancedmaps/v1/${MMI_API_KEY}/route_adv/driving/${startCoords};${endCoords}?geometries=polyline&overview=full`;

        console.log("MMI API URL:", url);

        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.routes && response.data.routes.length > 0) {
          const routeData = response.data.routes[0];
          distance = (routeData.distance / 1000).toFixed(2); 
        } else {
          console.error("No route found between stops");
        }
      }
    }

   
    const insertQuery = `
      INSERT INTO route_stops (route_id, stop_id, stop_order, distance_from_previous_stop)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const result = await client.query(insertQuery, [route_id, stop_id, stop_order, distance]);

    await client.query('COMMIT')

    return res.status(201).json({
      message: "RouteStop added successfully",
      route_stop: result.rows[0],
      success: true,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message;
    console.error("Error adding stop to route:", errorMsg);
    return res.status(500).json({
      message: errorMsg || "Internal Server Error",
      success: false,
    });
  } finally {
    client.release();
  }
};

module.exports = AddRouteStop;
